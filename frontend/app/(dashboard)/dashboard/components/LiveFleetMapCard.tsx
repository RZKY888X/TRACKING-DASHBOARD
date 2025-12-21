"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* =========================
   DYNAMIC LEAFLET IMPORT
========================= */
const MapContainer = dynamic(
  () => import("react-leaflet").then(m => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then(m => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then(m => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then(m => m.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then(m => m.Polyline),
  { ssr: false }
);

/* =========================
   TYPES
========================= */
type Warehouse = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

type ActiveTrip = {
  tripId: number;
  color: string;
  driver: { name: string };
  vehicle: { plate: string };
};

type LivePosition = {
  tripId: number;
  latitude: number;
  longitude: number;
  speed?: number;
  driver: string;
  plate: string;
};

type RoutePoint = {
  lat: number;
  lng: number;
};

/* =========================
   ICONS
========================= */
const warehouseIcon = new L.Icon({
  iconUrl: "/icons/warehouse.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const truckIcon = new L.Icon({
  iconUrl: "/icons/truck.png",
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

/* =========================
   COMPONENT
========================= */
export default function LiveFleetMapCard() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [routes, setRoutes] = useState<Record<number, RoutePoint[]>>({});
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCHERS
  ========================= */
  const fetchWarehouses = async () => {
    const res = await fetch(`${API_URL}/api/warehouses`);
    return res.json();
  };

  const fetchActiveTrips = async () => {
    const res = await fetch(`${API_URL}/api/dashboard/active-trips`);
    return res.json();
  };

  const fetchLivePositions = async () => {
    const res = await fetch(`${API_URL}/api/dashboard/live-positions`);
    return res.json();
  };

  const fetchRoute = async (tripId: number) => {
    const res = await fetch(`${API_URL}/api/dashboard/trip-routes/${tripId}`);
    return res.json();
  };

  /* =========================
     INIT + REALTIME
  ========================= */
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const init = async () => {
      try {
        const [wh, trips, pos] = await Promise.all([
          fetchWarehouses(),
          fetchActiveTrips(),
          fetchLivePositions()
        ]);

        setWarehouses(wh);
        setActiveTrips(trips);
        setPositions(pos);

        // fetch route per trip
        const routeMap: Record<number, RoutePoint[]> = {};
        for (const trip of trips) {
          routeMap[trip.tripId] = await fetchRoute(trip.tripId);
        }
        setRoutes(routeMap);
      } catch (err) {
        console.error("Map init error", err);
      } finally {
        setLoading(false);
      }

      // realtime GPS
      interval = setInterval(async () => {
        const pos = await fetchLivePositions();
        setPositions(pos);
      }, 5000);
    };

    init();
    return () => clearInterval(interval);
  }, []);

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="bg-[#0D1117] border border-white/10 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">Live Fleet Overview</h3>

      <div className="h-[420px] rounded-xl overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading map...
          </div>
        ) : (
          <MapContainer
            center={[-6.2, 106.8]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* WAREHOUSES */}
            {warehouses.map(w => (
              <Marker
                key={w.id}
                position={[w.latitude, w.longitude]}
                icon={warehouseIcon}
              >
                <Popup>
                  <strong>{w.name}</strong>
                </Popup>
              </Marker>
            ))}

            {/* ROUTES */}
            {activeTrips.map(trip =>
              routes[trip.tripId] ? (
                <Polyline
                  key={trip.tripId}
                  positions={routes[trip.tripId].map(p => [p.lat, p.lng])}
                  pathOptions={{ color: trip.color, weight: 4 }}
                />
              ) : null
            )}

            {/* TRUCKS */}
            {positions.map(pos => (
              <Marker
                key={pos.tripId}
                position={[pos.latitude, pos.longitude]}
                icon={truckIcon}
              >
                <Popup>
                  🚚 <b>{pos.plate}</b>
                  <br />
                  👤 {pos.driver}
                  <br />
                  ⚡ {pos.speed ?? 0} km/h
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
