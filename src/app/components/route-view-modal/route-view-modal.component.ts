import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { RouteService } from '../../services/route.service';
import { StudentService } from '../../services/student.service';
import { OSMIntegrationService } from '../../services/osm-integration.service';
import { NotificationService } from '../../services/notification.service';
import { RouteData } from '../../models/route.model';

declare var bootstrap: any;

@Component({
  selector: 'app-route-view-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-view-modal.component.html',
  styleUrls: ['./route-view-modal.component.css']
})
export class RouteViewModalComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private modal: any;
  
  routeData: RouteData | null = null;
  isCalculating = false;

  constructor(
    private routeService: RouteService,
    private studentService: StudentService,
    private osmIntegrationService: OSMIntegrationService,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Inicializar modal Bootstrap apenas no browser
    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('routeModal');
      if (modalElement) {
        this.modal = new bootstrap.Modal(modalElement);
      }
    }

    // Subscrever aos dados da rota
    this.routeService.routeData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(routeData => {
        this.routeData = routeData;
      });
  }

  ngAfterViewInit(): void {
    // Aguardar o modal ser mostrado para inicializar o mapa
    if (isPlatformBrowser(this.platformId)) {
      const modalElement = document.getElementById('routeModal');
      if (modalElement) {
        modalElement.addEventListener('shown.bs.modal', () => {
          this.initMap();
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openModal(): void {
    this.modal?.show();
  }

  private initMap(): void {
    try {
      // Inicializar mapa usando OSM Integration
      this.osmIntegrationService.initMap('map', {
        center: [-23.5505, -46.6333],
        zoom: 12
      });

      // Se já temos uma rota calculada, exibir no mapa
      if (this.routeData && this.routeData.points) {
        this.displayRouteOnMap();
      } else {
        // Calcular rota se ainda não foi calculada
        this.calculateAndDisplayRoute();
      }
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      this.notificationService.showToast('Erro ao carregar mapa', 'error');
    }
  }

  private async calculateAndDisplayRoute(): Promise<void> {
    try {
      this.isCalculating = true;
      this.notificationService.showToast('Calculando rota...', 'info');
      
      const students = this.studentService.getGoingStudents();
      if (students.length === 0) {
        this.notificationService.showToast('Nenhum aluno marcado para ir à aula!', 'error');
        return;
      }

      const startPoint = this.routeService.getStartPoint();
      const endPoint = this.routeService.getEndPoint();
      
      if (!startPoint || !endPoint) {
        this.notificationService.showToast('Configure os pontos de partida e chegada primeiro!', 'error');
        return;
      }

      // Calcular rota usando OSM Integration
      const routeData = await this.osmIntegrationService.calculateAndDisplayRoute(
        students,
        startPoint,
        endPoint,
        'map'
      );
      
      this.notificationService.showToast('Rota calculada e exibida no mapa!', 'success');
    } catch (error: any) {
      console.error('Erro ao calcular rota:', error);
      this.notificationService.showToast(`Erro ao calcular rota: ${error.message}`, 'error');
    } finally {
      this.isCalculating = false;
    }
  }

  private displayRouteOnMap(): void {
    if (this.routeData && this.routeData.points) {
      // Adicionar marcadores
      this.osmIntegrationService.addMarkers(this.routeData.points);
      
      // Desenhar rota se disponível
      if (this.routeData.geometry) {
        this.osmIntegrationService.drawRoute(this.routeData);
      }
    }
  }

  async recalculateRoute(): Promise<void> {
    try {
      this.isCalculating = true;
      this.notificationService.showToast('Recalculando rota...', 'info');
      
      // Limpar rota atual
      this.routeService.clearRoute();
      this.osmIntegrationService.clearMap();
      
      // Recalcular rota
      await this.calculateAndDisplayRoute();
    } catch (error: any) {
      console.error('Erro ao recalcular rota:', error);
      this.notificationService.showToast(`Erro ao recalcular rota: ${error.message}`, 'error');
    } finally {
      this.isCalculating = false;
    }
  }

  startNavigation(): void {
    try {
      if (this.routeData) {
        this.osmIntegrationService.startNavigation(this.routeData);
        this.notificationService.showToast('Navegação iniciada no Google Maps!', 'success');
      } else {
        this.notificationService.showToast('Nenhuma rota disponível para navegação!', 'error');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar navegação:', error);
      this.notificationService.showToast('Erro ao abrir navegação no Google Maps!', 'error');
    }
  }

  closeModal(): void {
    this.modal?.hide();
  }

  canStartNavigation(): boolean {
    return this.routeData !== null && !this.isCalculating;
  }

  canRecalculate(): boolean {
    return !this.isCalculating;
  }

  getRouteOrder(): any[] {
    if (this.routeData && this.routeData.points) {
      return this.routeData.points.map((point, index) => ({
        ...point,
        index: index + 1
      }));
    }
    return [];
  }

  getRouteSummary(): any {
    return this.routeData?.summary || null;
  }
}
