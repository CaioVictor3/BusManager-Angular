import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Driver } from '../models/driver.model';
import { Student } from '../models/student.model';
import { RoutePoint } from '../models/route.model';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Driver methods
  saveDrivers(drivers: Driver[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(APP_CONFIG.STORAGE.driversKey, JSON.stringify(drivers));
    }
  }

  getDrivers(): Driver[] {
    if (!this.isBrowser()) return [];
    
    const stored = localStorage.getItem(APP_CONFIG.STORAGE.driversKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Erro ao carregar drivers do localStorage:', error);
        localStorage.removeItem(APP_CONFIG.STORAGE.driversKey);
        return [];
      }
    }
    return [];
  }

  saveCurrentDriver(driver: Driver): void {
    if (this.isBrowser()) {
      localStorage.setItem(APP_CONFIG.STORAGE.currentDriverKey, JSON.stringify(driver));
    }
  }

  getCurrentDriver(): Driver | null {
    if (!this.isBrowser()) return null;
    
    const stored = localStorage.getItem(APP_CONFIG.STORAGE.currentDriverKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Erro ao carregar driver atual:', error);
        localStorage.removeItem(APP_CONFIG.STORAGE.currentDriverKey);
        return null;
      }
    }
    return null;
  }

  clearCurrentDriver(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(APP_CONFIG.STORAGE.currentDriverKey);
    }
  }

  // Student methods
  saveStudents(students: Student[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(APP_CONFIG.STORAGE.studentsKey, JSON.stringify(students));
    }
  }

  getStudents(): Student[] {
    if (!this.isBrowser()) return [];
    
    const stored = localStorage.getItem(APP_CONFIG.STORAGE.studentsKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Erro ao carregar alunos do localStorage:', error);
        localStorage.removeItem(APP_CONFIG.STORAGE.studentsKey);
        return [];
      }
    }
    return [];
  }

  // Route points methods
  saveRoutePoints(startPoint: RoutePoint | null, endPoint: RoutePoint | null): void {
    if (this.isBrowser()) {
      const routePoints = {
        startPoint,
        endPoint
      };
      localStorage.setItem(APP_CONFIG.STORAGE.routePointsKey, JSON.stringify(routePoints));
    }
  }

  getRoutePoints(): { startPoint: RoutePoint | null; endPoint: RoutePoint | null } {
    if (!this.isBrowser()) return { startPoint: null, endPoint: null };
    
    const stored = localStorage.getItem(APP_CONFIG.STORAGE.routePointsKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Erro ao carregar pontos de rota:', error);
        localStorage.removeItem(APP_CONFIG.STORAGE.routePointsKey);
        return { startPoint: null, endPoint: null };
      }
    }
    return { startPoint: null, endPoint: null };
  }

  // Utility methods
  clearAllData(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(APP_CONFIG.STORAGE.driversKey);
      localStorage.removeItem(APP_CONFIG.STORAGE.studentsKey);
      localStorage.removeItem(APP_CONFIG.STORAGE.currentDriverKey);
      localStorage.removeItem(APP_CONFIG.STORAGE.routePointsKey);
    }
  }

  getStorageInfo(): { driversCount: number; studentsCount: number; currentDriver: string } {
    const drivers = this.getDrivers();
    const students = this.getStudents();
    const currentDriver = this.getCurrentDriver();
    
    return {
      driversCount: drivers.length,
      studentsCount: students.length,
      currentDriver: currentDriver ? currentDriver.name : 'Nenhum'
    };
  }
}
