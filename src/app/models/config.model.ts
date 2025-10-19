export interface AppConfig {
  name: string;
  version: string;
  defaultCenter: {
    lat: number;
    lng: number;
  };
  defaultZoom: number;
}

export interface ValidationConfig {
  cepLength: number;
  phoneMinLength: number;
  nameMinLength: number;
}

export interface RouteConfig {
  defaultTravelMode: string;
  optimizeWaypoints: boolean;
  avoidHighways: boolean;
  avoidTolls: boolean;
}

export interface NotificationConfig {
  defaultDuration: number;
  position: string;
}

export interface StorageConfig {
  driversKey: string;
  studentsKey: string;
  currentDriverKey: string;
  routePointsKey: string;
}

export interface OSMConfig {
  nominatimUrl: string;
  osrmUrl: string;
  userAgent: string;
  geocodeDelay: number;
  maxRetries: number;
  countryCode: string;
}

export interface BusManagerConfig {
  APP: AppConfig;
  VALIDATION: ValidationConfig;
  ROUTE: RouteConfig;
  NOTIFICATION: NotificationConfig;
  STORAGE: StorageConfig;
  OSM: OSMConfig;
}
