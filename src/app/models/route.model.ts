export interface RoutePoint {
  cep: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface RouteCoordinates {
  lat: number;
  lng: number;
}

export interface RoutePointWithCoordinates extends RoutePoint {
  coordinates: RouteCoordinates;
  name: string;
  type: 'start' | 'end' | 'student';
  order: number;
  phone?: string;
}

export interface RouteData {
  geometry?: {
    coordinates: number[][];
  };
  distance?: number;
  duration?: number;
  points: RoutePointWithCoordinates[];
  summary?: {
    totalDistance: string;
    totalDuration: string;
    totalPoints: number;
    studentsCount?: number;
  };
}

export interface OSMGeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
}

export interface OSMGeocodeResponse {
  results: OSMGeocodeResult[];
}

export interface OSRMRouteResponse {
  routes: Array<{
    geometry: {
      coordinates: number[][];
    };
    summary: {
      distance: number;
      duration: number;
    };
  }>;
  waypoints: Array<{
    waypoint_index: number;
  }>;
}
