"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import FilterSection from "@/components/FilterSection";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import { ProtectedPage } from "@/components/ProtectedPage";
import { UserProfile } from "@/components/UserProfile";
import { Filters, VehiclePosition } from "@/types";

const VehicleMap = dynamic(() => import("@/components/VehicleMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-[#161B22] rounded-lg flex items-center justify-center">
      <div className="text-cyan-400">Loading map...</div>
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function HomePage() {
  const { data: session } = useSession();

  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState<Filters>({
    dateType: "current",
    dateValue: "",
    driver: "",
    route: "",
    departureRoute: "",
  });

  const [draftFilters, setDraftFilters] = useState<Filters>(filters);

  const handleSubmitFilter = () => {
    console.log("✅ Applying filters:", draftFilters);
    setFilters(draftFilters);
  };

  const handleClearFilters = () => {
    console.log("🧹 Clearing filters");
    const reset: Filters = {
      dateType: "current",
      dateValue: "",
      driver: "",
      route: "",
      departureRoute: "",
    };
    setDraftFilters(reset);
    setFilters(reset);
  };

  // Load vehicle positions untuk map
  useEffect(() => {
    const loadVehiclePositions = async () => {
      try {
        setLoading(true);
        
        const res = await fetch(`${API_URL}/api/dashboard/map`, {
          headers: session?.accessToken ? {
            Authorization: `Bearer ${session.accessToken}`,
          } : {},
        });

        if (!res.ok) throw new Error("Failed to load vehicle positions");

        const data = await res.json();
        
        // Transform to VehiclePosition format
        const positions: VehiclePosition[] = [];
        
        if (data.vehicles) {
          data.vehicles.forEach((vehicle: any) => {
            if (vehicle.positions && vehicle.positions.length > 0) {
              const latestPos = vehicle.positions[0];
              positions.push({
                id: latestPos.id,
                vehicleId: vehicle.id,
                name: vehicle.plate,
                driver: "Unknown",
                route: "No Active Trip",
                latitude: latestPos.latitude,
                longitude: latestPos.longitude,
                speed: latestPos.speed || 0,
                timestamp: latestPos.timestamp,
                status: "IDLE",
                startTime: null,
                endTime: null,
              });
            }
          });
        }

        setVehiclePositions(positions);
      } catch (err: any) {
        console.error("❌ Error loading vehicle positions:", err);
        setError("Failed to load vehicle positions");
      } finally {
        setLoading(false);
      }
    };

    loadVehiclePositions();
    const interval = setInterval(loadVehiclePositions, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [session?.accessToken]);

  if (loading && !filters.dateType) {
    return (
      <ProtectedPage requiredRole="VIEWER">
        <main className="p-6 text-cyan-400">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <span className="ml-3">Loading dashboard...</span>
          </div>
        </main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredRole="VIEWER">
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-xl p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">
              Vehicle Operation Management System
            </h1>
            <p className="text-gray-400 mt-1">
              Real-time tracking and trip management
            </p>
          </div>
          <UserProfile />
        </div>

        {/* Filters */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-cyan-400">Filters</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-red-900/30 text-red-300 rounded-lg hover:bg-red-900/50 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All
              </button>
              <button
                onClick={handleSubmitFilter}
                className="px-4 py-2 bg-cyan-900/30 text-cyan-300 rounded-lg hover:bg-cyan-900/50 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Apply Filters
              </button>
            </div>
          </div>

          <FilterSection
            filters={draftFilters}
            onFilterChange={setDraftFilters}
          />
        </div>

        {/* Stats */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-cyan-400">Overview Statistics</h3>
            {filters.dateType && (
              <span className="text-sm text-cyan-300 bg-cyan-900/20 px-3 py-1 rounded-full">
                {filters.dateType === "current" 
                  ? "All Data" 
                  : filters.dateType === "daily" 
                    ? `Daily: ${new Date(filters.dateValue || '').toLocaleDateString('id-ID')}`
                    : filters.dateType === "weekly"
                      ? `Weekly: ${filters.dateValue}`
                      : `Monthly: ${filters.dateValue}`
                }
              </span>
            )}
          </div>
          <StatsCards filters={filters} />
        </div>

        {/* Map */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-cyan-400">Vehicle Locations</h3>
            <p className="text-gray-400 text-sm">Real-time vehicle positions on map</p>
          </div>
          {error ? (
            <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
              {error}
            </div>
          ) : (
            <VehicleMap positions={vehiclePositions} />
          )}
        </div>

        {/* Table */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-cyan-400">Trip Details</h3>
            <p className="text-gray-400 text-sm">Filtered trip information</p>
          </div>
          <DataTable filters={filters} />
        </div>
      </main>
    </ProtectedPage>
  );
}