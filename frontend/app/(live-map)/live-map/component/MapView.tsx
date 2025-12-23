"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import VehiclePopup from "./VehiclePopup";

// ============================
// LEAFLET (CLIENT ONLY)
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
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
);

// ============================
// TYPES
// ============================
type VehicleStatus = "active" | "trip" | "alert" | "idle" | "off";

interface Vehicle {
  id: string;
  name: string;
  status: VehicleStatus;
  lat: number;
  lng: number;
}

interface MapViewProps {
  selectedVehicleId?: string | null;
}

// ============================
// VEHICLE DATA
// ============================
const vehicles: Vehicle[] = [
  { id: "TRK-8821", name: "John Doe", status: "trip", lat: -6.21, lng: 106.82 },
  { id: "TRK-9900", name: "Mike R.", status: "alert", lat: -6.215, lng: 106.81 },
  { id: "FLT-2210", name: "Alex K.", status: "active", lat: -6.205, lng: 106.825 },
  { id: "VSL-9921", name: "Sarah M.", status: "idle", lat: -6.2148, lng: 106.812 },
  { id: "XYZ-9001", name: "David L.", status: "off", lat: -6.217, lng: 106.809 },
];

// ============================
// STATUS COLOR
// ============================
const statusColor: Record<VehicleStatus, string> = {
  active: "#22c55e", // green
  trip: "#facc15",   // yellow
  alert: "#ef4444",  // red
  idle: "#3b82f6",   // blue
  off: "#9ca3af",    // gray
};

export default function MapView({ selectedVehicleId }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  // ============================
  // CLIENT READY
  // ============================
  useEffect(() => {
    setMounted(true);
    import("leaflet").then(setL);
  }, []);

  // ============================
  // FETCH ROUTE (OPTIONAL)
  // ============================
  useEffect(() => {
    if (!mounted) return;

    const fetchRoute = async () => {
      const res = await fetch(
        "https://router.project-osrm.org/route/v1/driving/106.82,-6.21;106.816,-6.595?overview=full&geometries=geojson"
      );
      const data = await res.json();

      const coords = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      setRoutePath(coords);
    };

    fetchRoute();
  }, [mounted]);

  // ============================
  // ZOOM TO SELECTED VEHICLE
  // ============================
  useEffect(() => {
    if (!mapRef.current || !selectedVehicleId) return;

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!vehicle) return;

    mapRef.current.flyTo([vehicle.lat, vehicle.lng], 15, {
      duration: 1.2,
    });
  }, [selectedVehicleId]);

  // ============================
  // ICONS (IDLE & OFF FIXED)
  // ============================
  const icons = useMemo(() => {
    if (!L) return null;

    const map: Record<VehicleStatus, any> = {} as any;

    (Object.keys(statusColor) as VehicleStatus[]).forEach((status) => {
      const color = statusColor[status];
      const isOff = status === "off";

      map[status] = L.divIcon({
        className: "",
        html: `
          <div style="
            width:18px;
            height:18px;
            background:${color};
            border-radius:50%;
            border:2px solid #fff;
            opacity:${isOff ? 0.5 : 1};
            box-shadow:${isOff ? "none" : `0 0 10px ${color}`};
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
    });

    return map;
  }, [L]);

  if (!mounted || !icons) return null;

  return (
    <div className="absolute inset-0">
      <MapContainer
        ref={mapRef}
        center={[-6.21, 106.82]}
        zoom={11}
        className="h-full w-full"
      >
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ROUTE */}
        {routePath.length > 0 && (
          <Polyline
            positions={routePath}
            pathOptions={{ color: "#facc15", weight: 5 }}
          />
        )}

        {/* MARKERS */}
        {vehicles.map((v) => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={icons[v.status]}
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
