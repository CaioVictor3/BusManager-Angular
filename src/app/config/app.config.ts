import { BusManagerConfig } from '../models/config.model';

export const APP_CONFIG: BusManagerConfig = {
  APP: {
    name: 'Bus Manager',
    version: '1.0.0',
    defaultCenter: {
      lat: -23.5505,
      lng: -46.6333
    },
    defaultZoom: 12
  },
  
  VALIDATION: {
    cepLength: 8,
    phoneMinLength: 10,
    nameMinLength: 2
  },
  
  ROUTE: {
    defaultTravelMode: 'DRIVING',
    optimizeWaypoints: true,
    avoidHighways: false,
    avoidTolls: false
  },
  
  NOTIFICATION: {
    defaultDuration: 3000,
    position: 'top-right'
  },
  
  STORAGE: {
    driversKey: 'busManager_drivers',
    studentsKey: 'busManager_students',
    currentDriverKey: 'busManager_currentDriver',
    routePointsKey: 'busManager_routePoints'
  },
  
  OSM: {
    nominatimUrl: 'https://nominatim.openstreetmap.org',
    osrmUrl: 'https://router.project-osrm.org',
    userAgent: 'BusManager/1.0 (Transporte Escolar)',
    geocodeDelay: 1000,
    maxRetries: 3,
    countryCode: 'br'
  }
};

