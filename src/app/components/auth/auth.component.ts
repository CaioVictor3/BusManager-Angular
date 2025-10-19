import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DriverLoginRequest, DriverRegisterRequest } from '../../models/driver.model';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  activeTab: 'login' | 'register' = 'login';
  
  // Login form
  loginForm = {
    email: '',
    password: ''
  };
  
  // Register form
  registerForm = {
    name: '',
    phone: '',
    email: '',
    password: '',
    vehicle: ''
  };

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar se já está logado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  setActiveTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
  }

  async onLogin(): Promise<void> {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.notificationService.showToast('Preencha todos os campos!', 'error');
      return;
    }

    try {
      const loginRequest: DriverLoginRequest = {
        email: this.loginForm.email,
        password: this.loginForm.password
      };

      const driver = await this.authService.login(loginRequest);
      
      if (driver) {
        this.notificationService.showToast('Login realizado com sucesso!', 'success');
        this.router.navigate(['/dashboard']);
      } else {
        this.notificationService.showToast('Email ou senha incorretos!', 'error');
      }
    } catch (error) {
      this.notificationService.showToast('Erro ao fazer login. Tente novamente.', 'error');
    }
  }

  async onRegister(): Promise<void> {
    if (!this.registerForm.name || !this.registerForm.phone || 
        !this.registerForm.email || !this.registerForm.password || 
        !this.registerForm.vehicle) {
      this.notificationService.showToast('Preencha todos os campos!', 'error');
      return;
    }

    try {
      const registerRequest: DriverRegisterRequest = {
        name: this.registerForm.name,
        phone: this.registerForm.phone,
        email: this.registerForm.email,
        password: this.registerForm.password,
        vehicle: this.registerForm.vehicle
      };

      const success = await this.authService.register(registerRequest);
      
      if (success) {
        this.notificationService.showToast('Cadastro realizado com sucesso! Faça login.', 'success');
        this.registerForm = {
          name: '',
          phone: '',
          email: '',
          password: '',
          vehicle: ''
        };
        this.setActiveTab('login');
      } else {
        this.notificationService.showToast('Erro ao cadastrar. Email já existe!', 'error');
      }
    } catch (error) {
      this.notificationService.showToast('Erro ao cadastrar. Tente novamente.', 'error');
    }
  }
}
