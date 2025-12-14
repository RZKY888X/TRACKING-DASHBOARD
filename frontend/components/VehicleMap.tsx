"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface Warehouse {
  id: number;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface Position {
  id: number;
  latitude: number;
  longitude: number;
  speed?: number;
  timestamp: string;
}

interface Vehicle {
  id: number;
  plate: string;
  type?: string;
  positions: Position[];
}

interface Driver {
  id: number;
  name: string;
}

interface Trip {
  id: number;
  driver: Driver;
  vehicle: Vehicle;
  origin: Warehouse;
  destination?: Warehouse;
  status: "ON_TRIP" | "COMPLETED";
  startTime: string;
  endTime?: string;
  positions: Position[];
}

interface DashboardData {
  vehicles: Vehicle[];
  warehouses: Warehouse[];
}

const warehouseIcon = L.divIcon({
  className: "warehouse-marker",
  html: `<div style="
    background-color: #3b82f6;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 3px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;">🏭</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const createCustomIcon = (status: string) => {
  let color = "#10b981"; // Idle
  if (status === "On Trip") color = "#eab308";
  else if (status === "Completed") color = "#a855f7";

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="transform: rotate(45deg); color:white; font-weight:bold; font-size:12px;">🚚</div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const getStatusText = (status: string) => {
  switch (status) {
    case "ON_TRIP": return "On Trip";
    case "COMPLETED": return "Completed";
    default: return "Idle";
  }
};

export default function VehicleMap() {
  const { data: session } = useSession();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchData = async () => {
      try {
        // Ambil data warehouses
        const whRes = await fetch("http://localhost:3001/api/warehouses", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const whData: Warehouse[] = await whRes.json();
        setWarehouses(whData);

        // Ambil data trips / vehicles
        const dashRes = await fetch("http://localhost:3001/api/dashboard/map", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const dashData: { vehicles: Vehicle[]; warehouses: Warehouse[] } = await dashRes.json();

        // Map trips dari vehicles
        const tripList: Trip[] = [];
        dashData.vehicles.forEach((v) => {
          v.positions.forEach((p) => {
            if (p) {
              tripList.push({
                id: p.id,
                driver: { id: 0, name: v.plate }, // kita bisa hubungkan ke trip driver nanti
                vehicle: v,
                origin: { id: 0, name: "Unknown", city: "", latitude: 0, longitude: 0 },
                destination: undefined,
                status: "ON_TRIP",
                startTime: p.timestamp,
                positions: [p],
              });
            }
          });
        });

        setTrips(tripList);
      } catch (err) {
        console.error("Failed fetching map data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [session?.accessToken]);

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] bg-slate-900 flex items-center justify-center rounded-lg">
        <p className="text-gray-400">Initializing map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow relative">
      <MapContainer center={[-6.7, 107.2]} zoom={7} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Warehouse markers */}
        {warehouses.map((wh) => (
          <Marker key={wh.id} position={[wh.latitude, wh.longitude]} icon={warehouseIcon}>
            <Popup>
              <div>
                <strong>{wh.name}</strong>
                <br />
                <span>{wh.city}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Vehicle markers */}
        {trips.map((trip) => {
          const latestPos = trip.positions[trip.positions.length - 1];
          return latestPos.latitude && latestPos.longitude ? (
            <Marker
              key={trip.id}
              position={[latestPos.latitude, latestPos.longitude]}
              icon={createCustomIcon(getStatusText(trip.status))}
            >
              <Popup>
                <div>
                  <strong>{trip.vehicle.plate}</strong> - {trip.driver.name}
                  <br />
                  Status: {getStatusText(trip.status)}
                  <br />
                  Speed: {latestPos.speed ?? "-"} km/h
                  <br />
                  Last Update: {new Date(latestPos.timestamp).toLocaleTimeString("id-ID")}
                </div>
              </Popup>
            </Marker>
          ) : null;
        })}

        {/* Polyline rute */}
        {trips.map((trip) => {
          const latestPos = trip.positions[trip.positions.length - 1];
          if (!trip.destination || !latestPos) return null;
          const coords = [
            [trip.origin.latitude, trip.origin.longitude],
            [trip.destination.latitude, trip.destination.longitude],
          ];
          return <Polyline key={`route-${trip.id}`} positions={coords} color="#eab308" weight={4} />;
        })}
      </MapContainer>
    </div>
  );
}
