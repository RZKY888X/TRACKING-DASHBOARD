// frontend/components/map/VehicleMap.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Warehouse, Trip } from "./mapTypes";
import { warehouseIcon, createVehicleIcon } from "./mapIcons";

interface Props {
  height?: number;
}

export default function VehicleMap({ height = 400 }: Props) {
  const { data: session } = useSession();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!session?.accessToken) return;

    const load = async () => {
      const [whRes, mapRes] = await Promise.all([
        fetch("http://localhost:3001/api/warehouses", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch("http://localhost:3001/api/dashboard/map", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
      ]);

      const whData = await whRes.json();
      const mapData = await mapRes.json();

      setWarehouses(whData);

      const mappedTrips: Trip[] = mapData.vehicles.map((v: any) => ({
        id: v.id,
        vehicle: v,
        driverName: v.plate,
        status: "ON_TRIP",
        positions: v.positions,
      }));

      setTrips(mappedTrips);
    };

    load();
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, [session?.accessToken]);

  if (!mounted) {
    return (
      <div className="h-[400px] bg-[#0C1A2A] rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ height }}>
      <MapContainer center={[-6.7, 107.2]} zoom={7} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {warehouses.map((wh) => (
          <Marker key={wh.id} position={[wh.latitude, wh.longitude]} icon={warehouseIcon}>
            <Popup>
              <strong>{wh.name}</strong>
              <br />
              {wh.city}
            </Popup>
          </Marker>
        ))}

        {trips.map((t) => {
          const last = t.positions.at(-1);
          if (!last) return null;

          return (
            <Marker
              key={t.id}
              position={[last.latitude, last.longitude]}
              icon={createVehicleIcon(t.status)}
            >
              <Popup>
                <strong>{t.vehicle.plate}</strong>
                <br />
                Speed: {last.speed ?? "-"} km/h
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
