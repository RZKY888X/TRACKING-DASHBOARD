// lib/mockData.ts

import { VehicleData, VehiclePosition, RouteData } from '@/types';

export const drivers = [
  'Budi Santoso',
  'Joko Prasetyo',
  'Andri Wijaya',
  'Dedi Rahman',
  'Faijar Hidayat'
];

export const vehicles = [
  'B 9213 KA',
  'B 8121 KZ',
  'B 6631 AB',
  'B 5510 RR',
  'B 7731 XY'
];

export const routes: RouteData[] = [
  { from: 'Jakarta', to: 'Bandung' },
  { from: 'Bandung', to: 'Jakarta' },
  { from: 'Jakarta', to: 'Cirebon' }
];

export const vehiclePositions: VehiclePosition[] = [
  { lat: -6.2088, lng: 106.8456, status: 'idle' },
  { lat: -6.9175, lng: 107.6191, status: 'onTrip' },
  { lat: -6.5, lng: 107.0, status: 'completed' }
];

export const generateMockData = (): VehicleData[] => {
  return drivers.map((driver, idx) => {
    const route = routes[idx % routes.length];
    const checkInHour = Math.floor(Math.random() * 12) + 8;
    const checkInMin = Math.floor(Math.random() * 60);
    const tripDuration = Math.floor(Math.random() * 180) + 120;
    const statusOptions: Array<'On Time' | 'Delay' | 'On Trip' | 'Early'> = [
      'On Time',
      'Delay',
      'On Trip',
      'Early'
    ];
    const status = statusOptions[idx % statusOptions.length];
    
    return {
      driverName: driver,
      vehicle: vehicles[idx],
      from: route.from,
      to: route.to,
      checkIn: `${checkInHour.toString().padStart(2, '0')}:${checkInMin.toString().padStart(2, '0')}`,
      checkOut: status === 'On Trip' 
        ? '—' 
        : `${((checkInHour + Math.floor(tripDuration / 60)) % 24).toString().padStart(2, '0')}:${((checkInMin + (tripDuration % 60)) % 60).toString().padStart(2, '0')}`,
      tripTime: `${Math.floor(tripDuration / 60)}h ${tripDuration % 60}m`,
      avgSpeed: Math.floor(Math.random() * 30) + 45,
      status
    };
  });
};