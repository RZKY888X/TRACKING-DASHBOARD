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
  loading: () => (
    <div className="h-[400px] bg-[#0f1729] border border-cyan-400/30 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        <p className="mt-2 text-cyan-400">Loading map...</p>
      </div>
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MQTT_BROKER_URL = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
const LORA_API_URL = process.env.NEXT_PUBLIC_LORA_API_URL;
const LORA_API_KEY = process.env.NEXT_PUBLIC_LORA_API_KEY;

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

  // ✅ FILTER YANG SUDAH DISUBMIT (UNTUK FETCH)
  const [filters, setFilters] = useState<Filters>({
    dateType: "current",
    dateValue: undefined,
    driver: "",
    route: "",
    departure: "",
  });

  // ✅ FILTER DRAFT (UNTUK UI)
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ SUBMIT FILTER
  const handleSubmitFilter = () => {
    setFilters(draftFilters);
  };

  // ✅ CLEAR FILTER
  const handleClearFilters = () => {
    const reset = {
      dateType: "current",
      dateValue: undefined,
      driver: "",
      route: "",
      departure: "",
    };
    setDraftFilters(reset);
    setFilters(reset);
  };

  const hasActiveFilters = () => {
    return (
      filters.driver !== "" ||
      filters.route !== "" ||
      filters.departure !== "" ||
      (filters.dateValue !== undefined && filters.dateValue !== "Current")
    );
  };

  // ✅ FETCH DATA
  const fetchData = async (showRefreshing = false) => {
    if (!session?.accessToken) return;
    if (showRefreshing) setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (filters.driver) params.append("driver", filters.driver);
      if (filters.route) params.append("route", filters.route);
      if (filters.departure) params.append("departure", filters.departure);
      if (filters.dateType) params.append("dateType", filters.dateType);
      if (filters.dateValue && filters.dateValue !== "Current") {
        params.append("dateValue", filters.dateValue);
      }

      const res = await fetch(
        `${API_URL}/api/vehicles/filtered?${params.toString()}`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );

      if (!res.ok) throw new Error("Failed to fetch data");

      const result = await res.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  // ✅ FETCH STATS
  const fetchStats = async () => {
    if (!session?.accessToken) return;

    try {
      const params = new URLSearchParams();
      if (filters.driver) params.append("driver", filters.driver);
      if (filters.route) params.append("route", filters.route);
      if (filters.departure) params.append("departure", filters.departure);
      if (filters.dateType) params.append("dateType", filters.dateType);
      if (filters.dateValue && filters.dateValue !== "Current") {
        params.append("dateValue", filters.dateValue);
      }

      const res = await fetch(
        `${API_URL}/api/stats?${params.toString()}`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );

      if (res.ok) setStats(await res.json());
      else setStats(calculateStats(data));
    } catch {
      setStats(calculateStats(data));
    }
  };

  // ✅ FETCH SAAT FILTER DISUBMIT
  useEffect(() => {
    if (session?.accessToken) {
      fetchData();
      fetchStats();
    }
  }, [filters, session?.accessToken]);

  // ✅ AUTO REFRESH 10 DETIK (PAKAI FILTER AKTIF)
  useEffect(() => {
    if (!session?.accessToken) return;
    const interval = setInterval(() => {
      fetchData(true);
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [session?.accessToken, filters]);

  const { isConnected: mqttConnected } = useMQTT({
    enabled: false,
    brokerUrl: MQTT_BROKER_URL,
    topics: ["vehicle/position"],
  });

  const { isConnected: loraConnected } = useLoRaWAN({
    enabled: false,
    apiUrl: LORA_API_URL,
    apiKey: LORA_API_KEY,
  });

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

  if (loading) {
    return (
      <ProtectedPage requiredRole="VIEWER">
        <main className="flex-1 p-6 space-y-6 text-cyan-400">
          Loading Dashboard...
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredRole="VIEWER">
      <main className="flex-1 p-6 space-y-6">

        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-xl shadow-lg p-4">
          <h1 className="text-2xl font-bold text-cyan-400">
            Vehicle Operation Management System
          </h1>
          <UserProfile />
        </div>

        {/* ✅ FILTER SECTION */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-cyan-400">Filters</h2>
            <div className="flex space-x-3">
              {hasActiveFilters() && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm bg-red-900/30 text-red-300 rounded-lg"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleSubmitFilter}
                className="px-4 py-2 text-sm bg-cyan-900/30 text-cyan-300 rounded-lg"
              >
                Submit Filter
              </button>
            </div>
          </div>

          {/* ✅ PAKAI DRAFT FILTER */}
          <FilterSection filters={draftFilters} onFilterChange={setDraftFilters} />
        </div>

        {/* STATS */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <StatsCards stats={stats} />
        </div>

        {/* ✅ MAP (BISA KAMU PERBESAR LAGI DI VehicleMap) */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <VehicleMap positions={vehiclePositions} />
        </div>

        {/* TABLE */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <DataTable data={data} />
        </div>

        <div className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Fleet Management Dashboard
        </div>

      </main>
    </ProtectedPage>
  );
}
