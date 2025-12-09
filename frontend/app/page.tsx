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

  const [filters, setFilters] = useState<Filters>({
    dateType: "current",
    dateValue: undefined,
    driver: "",
    route: "",
    departure: "",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // === HANDLE CLEAR FILTERS ===
  const handleClearFilters = () => {
    setFilters({
      dateType: "current",
      dateValue: undefined,
      driver: "",
      route: "",
      departure: "",
    });
  };

  // === CHECK IF ANY FILTER IS ACTIVE ===
  const hasActiveFilters = () => {
    return (
      filters.driver !== "" ||
      filters.route !== "" ||
      filters.departure !== "" ||
      (filters.dateValue !== undefined && filters.dateValue !== "Current")
    );
  };

  // === FETCH DATA ===
  const fetchData = async (showRefreshing = false) => {
    if (!session?.accessToken) return;

    if (showRefreshing) {
      setRefreshing(true);
    }

    try {
      const params = new URLSearchParams();
      
      // Add all filters to params
      if (filters.driver) params.append("driver", filters.driver);
      if (filters.route) params.append("route", filters.route);
      if (filters.departure) params.append("departure", filters.departure);
      if (filters.dateType) params.append("dateType", filters.dateType);
      if (filters.dateValue && filters.dateValue !== "Current") {
        params.append("dateValue", filters.dateValue);
      }

      const res = await fetch(
        `${API_URL}/api/vehicles/filtered?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch data");

      const data = await res.json();
      setData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (showRefreshing) {
        setRefreshing(false);
      }
    }
  };

  // === FETCH STATS ===
  const fetchStats = async () => {
    if (!session?.accessToken) return;

    try {
      const params = new URLSearchParams();
      
      // Apply same filters to stats
      if (filters.driver) params.append("driver", filters.driver);
      if (filters.route) params.append("route", filters.route);
      if (filters.departure) params.append("departure", filters.departure);
      if (filters.dateType) params.append("dateType", filters.dateType);
      if (filters.dateValue && filters.dateValue !== "Current") {
        params.append("dateValue", filters.dateValue);
      }

      const res = await fetch(
        `${API_URL}/api/stats?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );

      if (res.ok) {
        const statsData = await res.json();
        setStats(statsData);
      } else {
        setStats(calculateStats(data));
      }
    } catch {
      setStats(calculateStats(data));
    }
  };

  // === INITIAL FETCH ===
  useEffect(() => {
    if (session?.accessToken) {
      fetchData();
      fetchStats();
    }
  }, [session?.accessToken]);

  // === FETCH ON FILTER CHANGE ===
  useEffect(() => {
    if (session?.accessToken) {
      const timer = setTimeout(() => {
        fetchData();
        fetchStats();
      }, 300); // Debounce for 300ms

      return () => clearTimeout(timer);
    }
  }, [filters, session?.accessToken]);

  // === AUTO REFRESH ===
  useEffect(() => {
    if (!session?.accessToken) return;

    const interval = setInterval(() => {
      fetchData(true);
      fetchStats();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [session?.accessToken, filters]);

  // === MQTT / LoRaWAN Hooks ===
  const { messages: mqttMessages, isConnected: mqttConnected } = useMQTT({
    enabled: false,
    brokerUrl: MQTT_BROKER_URL,
    topics: ["vehicle/position"],
  });

  const { data: loraData, isConnected: loraConnected } = useLoRaWAN({
    enabled: false,
    apiUrl: LORA_API_URL,
    apiKey: LORA_API_KEY,
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

  // === LOADING COMPONENT ===
  if (loading) {
    return (
      <ProtectedPage requiredRole="VIEWER">
        <main className="flex-1 p-6 space-y-6">
          {/* HEADER LOADING */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-xl shadow-lg p-4 animate-pulse">
            <div className="h-8 bg-cyan-900/30 rounded w-1/3 mx-auto mb-3"></div>
            <div className="h-6 bg-cyan-900/20 rounded w-1/4 mx-auto"></div>
          </div>

          {/* FILTER LOADING */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-cyan-900/20 rounded w-20 mb-2"></div>
                  <div className="h-12 bg-cyan-900/30 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* STATS LOADING */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#1a2332] rounded-lg p-4">
                  <div className="h-4 bg-cyan-900/20 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-cyan-900/30 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>

          {/* MAP LOADING */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
            <div className="h-[400px] bg-cyan-900/10 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"></div>
                <p className="mt-4 text-cyan-400 text-lg font-semibold">Loading Vehicle Data...</p>
                <p className="mt-2 text-gray-400 text-sm">Fetching real-time vehicle positions</p>
              </div>
            </div>
          </div>

          {/* TABLE LOADING */}
          <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
            <div className="space-y-3">
              <div className="h-6 bg-cyan-900/20 rounded w-1/4 mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-cyan-900/10 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredRole="VIEWER">
      <main className="flex-1 p-6 space-y-6">

        {/* HEADER */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-2xl font-bold text-cyan-400">
              Vehicle Operation Management System
            </h1>
            <div className="flex items-center space-x-3">
              {refreshing && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent"></div>
                  <span className="text-sm text-cyan-300">Updating...</span>
                </div>
              )}
              {lastUpdated && (
                <span className="text-xs text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <UserProfile />

          <div className="flex justify-center gap-3 text-sm mt-3">
            {[
              { label: "MQTT", connected: mqttConnected },
              { label: "LoRaWAN", connected: loraConnected },
            ].map(({ label, connected }) => (
              <div key={label} className="flex items-center gap-2 text-gray-400">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? "bg-cyan-400 animate-pulse" : "bg-gray-600"
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

        {/* FILTER SECTION */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-cyan-400">Filters</h2>
            <div className="flex space-x-3">
              {hasActiveFilters() && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm bg-red-900/30 hover:bg-red-800/40 text-red-300 rounded-lg border border-red-700/50 transition-all duration-200 flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear All Filters</span>
                </button>
              )}
              <button
                onClick={() => fetchData(true)}
                className="px-4 py-2 text-sm bg-cyan-900/30 hover:bg-cyan-800/40 text-cyan-300 rounded-lg border border-cyan-700/50 transition-all duration-200 flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          <FilterSection filters={filters} onFilterChange={setFilters} />

          {/* ACTIVE FILTERS DISPLAY */}
          {hasActiveFilters() && (
            <div className="mt-4 p-3 bg-cyan-900/10 border border-cyan-400/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-cyan-300">Active Filters:</span>
                <span className="text-xs text-gray-400">{data.length} vehicles found</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.driver && (
                  <div className="px-3 py-1 bg-cyan-900/30 rounded-full text-sm text-cyan-200 border border-cyan-700/50 flex items-center">
                    <span className="mr-2">Driver:</span>
                    <span className="font-medium">{filters.driver}</span>
                    <button
                      onClick={() => setFilters({...filters, driver: ""})}
                      className="ml-2 text-cyan-400 hover:text-cyan-300"
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.route && (
                  <div className="px-3 py-1 bg-cyan-900/30 rounded-full text-sm text-cyan-200 border border-cyan-700/50 flex items-center">
                    <span className="mr-2">Origin:</span>
                    <span className="font-medium">{filters.route}</span>
                    <button
                      onClick={() => setFilters({...filters, route: ""})}
                      className="ml-2 text-cyan-400 hover:text-cyan-300"
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.departure && (
                  <div className="px-3 py-1 bg-cyan-900/30 rounded-full text-sm text-cyan-200 border border-cyan-700/50 flex items-center">
                    <span className="mr-2">Departure:</span>
                    <span className="font-medium">{filters.departure}</span>
                    <button
                      onClick={() => setFilters({...filters, departure: ""})}
                      className="ml-2 text-cyan-400 hover:text-cyan-300"
                    >
                      ×
                    </button>
                  </div>
                )}
                {filters.dateValue && filters.dateValue !== "Current" && (
                  <div className="px-3 py-1 bg-cyan-900/30 rounded-full text-sm text-cyan-200 border border-cyan-700/50 flex items-center">
                    <span className="mr-2">Date:</span>
                    <span className="font-medium">
                      {filters.dateType === "daily" ? filters.dateValue : 
                       filters.dateType === "weekly" ? `Week ${filters.dateValue}` : 
                       filters.dateType === "monthly" ? filters.dateValue : filters.dateValue}
                    </span>
                    <button
                      onClick={() => setFilters({...filters, dateValue: undefined, dateType: "current"})}
                      className="ml-2 text-cyan-400 hover:text-cyan-300"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STATS */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-cyan-400">Performance Statistics</h2>
            <div className="text-sm text-gray-400">
              {hasActiveFilters() ? "Filtered statistics" : "Overall statistics"}
            </div>
          </div>
          <StatsCards stats={stats} />
        </div>

        {/* MAP */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-cyan-400">Vehicle Locations</h2>
            <div className="text-sm text-cyan-300">
              <span className="px-3 py-1 bg-cyan-900/30 rounded-full">
                {vehiclePositions.length} vehicles on map
              </span>
            </div>
          </div>
          <VehicleMap positions={vehiclePositions} />
        </div>

        {/* TABLE */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-cyan-400">Vehicle Details</h2>
            <div className="text-sm text-gray-400">
              Showing {data.length} of {data.length} vehicles
            </div>
          </div>
          <DataTable data={data} />
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>© {new Date().getFullYear()} Fleet Management Dashboard • Data updates every 10 seconds</p>
          {lastUpdated && (
            <p className="text-cyan-400/70">Last data refresh: {lastUpdated.toLocaleTimeString()}</p>
          )}
          <div className="flex justify-center space-x-4 mt-2">
            <span className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
              <span>Online: {stats.onTrip}</span>
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
              <span>Idle: {stats.idle}</span>
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-cyan-500 mr-1"></div>
              <span>Completed: {stats.completed}</span>
            </span>
          </div>
        </div>
      </main>
    </ProtectedPage>
  );
}