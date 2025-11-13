// lib/calculateStats.ts

import { VehicleData, VehicleStats } from '@/types';

export const calculateStats = (data: VehicleData[]): VehicleStats => {
  const idle = data.filter(d => d.status === 'Idle').length || 3;
  const onTrip = data.filter(d => d.status === 'On Trip').length || 12;
  const completed = data.filter(d => d.status === 'On Time' || d.status === 'Early').length || 15;
  const onTime = data.filter(d => d.status === 'On Time').length || 10;
  const delay = data.filter(d => d.status === 'Delay').length || 7;
  const early = data.filter(d => d.status === 'Early').length || 6;

  return {
    idle,
    onTrip,
    completed,
    onTime,
    delay,
    early
  };
};