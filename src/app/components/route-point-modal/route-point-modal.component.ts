import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { RouteService } from '../../services/route.service';
import { NotificationService } from '../../services/notification.service';
import { CepService } from '../../services/cep.service';
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
  private searchTimeout: any;
  
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
    private cepService: CepService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Inicializar modal Bootstrap apenas no browser
    if (isPlatformBrowser(this.platformId)) {
      // Aguardar o DOM estar pronto
      setTimeout(() => {
        const modalId = this.type === 'start' ? 'startPointModal' : 'endPointModal';
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
          this.modal = new bootstrap.Modal(modalElement);
        }
      }, 100);
    }

    // Subscrever aos dados existentes
    if (this.type === 'start') {
      this.routeService.startPoint$
        .pipe(takeUntil(this.destroy$))
        .subscribe(point => {
          if (point) {
            this.formData = { ...point };
          }
        });
    } else {
      this.routeService.endPoint$
        .pipe(takeUntil(this.destroy$))
        .subscribe(point => {
          if (point) {
            this.formData = { ...point };
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpar timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  openModal(): void {
    if (this.modal) {
      this.modal.show();
    } else {
      // Tentar inicializar novamente
      if (isPlatformBrowser(this.platformId)) {
        const modalId = this.type === 'start' ? 'startPointModal' : 'endPointModal';
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
          this.modal = new bootstrap.Modal(modalElement);
          this.modal.show();
        }
      }
    }
  }

  async searchCep(): Promise<void> {
    // Evitar múltiplas requisições simultâneas
    if (this.isSearchingCep) {
      return;
    }

    const cleanCep = this.formData.cep?.replace(/\D/g, '') || '';
    
    if (!cleanCep) {
      this.notificationService.showToast('Digite um CEP!', 'error');
      return;
    }
    
    if (cleanCep.length !== 8) {
      this.notificationService.showToast('CEP deve ter 8 dígitos!', 'error');
      return;
    }

    this.isSearchingCep = true;

    try {
      const data = await this.cepService.searchCep(cleanCep);
      
      if (data) {
        this.fillFormWithCepData(data);
        this.notificationService.showToast(
          `Endereço de ${this.type === 'start' ? 'partida' : 'chegada'} encontrado!`, 
          'success'
        );
      }
    } catch (error: any) {
      console.error('Erro ao buscar CEP:', error);
      this.notificationService.showToast(error.message || 'Erro ao buscar CEP. Tente novamente.', 'error');
    } finally {
      this.isSearchingCep = false;
    }
  }

  private fillFormWithCepData(data: any): void {
    this.formData.address = data.logradouro || '';
    this.formData.neighborhood = data.bairro || '';
    this.formData.city = data.localidade || '';
    this.formData.state = data.uf || '';
  }

  formatCep(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    this.formData.cep = value;
    
    // Limpar timeout anterior
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Buscar automaticamente quando CEP estiver completo (8 dígitos)
    if (value.replace(/\D/g, '').length === 8) {
      // Delay reduzido para busca mais rápida
      this.searchTimeout = setTimeout(() => {
        this.searchCep();
      }, 200);
    }
  }

  savePoint(): void {
    if (!this.formData.address || !this.formData.number || !this.formData.city) {
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

  getSaveButtonClass(): string {
    const baseClass = this.type === 'start' ? 'btn-primary' : 'btn-success';
    const disabledClass = 'btn-secondary';
    
    return this.isFormValid() ? baseClass : disabledClass;
  }

  getSaveButtonText(): string {
    return this.type === 'start' 
      ? '<i class="fas fa-save me-1"></i>Salvar Ponto de Partida'
      : '<i class="fas fa-save me-1"></i>Salvar Ponto de Chegada';
  }

  getCepFieldId(): string {
    return this.type === 'start' ? 'modalStartCep' : 'modalEndCep';
  }

  getAddressFieldId(): string {
    return this.type === 'start' ? 'modalStartAddress' : 'modalEndAddress';
  }

  getNumberFieldId(): string {
    return this.type === 'start' ? 'modalStartNumber' : 'modalEndNumber';
  }

  getNeighborhoodFieldId(): string {
    return this.type === 'start' ? 'modalStartNeighborhood' : 'modalEndNeighborhood';
  }

  getCityFieldId(): string {
    return this.type === 'start' ? 'modalStartCity' : 'modalEndCity';
  }

  getStateFieldId(): string {
    return this.type === 'start' ? 'modalStartState' : 'modalEndState';
  }

  getSearchCepButtonId(): string {
    return this.type === 'start' ? 'searchModalStartCepBtn' : 'searchModalEndCepBtn';
  }

  isFormValid(): boolean {
    return !!(this.formData.address && this.formData.number && this.formData.city);
  }
}
