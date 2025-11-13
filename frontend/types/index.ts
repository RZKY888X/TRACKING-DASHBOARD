// types/index.ts

export interface VehicleData {
  driverName: string;
  vehicle: string;
  from: string;
  to: string;
  checkIn: string;
  checkOut: string;
  tripTime: string;
  avgSpeed: number;
  status: 'On Time' | 'Delay' | 'On Trip' | 'Early' | 'Idle';
}

export interface VehiclePosition {
  lat: number;
  lng: number;
  status: 'idle' | 'onTrip' | 'completed';
  driverId?: string;
}
// types/index.ts

export interface VehicleData {
  driverName: string;
  vehicle: string;
  from: string;
  to: string;
  checkIn: string;
  checkOut: string;
  tripTime: string;
  avgSpeed: number;
  status: 'On Time' | 'Delay' | 'On Trip' | 'Early' | 'Idle';
}

export interface VehiclePosition {
  lat: number;
  lng: number;
  status: 'idle' | 'onTrip' | 'completed';
  driverId?: string;
}

export interface VehicleStats {
  idle: number;
  onTrip: number;
  completed: number;
  onTime: number;
  delay: number;
  early: number;
}

export interface RouteData {
  from: string;
  to: string;
}

export interface Filters {
  date: string;
  driver: string;
  route: string;
}

export interface MQTTMessage {
  topic: string;
  payload: any;
  timestamp: number;
}

export interface LoRaWANPayload {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  batteryLevel?: number;
}
export interface VehicleStats {
  idle: number;
  onTrip: number;
  completed: number;
  onTime: number;
  delay: number;
  early: number;
}

export interface RouteData {
  from: string;
  to: string;
}

export interface Filters {
  date: string;
  driver: string;
  route: string;
}

export interface MQTTMessage {
  topic: string;
  payload: any;
  timestamp: number;
}

export interface LoRaWANPayload {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  batteryLevel?: number;
}