import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { RouteService } from '../../services/route.service';
import { NotificationService } from '../../services/notification.service';
import { OSMIntegrationService } from '../../services/osm-integration.service';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    (window as any).bootstrap = {
      Modal: class {
        constructor(element: any) {}
        show() {}
        hide() {}
      }
    };

    const authServiceStub = {
      isAuthenticated: () => true,
      currentDriver$: of({ name: 'Test Driver', phone: '123456789', vehicle: 'Test Vehicle' }),
      logout: () => {}
    };

    const studentServiceStub = {
      students$: of([])
    };

    const routeServiceStub = {
      startPoint$: of(null),
      endPoint$: of(null),
      routeData$: of(null)
    };

    const notificationServiceStub = {
      showToast: () => {},
      notifications$: of([])
    };

    const osmIntegrationServiceStub = {
      startNavigation: () => {}
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: authServiceStub },
        { provide: StudentService, useValue: studentServiceStub },
        { provide: RouteService, useValue: routeServiceStub },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: OSMIntegrationService, useValue: osmIntegrationServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.navbar-brand')?.textContent).toContain('Bus Manager');
  });
});
