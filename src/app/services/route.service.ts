import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoutePoint, RouteData, RoutePointWithCoordinates, OSMGeocodeResponse, OSRMRouteResponse } from '../models/route.model';
import { Student } from '../models/student.model';
import { StorageService } from './storage.service';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private startPointSubject = new BehaviorSubject<RoutePoint | null>(null);
  private endPointSubject = new BehaviorSubject<RoutePoint | null>(null);
  private routeDataSubject = new BehaviorSubject<RouteData | null>(null);

  public startPoint$ = this.startPointSubject.asObservable();
  public endPoint$ = this.endPointSubject.asObservable();
  public routeData$ = this.routeDataSubject.asObservable();

  constructor(private storageService: StorageService) {
    // Carregar pontos de rota salvos
    const { startPoint, endPoint } = this.storageService.getRoutePoints();
    this.startPointSubject.next(startPoint);
    this.endPointSubject.next(endPoint);
  }

  getStartPoint(): RoutePoint | null {
    return this.startPointSubject.value;
  }

  getEndPoint(): RoutePoint | null {
    return this.endPointSubject.value;
  }

  getRouteData(): RouteData | null {
    return this.routeDataSubject.value;
  }

  setStartPoint(point: RoutePoint): void {
    this.startPointSubject.next(point);
    this.saveRoutePoints();
  }

  setEndPoint(point: RoutePoint): void {
    this.endPointSubject.next(point);
    this.saveRoutePoints();
  }

  private saveRoutePoints(): void {
    this.storageService.saveRoutePoints(
      this.getStartPoint(),
      this.getEndPoint()
    );
  }

  buildFullAddress(point: RoutePoint): string {
    let address = `${point.address}, ${point.number}`;
    if (point.neighborhood) {
      address += `, ${point.neighborhood}`;
    }
    address += `, ${point.city}`;
    if (point.state) {
      address += ` - ${point.state}`;
    }
    return address;
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    const url = `${APP_CONFIG.OSM.nominatimUrl}/search?format=json&q=${encodeURIComponent(address)}&countrycodes=${APP_CONFIG.OSM.countryCode}&limit=1`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': APP_CONFIG.OSM.userAgent
        }
      });
      
      const data: OSMGeocodeResponse = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
      }
      
      throw new Error('Endereço não encontrado');
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      throw error;
    }
  }

  async geocodeMultipleAddresses(addresses: string[]): Promise<Array<{ lat: number; lng: number } | null>> {
    const results: Array<{ lat: number; lng: number } | null> = [];
    
    for (let i = 0; i < addresses.length; i++) {
      try {
        const result = await this.geocodeAddress(addresses[i]);
        results.push(result);
        
        // Delay entre requisições para respeitar rate limits
        if (i < addresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, APP_CONFIG.OSM.geocodeDelay));
        }
      } catch (error) {
        console.error(`Erro ao geocodificar endereço ${i + 1}:`, error);
        results.push(null);
      }
    }
    
    return results;
  }

  async calculateRoute(coordinates: Array<{ lat: number; lng: number }>): Promise<OSRMRouteResponse> {
    const coordinatesString = coordinates.map(coord => `${coord.lng},${coord.lat}`).join(';');
    const url = `${APP_CONFIG.OSM.osrmUrl}/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;
    
    try {
      const response = await fetch(url);
      const data: OSRMRouteResponse = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('Não foi possível calcular a rota');
      }
      
      return data;
    } catch (error) {
      console.error('Erro no cálculo da rota:', error);
      throw error;
    }
  }

  async calculateAndDisplayRoute(students: Student[]): Promise<RouteData> {
    const startPoint = this.getStartPoint();
    const endPoint = this.getEndPoint();
    
    if (!startPoint || !endPoint) {
      throw new Error('Pontos de partida e chegada devem estar configurados');
    }

    const goingStudents = students.filter(s => s.going);
    if (goingStudents.length === 0) {
      throw new Error('Nenhum aluno marcado para ir à aula');
    }

    // Preparar endereços para geocodificação
    const addresses = [
      this.buildFullAddress(startPoint),
      ...goingStudents.map(student => this.buildFullAddress(student as RoutePoint)),
      this.buildFullAddress(endPoint)
    ];

    // Geocodificar todos os endereços
    const coordinates = await this.geocodeMultipleAddresses(addresses);
    
    // Filtrar coordenadas válidas
    const validCoordinates = coordinates.filter(coord => coord !== null) as Array<{ lat: number; lng: number }>;
    
    if (validCoordinates.length < 2) {
      throw new Error('Não foi possível geocodificar endereços suficientes');
    }

    // Calcular rota
    const routeResponse = await this.calculateRoute(validCoordinates);
    const route = routeResponse.routes[0];
    const waypoints = routeResponse.waypoints;

    // Construir pontos da rota
    const routePoints: RoutePointWithCoordinates[] = [];
    
    // Ponto de partida
    if (validCoordinates[0]) {
      routePoints.push({
        ...startPoint,
        coordinates: validCoordinates[0],
        name: 'Ponto de Partida',
        type: 'start',
        order: 0
      } as RoutePointWithCoordinates);
    }

    // Alunos
    let studentIndex = 0;
    for (let i = 1; i < validCoordinates.length - 1; i++) {
      if (validCoordinates[i] && studentIndex < goingStudents.length) {
        const student = goingStudents[studentIndex];
        routePoints.push({
          ...student,
          coordinates: validCoordinates[i],
          name: student.name,
          type: 'student',
          order: i,
          phone: student.phone
        } as RoutePointWithCoordinates);
        studentIndex++;
      }
    }

    // Ponto de chegada
    if (validCoordinates[validCoordinates.length - 1]) {
      routePoints.push({
        ...endPoint,
        coordinates: validCoordinates[validCoordinates.length - 1],
        name: 'Ponto de Chegada',
        type: 'end',
        order: validCoordinates.length - 1
      } as RoutePointWithCoordinates);
    }

    const routeData: RouteData = {
      geometry: route.geometry,
      distance: route.summary.distance,
      duration: route.summary.duration,
      points: routePoints,
      summary: {
        totalDistance: `${(route.summary.distance / 1000).toFixed(2)} km`,
        totalDuration: `${Math.round(route.summary.duration / 60)} min`,
        totalPoints: routePoints.length,
        studentsCount: goingStudents.length
      }
    };

    this.routeDataSubject.next(routeData);
    return routeData;
  }

  clearRoute(): void {
    this.routeDataSubject.next(null);
  }

  canStartRoute(): boolean {
    const startPoint = this.getStartPoint();
    const endPoint = this.getEndPoint();
    return !!(startPoint && endPoint && startPoint.address && endPoint.address);
  }

  canViewRoute(): boolean {
    return this.canStartRoute();
  }

  hasCalculatedRoute(): boolean {
    return this.getRouteData() !== null;
  }
}
