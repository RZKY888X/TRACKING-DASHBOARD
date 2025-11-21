// lib/calculateStats.ts

import { VehicleData, VehicleStats } from "@/types";

/**
 * Menghasilkan statistik kendaraan berdasarkan data GPS realtime.
 * Karena backend tidak memiliki field "status" atau durasi trip eksplisit,
 * maka:
 * - status dihitung berdasarkan "speed" dan "timestamp"
 * - avgSpeed dihitung dari rata-rata speed yang tersedia
 * - avgTripDuration dikembalikan sebagai null karena tidak ada informasi start/end
 */
export const calculateStats = (data: VehicleData[]): VehicleStats => {
  let idle = 0;
  let onTrip = 0;
  let completed = 0;
  let onTime = 0;
  let delay = 0;
  let early = 0;

  let speedSum = 0;
  let speedCount = 0;

  const now = Date.now();

  data.forEach((v) => {
    // count idle / moving
    if (v.speed === 0) {
      idle++;
    } else if (v.speed > 0) {
      onTrip++;
    }

    // completed: dianggap tidak update dalam 30 menit
    if (v.timestamp) {
      const diff = now - new Date(v.timestamp).getTime();
      if (diff > 30 * 60 * 1000) {
        completed++;
      }
    }

    // collect speed for average (ignore null/NaN)
    if (typeof v.speed === "number" && !Number.isNaN(v.speed)) {
      speedSum += v.speed;
      speedCount += 1;
    }
  });

  const avgSpeed = speedCount > 0 ? Math.round(speedSum / speedCount) : null;

  // avgTripDuration tidak tersedia dari structure VehicleData saat ini
  const avgTripDuration: string | null = null;

  return {
    idle,
    onTrip,
    completed,
    onTime,
    delay,
    early,
    avgTripDuration,
    avgSpeed,
  };
};
