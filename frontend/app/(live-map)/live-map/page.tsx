// app/(live-map)/live-map/page.tsx
"use client";

import { useState } from "react";
import MapView from "./component/MapView";
import VehiclePanel from "./component/VehiclePanel";
import StatusLegend from "./component/StatusLegend";

/* =============================
   TYPES
============================= */
export type VehicleStatus = "active" | "idle" | "alert" | "off";

export interface Vehicle {
  id: string;
  code: string;
  driver: string;
  route: string;
  status: VehicleStatus;
  speed: number;
  position: [number, number]; // [lat, lng]
}

/* =============================
   PAGE
============================= */
export default function LiveMapPage() {
  /* =============================
     SOURCE OF TRUTH
  ============================= */
  const [vehicles] = useState<Vehicle[]>([
    {
      id: "1",
      code: "TRK-8821",
      driver: "John Doe",
      route: "Jakarta - Bandung",
      status: "active",
      speed: 65,
      position: [-6.21, 106.82],
    },
    {
      id: "2",
      code: "TRK-9900",
      driver: "Mike R.",
      route: "Jakarta - Semarang",
      status: "alert",
      speed: 0,
      position: [-6.18, 106.85],
    },
    {
      id: "3",
      code: "FLT-2210",
      driver: "Alex K.",
      route: "Jakarta - Jogja",
      status: "idle",
      speed: 42,
      position: [-6.24, 106.81],
    },
  ]);

  /* =============================
     SELECTED VEHICLE (SYNC MAP ↔ PANEL)
  ============================= */
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#020617]">
      {/* ================= MAP AREA ================= */}
      <div className="flex-1 relative">
        <MapView
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
        />

        {/* STATUS LEGEND */}
        <div className="absolute bottom-6 left-6 z-[500]">
          <StatusLegend />
        </div>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="w-80 shrink-0 border-l border-white/5">
        <VehiclePanel
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={setSelectedVehicleId}
        />
      </div>
    </div>
  );
}
