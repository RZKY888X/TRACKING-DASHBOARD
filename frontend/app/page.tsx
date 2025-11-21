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
import {
  Filters,
  VehicleData,
  VehiclePosition,
  VehicleStats,
} from "@/types";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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
    date: "",
    driver: "",
    route: "",
  });

  const [loading, setLoading] = useState<boolean>(true);

  // FETCH DATA
  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchData = async (): Promise<void> => {
      try {
        const params = new URLSearchParams();
        if (filters.driver) params.append("driver", filters.driver);
        if (filters.route) params.append("route", filters.route);

        const res = await fetch(
          `http://localhost:3001/api/vehicles?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch data");
        const fetched: VehicleData[] = await res.json();
        setData(fetched);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [filters, session?.accessToken]);

  // FETCH STATS
  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/stats", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch stats");

        const backendStats: VehicleStats = await res.json();
        setStats(backendStats);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(calculateStats(data)); // fallback
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [session?.accessToken, data]);

  // EXPORT EXCEL (Single Button)
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Vehicle Report");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Vehicle Name", key: "vehicleName", width: 22 },
      { header: "Driver", key: "driver", width: 18 },
      { header: "Route", key: "route", width: 18 },
      { header: "Speed (km/h)", key: "speed", width: 15 },
      { header: "Status", key: "status", width: 18 },
      { header: "Latitude", key: "latitude", width: 14 },
      { header: "Longitude", key: "longitude", width: 14 },
      { header: "Timestamp", key: "timestamp", width: 22 },
    ];

    data.forEach((item) => {
      sheet.addRow({
        id: item.id,
        vehicleName: item.vehicleName,
        driver: item.driver,
        route: item.route,
        speed: item.speed,
        status: item.status,
        latitude: item.latitude,
        longitude: item.longitude,
        timestamp: item.timestamp,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "vehicle-report.xlsx");
  };

  // MQTT
  const { messages: mqttMessages, isConnected: mqttConnected } = useMQTT({
    enabled: false,
    brokerUrl: "ws://localhost:8083/mqtt",
    topics: ["vehicle/position"],
  });

  useEffect(() => {
    if (mqttMessages.length > 0) {
      console.log("MQTT Update:", mqttMessages[mqttMessages.length - 1]);
    }
  }, [mqttMessages]);

  // LORAWAN
  const { data: loraData, isConnected: loraConnected } = useLoRaWAN({
    enabled: false,
    apiUrl: "http://localhost:8080",
    apiKey: "your-api-key",
  });

  useEffect(() => {
    if (loraData.length > 0) {
      console.log("LoRaWAN Update:", loraData[loraData.length - 1]);
    }
  }, [loraData]);

  // MAP DATA
  const vehiclePositions: VehiclePosition[] = data
    .filter((v) => v.latitude !== null && v.longitude !== null)
    .map((v) => ({
      id: v.id,
      vehicleId: v.id,
      latitude: v.latitude as number,
      longitude: v.longitude as number,
      speed: v.speed,
      timestamp: v.timestamp ?? undefined,
    }));

  // LOADING
  if (loading) {
    return (
      <ProtectedPage requiredRole="VIEWER">
        <div className="text-center text-cyan-400 mt-20 text-lg">Loading...</div>
      </ProtectedPage>
    );
  }

  // RENDER
  return (
    <ProtectedPage requiredRole="VIEWER">
      <main className="min-h-screen bg-[#050812] text-gray-200 px-3 md:px-4 py-2">
        <div className="max-w-7xl mx-auto space-y-3">

          {/* HEADER */}
          <div className="bg-[#0B1120] border border-cyan-500/20 rounded-xl shadow-[0_0_15px_#00FFFF15] p-4">
            <div className="text-center mb-3">
              <h1 className="text-xl md:text-2xl font-bold text-cyan-400 tracking-wide drop-shadow-[0_0_8px_#00FFFF80]">
                Vehicle Operation Management System
              </h1>
            </div>

            <div className="mb-3">
              <UserProfile />
            </div>

            <div className="flex justify-center gap-3 text-[11px] md:text-sm text-gray-400">
              {[{ label: "MQTT", connected: mqttConnected }, { label: "LoRaWAN", connected: loraConnected }].map(
                ({ label, connected }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${connected ? "bg-cyan-400" : "bg-gray-600"}`}
                    />
                    <span>
                      {label}:{" "}
                      <span className={connected ? "text-cyan-300" : "text-gray-500"}>
                        {connected ? "Connected" : "Disconnected"}
                      </span>
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* FILTER */}
          <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_10px_#00FFFF10] p-3 md:p-4">
            <FilterSection filters={filters} onFilterChange={setFilters} />
          </div>

          {/* STATS */}
          <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_10px_#00FFFF10] p-3">
            <StatsCards stats={stats} />
          </div>

          {/* MAP */}
          <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_10px_#00FFFF10] p-3">
            <VehicleMap positions={vehiclePositions} />
          </div>

          {/* TABLE (NO EXPORT BUTTON HERE) */}
          <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_10px_#00FFFF10] p-3">
            <DataTable data={data} />
          </div>

          {/* FOOTER */}
          <p className="text-center text-[10px] md:text-[11px] text-gray-500 py-2">
            © {new Date().getFullYear()} Fleet Management Dashboard — Compact Neon Layout
          </p>
        </div>
      </main>
    </ProtectedPage>
  );
}
