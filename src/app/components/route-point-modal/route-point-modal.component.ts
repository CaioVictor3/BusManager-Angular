import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { RouteService } from '../../services/route.service';
import { NotificationService } from '../../services/notification.service';
import { CepService, CepData } from '../../services/cep.service';
import { RoutePoint } from '../../models/route.model';

declare var bootstrap: any;

@Component({
  selector: 'app-route-point-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-point-modal.component.html',
  styleUrls: ['./route-point-modal.component.css']
})
export class RoutePointModalComponent implements OnInit, OnDestroy {
  @Input() type: 'start' | 'end' = 'start';
  
  private destroy$ = new Subject<void>();
  private modal: any;
  
  isSearchingCep = false;
  
  formData: RoutePoint = {
    cep: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: ''
  };

  constructor(
    private routeService: RouteService,
    private notificationService: NotificationService,
    public cepService: CepService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const modalId = this.type === 'start' ? 'startPointModal' : 'endPointModal';
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
          this.modal = new bootstrap.Modal(modalElement);
        }
      }, 100);
    }

    const point$ = this.type === 'start' ? this.routeService.startPoint$ : this.routeService.endPoint$;
    point$.pipe(takeUntil(this.destroy$)).subscribe(point => {
      if (point) this.formData = { ...point };
    });

    this.cepService.loading$.pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isSearchingCep = loading);

    this.cepService.searchResult$.pipe(
      takeUntil(this.destroy$),
      filter((data): data is CepData => data !== null)
    ).subscribe(data => this.fillFormWithCepData(data));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openModal(): void {
    this.modal?.show();
  }

  onCepChange(cep: string): void {
    const cleanCep = cep.replace(/\D/g, '');
    this.formData.cep = this.cepService.formatCep(cleanCep);
    if (this.cepService.isValidCep(cleanCep)) {
      this.cepService.searchCep(cleanCep);
    }
  }

  private fillFormWithCepData(data: CepData): void {
    this.formData.address = data.logradouro;
    this.formData.neighborhood = data.bairro;
    this.formData.city = data.localidade;
    this.formData.state = data.uf;
    this.notificationService.showToast(`Endereço de ${this.type === 'start' ? 'partida' : 'chegada'} encontrado!`, 'success');
  }

  savePoint(): void {
    if (!this.isFormValid()) {
      this.notificationService.showToast('Preencha todos os campos obrigatórios!', 'error');
      return;
    }

    try {
      if (this.type === 'start') {
        this.routeService.setStartPoint(this.formData);
        this.notificationService.showToast('Ponto de partida salvo com sucesso!', 'success');
      } else {
        this.routeService.setEndPoint(this.formData);
        this.notificationService.showToast('Ponto de chegada salvo com sucesso!', 'success');
      }
      this.modal?.hide();
    } catch (error) {
      this.notificationService.showToast('Erro ao salvar ponto!', 'error');
    }
  }

  closeModal(): void {
    this.modal?.hide();
  }

  getModalId(): string {
    return this.type === 'start' ? 'startPointModal' : 'endPointModal';
  }

  getModalTitle(): string {
    return this.type === 'start' 
      ? '<i class="fas fa-play text-primary me-2"></i>Configurar Ponto de Partida'
      : '<i class="fas fa-flag-checkered text-success me-2"></i>Configurar Ponto de Chegada';
  }

  isFormValid(): boolean {
    return !!(this.formData.address && this.formData.number && this.formData.city);
  }
}
