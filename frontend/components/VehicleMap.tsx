"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function VehicleMap() {
  const vehicles = [
    { id: 1, position: [-6.2, 106.816666], status: "Idle", color: "#00c853" },
    { id: 2, position: [-6.9, 107.6], status: "On Trip", color: "#ffeb3b" },
    { id: 3, position: [-6.5, 107.0], status: "Completed", color: "#9c27b0" },
  ];

  return (
    <div className="relative w-full h-[500px] bg-transparent">
      <MapContainer
        center={[-6.5, 107.0]}
        zoom={9}
        scrollWheelZoom={true}
        className="w-full h-full rounded-2xl shadow-lg z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {vehicles.map((v) => (
          <CircleMarker
            key={v.id}
            center={v.position}
            radius={10}
            pathOptions={{ color: v.color, fillColor: v.color, fillOpacity: 0.8 }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
              {v.status}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Compact Legend */}
      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-xl p-2 flex flex-col gap-1 text-sm text-white shadow-md z-[1000]">
        {[
          { label: "Idle", color: "#00c853" },
          { label: "On Trip", color: "#ffeb3b" },
          { label: "Completed", color: "#9c27b0" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
