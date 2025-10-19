import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Driver, DriverLoginRequest, DriverRegisterRequest } from '../models/driver.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentDriverSubject = new BehaviorSubject<Driver | null>(null);
  public currentDriver$ = this.currentDriverSubject.asObservable();

  constructor(private storageService: StorageService) {
    // Carregar driver logado se existir
    const savedDriver = this.storageService.getCurrentDriver();
    if (savedDriver) {
      this.currentDriverSubject.next(savedDriver);
    }
  }

  async login(loginRequest: DriverLoginRequest): Promise<Driver | null> {
    const drivers = this.storageService.getDrivers();
    const driver = drivers.find(d => d.email === loginRequest.email && d.password === loginRequest.password);
    
    if (driver) {
      this.currentDriverSubject.next(driver);
      this.storageService.saveCurrentDriver(driver);
      console.log('Driver autenticado:', driver.name);
      return driver;
    }
    
    console.log('Falha na autenticação para email:', loginRequest.email);
    return null;
  }

  async register(registerRequest: DriverRegisterRequest): Promise<boolean> {
    const drivers = this.storageService.getDrivers();
    const exists = drivers.find(d => d.email === registerRequest.email);
    
    if (exists) {
      console.log('Email já cadastrado:', registerRequest.email);
      return false;
    }

    const newDriver: Driver = {
      id: Date.now(),
      ...registerRequest,
      createdAt: new Date().toISOString()
    };

    drivers.push(newDriver);
    this.storageService.saveDrivers(drivers);
    console.log('Driver cadastrado com sucesso:', newDriver.name);
    return true;
  }

  logout(): void {
    this.currentDriverSubject.next(null);
    this.storageService.clearCurrentDriver();
  }

  getCurrentDriver(): Driver | null {
    return this.currentDriverSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentDriverSubject.value !== null;
  }
}
