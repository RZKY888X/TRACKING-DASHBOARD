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
// FILTER OPTIONS
// ===============================
export interface FilterOptions {
  drivers: Array<{ id: number; name: string; email?: string }>;
  origins: Array<{ id: number; name: string; city: string }>;
  destinations: Array<{ id: number; name: string; city: string }>;
}


// ===============================
// DASHBOARD FILTERS (GLOBAL FILTER)
// ===============================
export interface Filters {
  dateType: "current" | "daily" | "weekly" | "monthly";
  dateValue?: string;

  driver: string;
  route: string;
  departureRoute?: string;
}


// ===============================
// TRIP DATA (for DataTable)
// ===============================
export interface Trip {
  id: number;
  driverId: number;
  vehicleId: number;
  originId: number;
  destinationId?: number;
  status: "ON_TRIP" | "COMPLETED";
  startTime: string;
  endTime?: string;
  avgSpeed?: number;
  driver: {
    id: number;
    name: string;
    createdAt: string;
  };
  vehicle: {
    id: number;
    plate: string;
    type?: string;
    positions: any[];
  };
  origin: {
    id: number;
    name: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  destination?: {
    id: number;
    name: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  positions: any[];
  latestPosition?: {
    id: number;
    latitude: number;
    longitude: number;
    speed?: number;
    timestamp: string;
  };
}

// ===============================
// FILTER RESPONSE
// ===============================
export interface FilterResponse {
  success: boolean;
  trips: Trip[];
  count: number;
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

// ===============================
// DRIVER DASHBOARD (DUMMY DATA)
// ===============================

export interface DriverStat {
  title: string;
  value: number;
  subtitle?: string;
  color: "blue" | "green" | "yellow" | "indigo";
}

export interface TopDriver {
  name: string;
  trips: number;
}

export interface DriverPerformance {
  onTime: number;
  delayed: number;
}

export interface DriverTableItem {
  id: number;
  name: string;
  rfid: string;
  totalTrips: number;
  avgDuration: string;
  status: "ACTIVE" | "ON_TRIP";
  performance: "EXCELLENT" | "GOOD" | "AVERAGE";
}
