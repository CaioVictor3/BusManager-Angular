import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { RouteService } from '../../services/route.service';
import { NotificationService } from '../../services/notification.service';
import { OSMIntegrationService } from '../../services/osm-integration.service';
import { Driver } from '../../models/driver.model';
import { Student } from '../../models/student.model';
import { RoutePoint } from '../../models/route.model';
import { StudentListComponent } from '../student-list/student-list.component';
import { StudentModalComponent } from '../student-modal/student-modal.component';
import { RoutePointModalComponent } from '../route-point-modal/route-point-modal.component';
import { RouteViewModalComponent } from '../route-view-modal/route-view-modal.component';
import { NotificationToastComponent } from '../notification-toast/notification-toast.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StudentListComponent,
    StudentModalComponent,
    RoutePointModalComponent,
    RouteViewModalComponent,
    NotificationToastComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @ViewChild('startPointModal') startPointModal!: RoutePointModalComponent;
  @ViewChild('endPointModal') endPointModal!: RoutePointModalComponent;
  
  currentDriver: Driver | null = null;
  students: Student[] = [];
  startPoint: RoutePoint | null = null;
  endPoint: RoutePoint | null = null;
  canStartRoute = false;
  canViewRoute = false;
  hasCalculatedRoute = false;

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private routeService: RouteService,
    private notificationService: NotificationService,
    private osmIntegrationService: OSMIntegrationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar autenticação
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Subscrever aos observables
    this.authService.currentDriver$
      .pipe(takeUntil(this.destroy$))
      .subscribe(driver => {
        this.currentDriver = driver;
      });

    this.studentService.students$
      .pipe(takeUntil(this.destroy$))
      .subscribe(students => {
        this.students = students;
        this.updateRouteButtons();
      });

    this.routeService.startPoint$
      .pipe(takeUntil(this.destroy$))
      .subscribe(startPoint => {
        this.startPoint = startPoint;
        this.updateRouteButtons();
      });

    this.routeService.endPoint$
      .pipe(takeUntil(this.destroy$))
      .subscribe(endPoint => {
        this.endPoint = endPoint;
        this.updateRouteButtons();
      });

    this.routeService.routeData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(routeData => {
        this.hasCalculatedRoute = routeData !== null;
        this.updateRouteButtons();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.showToast('Logout realizado com sucesso!', 'info');
    this.router.navigate(['/auth']);
  }

  private updateRouteButtons(): void {
    const hasStudents = this.students.length > 0;
    const hasGoingStudents = this.students.some(s => s.going);
    const hasStartPoint = this.startPoint && this.startPoint.address && this.startPoint.number && this.startPoint.city;
    const hasEndPoint = this.endPoint && this.endPoint.address && this.endPoint.number && this.endPoint.city;

    this.canStartRoute = !!(hasStudents && hasStartPoint && hasEndPoint && hasGoingStudents);
    this.canViewRoute = !!(hasStudents && hasStartPoint && hasEndPoint);
  }

  getDriverInfo(): string {
    if (this.currentDriver) {
      return `${this.currentDriver.name} - ${this.currentDriver.phone}`;
    }
    return '';
  }

  getVehicleInfo(): string {
    if (this.currentDriver) {
      return `Veículo: ${this.currentDriver.vehicle}`;
    }
    return '';
  }

  getStartPointDisplay(): string {
    if (this.startPoint) {
      let displayText = `${this.startPoint.address}, ${this.startPoint.number}`;
      if (this.startPoint.neighborhood) {
        displayText += `, ${this.startPoint.neighborhood}`;
      }
      displayText += ` - ${this.startPoint.city}`;
      if (this.startPoint.state) {
        displayText += `/${this.startPoint.state}`;
      }
      return displayText;
    }
    return 'Não configurado';
  }

  getEndPointDisplay(): string {
    if (this.endPoint) {
      let displayText = `${this.endPoint.address}, ${this.endPoint.number}`;
      if (this.endPoint.neighborhood) {
        displayText += `, ${this.endPoint.neighborhood}`;
      }
      displayText += ` - ${this.endPoint.city}`;
      if (this.endPoint.state) {
        displayText += `/${this.endPoint.state}`;
      }
      return displayText;
    }
    return 'Não configurado';
  }

  getStartPointClass(): string {
    return this.startPoint ? 'text-success' : 'text-muted';
  }

  getEndPointClass(): string {
    return this.endPoint ? 'text-success' : 'text-muted';
  }

  async startRoute(): Promise<void> {
    const goingStudents = this.students.filter(s => s.going);
    if (goingStudents.length === 0) {
      this.notificationService.showToast('Nenhum aluno marcado para ir à aula!', 'error');
      return;
    }

    if (!this.startPoint) {
      this.notificationService.showToast('Configure o ponto de partida primeiro!', 'error');
      return;
    }

    if (!this.endPoint) {
      this.notificationService.showToast('Configure o ponto de chegada primeiro!', 'error');
      return;
    }

    try {
      this.notificationService.showToast('Calculando rota e abrindo Google Maps...', 'info');
      
      // Calcular rota
      const routeData = await this.routeService.calculateAndDisplayRoute(goingStudents);
      
      // Abrir diretamente o Google Maps com a rota
      this.osmIntegrationService.startNavigation(routeData);
      
      this.notificationService.showToast('Navegação iniciada no Google Maps!', 'success');
    } catch (error: any) {
      console.error('Erro ao calcular rota:', error);
      this.notificationService.showToast(`Erro ao calcular rota: ${error.message}`, 'error');
    }
  }

  viewRoute(): void {
    const goingStudents = this.students.filter(s => s.going);
    if (goingStudents.length === 0) {
      this.notificationService.showToast('Nenhum aluno marcado para ir à aula!', 'error');
      return;
    }

    if (!this.startPoint || !this.endPoint) {
      this.notificationService.showToast('Configure os pontos de partida e chegada primeiro!', 'error');
      return;
    }

    // O modal será aberto pelo componente de visualização de rota
    // Aqui apenas verificamos se as condições estão atendidas
  }

  openStartPointModal(): void {
    if (this.startPointModal) {
      this.startPointModal.openModal();
    }
  }

  openEndPointModal(): void {
    if (this.endPointModal) {
      this.endPointModal.openModal();
    }
  }
}
