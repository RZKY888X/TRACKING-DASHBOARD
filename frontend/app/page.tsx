// frontend/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import FilterSection from "@/components/FilterSection";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import { ProtectedPage } from "@/components/ProtectedPage";
import { UserProfile } from "@/components/UserProfile";
import { useMQTT } from "@/hooks/useMQTT";
import { useLoRaWAN } from "@/hooks/useLoRaWAN";
import { calculateStats } from "@/lib/calculateStats";
import { Filters, VehicleData, VehiclePosition, VehicleStats } from "@/types";

const VehicleMap = dynamic(() => import("@/components/VehicleMap"), {
  ssr: false,
});

export default function Home() {
  const { data: session } = useSession();
  const [data, setData] = useState<VehicleData[]>([]);
  const [stats, setStats] = useState<VehicleStats>({
    idle: 0,
    onTrip: 0,
    completed: 0,
    avgTripDuration: "-",
    avgSpeed: 0,
    onTime: 0,
    delay: 0,
    early: 0,
  });

  const [filters, setFilters] = useState<Filters>({
  dateType: "current",
  dateValue: undefined,
  driver: "",
  route: "",
  departureRoute: "",
});


  const [loading, setLoading] = useState<boolean>(true);

  // === FETCH DATA ===
  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.driver) params.append("driver", filters.driver);
        if (filters.route) params.append("route", filters.route);

        const res = await fetch(
          `http://localhost:3001/api/vehicles?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch data");

        setData(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [filters, session?.accessToken]);

  // === FETCH STATS ===
  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/stats", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });

        if (!res.ok) throw new Error("Failed to fetch stats");

        setStats(await res.json());
      } catch {
        setStats(calculateStats(data));
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [session?.accessToken, data]);

  // === MQTT / LoRaWAN Hooks ===
  const { messages: mqttMessages, isConnected: mqttConnected } = useMQTT({
    enabled: false,
    brokerUrl: "ws://localhost:8083/mqtt",
    topics: ["vehicle/position"],
  });

  const { data: loraData, isConnected: loraConnected } = useLoRaWAN({
    enabled: false,
    apiUrl: "http://localhost:8080",
    apiKey: "your-api-key",
  });

  // === MAP DATA ===
  const vehiclePositions: VehiclePosition[] = data
    .filter((v) => v.latitude && v.longitude)
    .map((v) => ({
      id: v.id,
      vehicleId: v.id,
      latitude: v.latitude!,
      longitude: v.longitude!,
      speed: v.speed,
      timestamp: v.timestamp || undefined,
    }));

  if (loading)
    return (
      <ProtectedPage requiredRole="VIEWER">
        <div className="text-center text-cyan-400 mt-20 text-lg">Loading...</div>
      </ProtectedPage>
    );

  return (
    <ProtectedPage requiredRole="VIEWER">
      <main className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-xl shadow-lg p-4">
          <h1 className="text-center text-2xl font-bold text-cyan-400 mb-3">
            Vehicle Operation Management System
          </h1>

          <UserProfile />

          <div className="flex justify-center gap-3 text-sm mt-3">
            {[
              { label: "MQTT", connected: mqttConnected },
              { label: "LoRaWAN", connected: loraConnected },
            ].map(({ label, connected }) => (
              <div key={label} className="flex items-center gap-2 text-gray-400">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? "bg-cyan-400" : "bg-gray-600"
                  }`}
                />
                {label}:{" "}
                <span className={connected ? "text-cyan-300" : "text-gray-500"}>
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FILTER */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <FilterSection filters={filters} onFilterChange={setFilters} />
        </div>

        {/* STATS */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <StatsCards stats={stats} />
        </div>

        {/* MAP */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <VehicleMap positions={vehiclePositions} />
        </div>

        {/* TABLE */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <DataTable data={data} />
        </div>

        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Fleet Management Dashboard
        </p>
      </main>
    </ProtectedPage>
  );
}
