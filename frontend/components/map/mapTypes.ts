// frontend/components/map/mapTypes.ts

export interface Warehouse {
  id: number;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface Position {
  id: number;
  latitude: number;
  longitude: number;
  speed?: number;
  timestamp: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  type?: string;
  positions: Position[];
}

export interface Trip {
  id: number;
  vehicle: Vehicle;
  driverName: string;
  status: "ON_TRIP" | "COMPLETED" | "IDLE";
  positions: Position[];
}
