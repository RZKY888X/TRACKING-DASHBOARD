// ===============================
// VEHICLE & POSITION (from backend)
// ===============================
export interface VehicleData {
  id: number;
  name: string;
  driver: string;
  route: string;
  latitude: number | null;
  longitude: number | null;
  speed: number;
  timestamp: string | null;
}

export interface VehiclePosition {
  id?: number;
  vehicleId?: number;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp?: string;
}


// ===============================
// DASHBOARD STATS (for StatsCard)
// ===============================
export interface VehicleStats {
  idle: number;
  onTrip: number;
  completed: number;

  onTime: number;
  delay: number;
  early: number;

  avgTripDuration: string | null; // contoh: "32 mins"
  avgSpeed: number | null;        // contoh: 45 (km/h)
}


// ===============================
// ROUTE + FILTERS (FilterSection)
// ===============================
export interface RouteData {
  from: string;
  to: string;
}

export interface Filters {
  date: string;
  driver: string;
  route: string;
}


// ===============================
// MQTT PAYLOAD (IoT → Backend)
// ===============================
// Format asli dari backend:
// { vehicleId, lat, lng, speed }
export interface MQTTMessage {
  topic: string;
  payload: {
    vehicleId: number;
    lat: number;
    lng: number;
    speed: number;
  };
  timestamp: number;
}


// ===============================
// LoRaWAN Payload (Optional future support)
// ===============================
export interface LoRaWANPayload {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  batteryLevel?: number;
}
