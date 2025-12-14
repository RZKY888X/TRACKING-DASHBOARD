"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import FilterSection from "@/components/FilterSection";
import StatsCards from "@/components/StatsCards";
import DataTable from "@/components/DataTable";
import { ProtectedPage } from "@/components/ProtectedPage";
import { UserProfile } from "@/components/UserProfile";
import { Filters, VehicleData, VehiclePosition, TripData } from "@/types";

const VehicleMap = dynamic(() => import("@/components/VehicleMap"), {
  ssr: false,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [filters, setFilters] = useState<Filters>({
    dateType: "current",
    dateValue: undefined,
    driver: "",
    route: "",
    departure: "",
  });

  const [draftFilters, setDraftFilters] = useState<Filters>(filters);

  const handleSubmitFilter = () => setFilters(draftFilters);

  const handleClearFilters = () => {
    const reset: Filters = {
      dateType: "current",
      dateValue: undefined,
      driver: "",
      route: "",
      departure: "",
    };
    setDraftFilters(reset);
    setFilters(reset);
  };

  // ===== Fetch trips baru (start) =====
  const fetchStartTrips = async (): Promise<TripData[]> => {
    const res = await fetch(`${API_URL}/api/trips/start`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch start trips");
    return res.json();
  };

  // ===== Fetch ongoing/completed trips & vehicle positions =====
  const fetchMapData = async (): Promise<{ vehicles: VehicleData[] }> => {
    const res = await fetch(`${API_URL}/api/dashboard/map`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch map data");
    return res.json();
  };

  // ===== Combine trips for DataTable =====
  const loadData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError("");
    try {
      const [startTripsData, mapData] = await Promise.all([
        fetchStartTrips(),
        fetchMapData(),
      ]);

      const allTrips: TripData[] = startTripsData.map((trip) => {
        const matched = mapData.vehicles
          .flatMap((v) => v.trips)
          .find((t) => t.id === trip.id);

        return {
          id: trip.id,
          driver: trip.driver,
          vehicle: trip.vehicle,
          route: `${trip.origin?.city ?? "-"} → ${matched?.destination?.city ?? "-"}`,
          start: trip.createdAt,
          end: matched?.endTime ?? "-",
          avgSpeed: matched?.avgSpeed ?? "-",
          status: matched?.status ?? "ON_TRIP",
          positions: matched?.vehicle?.positions ?? trip.vehicle?.positions ?? [],
        };
      });

      setTrips(allTrips);
      setVehicles(mapData.vehicles);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to fetch data");
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters, session?.accessToken]);

  // ===== Vehicle positions for Map =====
  const vehiclePositions: VehiclePosition[] = vehicles.flatMap((v) =>
    v.positions?.map((p) => ({
      id: v.id,
      vehicleId: v.id,
      name: v.name,
      driver: v.trips?.[0]?.driver?.name ?? "Unknown",
      route: `${v.trips?.[0]?.origin?.city ?? "-"} → ${v.trips?.[0]?.destination?.city ?? "-"}`,
      latitude: p.latitude,
      longitude: p.longitude,
      speed: p.speed,
      timestamp: p.timestamp,
      status: v.trips?.[0]?.status ?? "Idle",
      startTime: v.trips?.[0]?.createdAt,
      endTime: v.trips?.[0]?.endTime,
    })) ?? []
  );

  if (loading) {
    return (
      <ProtectedPage requiredRole="VIEWER">
        <main className="p-6 text-cyan-400">Loading dashboard...</main>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredRole="VIEWER">
      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-xl p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-400">
            Vehicle Operation Management System
          </h1>
          <UserProfile />
        </div>

        {/* Filters */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyan-400">Filters</h2>
            <div className="space-x-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-red-900/30 text-red-300 rounded"
              >
                Clear
              </button>
              <button
                onClick={handleSubmitFilter}
                className="px-4 py-2 bg-cyan-900/30 text-cyan-300 rounded"
              >
                Submit
              </button>
            </div>
          </div>
          <FilterSection filters={draftFilters} onFilterChange={setDraftFilters} />
        </div>

        {/* Stats Cards */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <StatsCards data={trips} />
        </div>

        {/* Vehicle Map */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          <VehicleMap positions={vehiclePositions} />
        </div>

        {/* Data Table */}
        <div className="bg-[#0f1729] border border-cyan-400/30 rounded-lg p-4">
          {error ? <div className="text-red-400">{error}</div> : <DataTable data={trips} />}
        </div>
      </main>
    </ProtectedPage>
  );
}
