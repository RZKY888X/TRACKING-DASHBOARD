"use client";

import { useState } from "react";
import VehicleCard from "./VehicleCard";

type VehicleStatus = "active" | "trip" | "alert" | "idle" | "off";

const VEHICLES = [
  {
    code: "TRK-8821",
    name: "John Doe",
    status: "trip" as VehicleStatus,
    speed: "65 km/h",
    route: "Jakarta – Bogor",
  },
  {
    code: "TRK-9900",
    name: "Mike R.",
    status: "alert" as VehicleStatus,
    speed: "0 km/h",
    route: "Jakarta – Bandung",
  },
  {
    code: "FLT-2210",
    name: "Alex K.",
    status: "active" as VehicleStatus,
    speed: "42 km/h",
    route: "Jakarta – Semarang",
  },
  {
    code: "VSL-9921",
    name: "Sarah M.",
    status: "idle" as VehicleStatus,
    speed: "0 km/h",
    route: "Jakarta – Bogor",
  },
  {
    code: "XYZ-9001",
    name: "David B.",
    status: "off" as VehicleStatus,
    speed: "-",
    route: "Jakarta – Bandung",
  },
];

export default function VehiclePanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");

  const filteredVehicles = VEHICLES.filter((v) => {
    const matchSearch =
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "all" || v.status === statusFilter;

    const matchRoute =
      routeFilter === "all" || v.route === routeFilter;

    return matchSearch && matchStatus && matchRoute;
  });

  return (
    <aside className="w-full h-full flex flex-col bg-[#0F172A] border-l border-white/5">
      {/* HEADER */}
      <div className="px-4 py-4 border-b border-white/5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Active Assets ({filteredVehicles.length})
          </h3>
          <p className="text-xs text-gray-400">
            Vehicles currently monitored
          </p>
        </div>

        {/* FILTERS */}
        <div className="space-y-2">
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search vehicle or driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full px-3 py-2
              bg-[#020617]
              border border-white/10
              rounded-lg
              text-sm text-white
              placeholder-gray-500
              focus:outline-none
              focus:border-cyan-400
            "
          />

          {/* DROPDOWNS */}
          <div className="grid grid-cols-2 gap-2">
            {/* STATUS */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="
                w-full px-2 py-2
                bg-[#020617]
                border border-white/10
                rounded-lg
                text-sm text-gray-300
                focus:outline-none
              "
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trip">On Trip</option>
              <option value="idle">Idle</option>
              <option value="alert">Alert</option>
              <option value="off">Off / Parked</option>
            </select>

            {/* ROUTE */}
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="
                w-full px-2 py-2
                bg-[#020617]
                border border-white/10
                rounded-lg
                text-sm text-gray-300
                focus:outline-none
              "
            >
              <option value="all">All Routes</option>
              <option value="Jakarta – Bogor">Jakarta – Bogor</option>
              <option value="Jakarta – Bandung">Jakarta – Bandung</option>
              <option value="Jakarta – Semarang">Jakarta – Semarang</option>
            </select>
          </div>
        </div>
      </div>

      {/* VEHICLE LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filteredVehicles.map((v) => (
          <VehicleCard
            key={v.code}
            code={v.code}
            name={v.name}
            status={v.status}
            speed={v.speed}
          />
        ))}

        {filteredVehicles.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-6">
            No vehicles found
          </p>
        )}
      </div>
    </aside>
  );
}
