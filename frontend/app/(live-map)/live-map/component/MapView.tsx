"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import VehiclePopup from "./VehiclePopup";

// ============================
// LEAFLET (NO SSR)
// ============================
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

// ============================
// VEHICLE DATA
// ============================
const vehicles = [
  { id: "TRK-8821", name: "John Doe", status: "trip", lat: -6.21, lng: 106.82 },
  { id: "TRK-9900", name: "Mike R.", status: "alert", lat: -6.215, lng: 106.81 },
  { id: "FLT-2210", name: "Alex K.", status: "active", lat: -6.205, lng: 106.825 },
];

// ============================
// STATUS → COLOR
// ============================
const statusColor: Record<string, string> = {
  active: "#22c55e",
  trip: "#facc15",
  alert: "#ef4444",
  idle: "#3b82f6",
  off: "#9ca3af",
};

export default function MapView() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================
  // CUSTOM MARKER ICON
  // ============================
  const icons = useMemo(() => {
    if (!mounted) return null;

    const map: Record<string, L.DivIcon> = {};

    Object.entries(statusColor).forEach(([status, color]) => {
      map[status] = L.divIcon({
        className: "",
        html: `
          <div style="
            pointer-events: auto;
            cursor: pointer;
            position: relative;
            width: 18px;
            height: 18px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 0 10px ${color};
          ">
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 6px solid ${color};
            "></div>
          </div>
        `,
        iconSize: [18, 24],
        iconAnchor: [9, 24],
        popupAnchor: [0, -22],
      });
    });

    return map;
  }, [mounted]);

  if (!mounted || !icons) return null;

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[-6.21, 106.82]}
        zoom={12}
        className="h-full w-full"
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vehicles.map((v) => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={icons[v.status] || icons.active}
          >
            <Popup closeButton={false}>
              <VehiclePopup />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
