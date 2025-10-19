import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouteData, RoutePointWithCoordinates } from '../models/route.model';
import { Student } from '../models/student.model';
import { RoutePoint } from '../models/route.model';
import { RouteService } from './route.service';

declare var L: any;

@Injectable({
  providedIn: 'root'
})
export class OSMIntegrationService {
  private map: any = null;
  private markers: any[] = [];
  private routeLayer: any = null;

  constructor(
    private routeService: RouteService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  initMap(containerId: string, options: { center: [number, number]; zoom: number }, startPointData?: any): any {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      // Remover mapa existente se houver
      if (this.map) {
        this.map.remove();
      }

      const mapElement = document.getElementById(containerId);
      if (!mapElement) {
        throw new Error(`Elemento do mapa não encontrado: ${containerId}`);
      }

      // Inicializar mapa Leaflet
      this.map = L.map(containerId).setView(options.center, options.zoom);

      // Adicionar tiles do OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      return this.map;
    } catch (error) {
      console.error('Erro ao inicializar mapa OSM:', error);
      throw error;
    }
  }

  addMarkers(points: RoutePointWithCoordinates[]): void {
    if (!this.map) {
      console.warn('Mapa não inicializado');
      return;
    }

    // Limpar marcadores existentes
    this.clearMarkers();

    points.forEach((point, index) => {
      if (point.coordinates) {
        const marker = this.createCustomMarker(point, index);
        marker.addTo(this.map);
        this.markers.push(marker);
      }
    });

    // Ajustar visualização para mostrar todos os marcadores
    if (this.markers.length > 0) {
      const group = new L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private createCustomMarker(point: RoutePointWithCoordinates, index: number): any {
    const { lat, lng } = point.coordinates;
    
    // Criar ícone personalizado baseado no tipo
    let iconClass = 'marker-student';
    let iconSymbol = index.toString();
    
    switch (point.type) {
      case 'start':
        iconClass = 'marker-start';
        iconSymbol = 'S';
        break;
      case 'end':
        iconClass = 'marker-end';
        iconSymbol = 'E';
        break;
      case 'student':
        iconClass = 'marker-student';
        iconSymbol = index.toString();
        break;
    }

    // Criar elemento HTML para o marcador
    const markerElement = document.createElement('div');
    markerElement.className = `custom-marker ${iconClass}`;
    markerElement.innerHTML = `
      <div class="marker-content">
        <span>${iconSymbol}</span>
      </div>
    `;

    // Criar ícone personalizado
    const customIcon = L.divIcon({
      html: markerElement,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    // Criar marcador
    const marker = L.marker([lat, lng], { icon: customIcon });

    // Adicionar popup
    const popupContent = this.createPopupContent(point);
    marker.bindPopup(popupContent, {
      className: 'marker-popup'
    });

    return marker;
  }

  private createPopupContent(point: RoutePointWithCoordinates): string {
    let content = `
      <div class="marker-popup">
        <div class="marker-header">${point.name}</div>
        <div class="marker-body">
          <p><i class="fas fa-map-marker-alt"></i> ${point.address}, ${point.number}</p>
    `;

    if (point.neighborhood) {
      content += `<p><i class="fas fa-building"></i> ${point.neighborhood}</p>`;
    }

    content += `<p><i class="fas fa-city"></i> ${point.city}`;
    if (point.state) {
      content += ` - ${point.state}`;
    }
    content += `</p>`;

    if (point.phone) {
      content += `<p><i class="fas fa-phone"></i> ${point.phone}</p>`;
    }

    content += `</div></div>`;
    return content;
  }

  drawRoute(routeData: RouteData): void {
    if (!this.map || !routeData.geometry) {
      console.warn('Mapa não inicializado ou dados de rota inválidos');
      return;
    }

    // Remover rota existente
    this.clearRoute();

    try {
      // Criar layer da rota
      this.routeLayer = L.geoJSON(routeData.geometry, {
        style: {
          color: '#007bff',
          weight: 4,
          opacity: 0.8
        }
      }).addTo(this.map);

      // Ajustar visualização para mostrar a rota completa
      if (this.routeLayer) {
        this.map.fitBounds(this.routeLayer.getBounds().pad(0.1));
      }
    } catch (error) {
      console.error('Erro ao desenhar rota:', error);
    }
  }

  clearMap(): void {
    this.clearMarkers();
    this.clearRoute();
  }

  clearMarkers(): void {
    this.markers.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
  }

  clearRoute(): void {
    if (this.routeLayer && this.map) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }
  }

  async calculateAndDisplayRoute(
    students: Student[],
    startPoint: RoutePoint,
    endPoint: RoutePoint,
    mapContainerId: string
  ): Promise<RouteData> {
    try {
      // Calcular rota usando o RouteService
      const routeData = await this.routeService.calculateAndDisplayRoute(students);
      
      // Inicializar mapa se necessário
      if (!this.map) {
        this.initMap(mapContainerId, {
          center: [-23.5505, -46.6333],
          zoom: 12
        });
      }
      
      // Adicionar marcadores
      this.addMarkers(routeData.points);
      
      // Desenhar rota
      this.drawRoute(routeData);
      
      return routeData;
    } catch (error) {
      console.error('Erro ao calcular e exibir rota:', error);
      throw error;
    }
  }

  startNavigation(routeData: RouteData): void {
    try {
      if (routeData && routeData.points && routeData.points.length > 0) {
        // Usar Google Maps para navegação direta
        const coordinates = routeData.points
          .filter(point => point.coordinates && point.coordinates.lat && point.coordinates.lng)
          .map(point => `${point.coordinates.lng},${point.coordinates.lat}`)
          .join(';');
        
        if (coordinates) {
          // Usar Google Maps para navegação direta com coordenadas
          const googleMapsUrl = `https://www.google.com/maps/dir/${coordinates}`;
          window.open(googleMapsUrl, '_blank');
        } else {
          // Fallback: usar endereços no Google Maps
          const allAddresses = routeData.points.map(point => 
            `${point.address}, ${point.number}, ${point.city}`
          );
          
          if (allAddresses.length > 0) {
            const encodedAddresses = allAddresses.map(addr => encodeURIComponent(addr));
            const googleMapsUrl = `https://www.google.com/maps/dir/${encodedAddresses.join('/')}`;
            window.open(googleMapsUrl, '_blank');
          } else {
            throw new Error('Nenhum endereço válido encontrado na rota');
          }
        }
      } else {
        throw new Error('Nenhuma rota disponível para navegação');
      }
    } catch (error) {
      console.error('Erro ao iniciar navegação:', error);
      throw error;
    }
  }
}
