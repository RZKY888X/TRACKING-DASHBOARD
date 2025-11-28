// lib/mockData.ts

import { VehicleData, VehiclePosition, RouteData } from "@/types";

// Default static data (fallback only)
export const defaultDrivers: string[] = [
  "Budi Santoso",
  "Joko Prasetyo",
  "Andri Wijaya",
  "Dedi Rahman",
  "Faijar Hidayat",
];

export const defaultVehicles: string[] = [
  "B 9213 KA",
  "B 8121 KZ",
  "B 6631 AB",
  "B 5510 RR",
  "B 7731 XY",
];

export const defaultRoutes: RouteData[] = [
  { from: "Jakarta", to: "Bandung" },
  { from: "Bandung", to: "Jakarta" },
  { from: "Jakarta", to: "Cirebon" },
];

// ==============================
// Default positions (before real GPS comes in)
// ==============================
export const defaultVehiclePositions: VehiclePosition[] = [
  { latitude: -6.2088, longitude: 106.8456, speed: 0 },
  { latitude: -6.9175, longitude: 107.6191, speed: 20 },
  { latitude: -6.5, longitude: 107.0, speed: 35 },
];

// ==============================
// Generate fallback FE data (matching backend format)
// ==============================
export const generateFallbackData = (): VehicleData[] => {
  return defaultDrivers.map((driver, idx) => {
    const route = defaultRoutes[idx % defaultRoutes.length];
    const vehiclePosition =
      defaultVehiclePositions[idx % defaultVehiclePositions.length];

    return {
      id: idx + 1,
      name: defaultVehicles[idx],
      driver,
      route: `${route.from} → ${route.to}`,
      latitude: vehiclePosition.latitude,
      longitude: vehiclePosition.longitude,
      speed: vehiclePosition.speed,
      timestamp: new Date().toISOString(),
    };
  });
};
