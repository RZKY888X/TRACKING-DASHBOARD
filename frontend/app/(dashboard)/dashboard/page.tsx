"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

import { ProtectedPage } from "@/components/ProtectedPage";
import FilterSection from "@/components/FilterSection";
import DataTable from "@/components/DataTable";

import StatsOverview from "./components/StatsOverview";
import LiveFleetMapCard from "./components/LiveFleetMapCard";
import PerformanceChart from "./components/PerformanceChart";
import TripStatusDonut from "./components/TripStatusDonut";

import { Filters, VehiclePosition } from "@/types";

const VehicleMap = dynamic(() => import("@/components/map/VehicleMap"), {
  ssr: false,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DashboardPage() {
  const { data: session } = useSession();

  /* =======================
   * FILTER STATE
   * ======================= */
  const [filters, setFilters] = useState<Filters>({
    dateType: "current",
    dateValue: "",
    driver: "",
    route: "",
    departureRoute: "",
  });

  const [draftFilters, setDraftFilters] = useState<Filters>(filters);

  const handleApplyFilters = () => {
    setFilters(draftFilters);
  };

  const handleClearFilters = () => {
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

  /* =======================
   * MAP DATA
   * ======================= */
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>(
    []
  );
  const [mapError, setMapError] = useState("");
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;

    const loadVehiclePositions = async () => {
      try {
        setMapLoading(true);

        const res = await fetch(`${API_URL}/api/dashboard/map`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch map data");
        }

        const data = await res.json();
        const positions: VehiclePosition[] = [];

        if (data.vehicles) {
          data.vehicles.forEach((vehicle: any) => {
            if (vehicle.positions?.length) {
              const latest = vehicle.positions[0];
              positions.push({
                id: latest.id,
                vehicleId: vehicle.id,
                name: vehicle.plate,
                driver: "Unknown",
                route: "No Active Trip",
                latitude: latest.latitude,
                longitude: latest.longitude,
                speed: latest.speed || 0,
                timestamp: latest.timestamp,
                status: "IDLE",
                startTime: null,
                endTime: null,
              });
            }
          });
        }

        setVehiclePositions(positions);
        setMapError("");
      } catch (err) {
        setMapError("Failed to load vehicle positions");
      } finally {
        setMapLoading(false);
      }
    };

    loadVehiclePositions();
    const interval = setInterval(loadVehiclePositions, 30000);
    return () => clearInterval(interval);
  }, [session?.accessToken]);

  /* =======================
   * RENDER
   * ======================= */
  return (
    <ProtectedPage requiredRole='VIEWER'>
      <div className='p-6 space-y-8 bg-[#0a0e1a] min-h-screen'>
        {/* ================= HEADER ================= */}
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-white'>
              Executive Overview
            </h1>
            <p className='text-gray-400 mt-1'>
              High-level operational performance metrics and live fleet status.
            </p>
          </div>

          <button
            onClick={() => console.log("Download data")}
            className='
              px-4 py-2 rounded-lg text-sm font-medium
              bg-cyan-600 text-white
              hover:bg-cyan-700 transition
            '
          >
            Download Data
          </button>
        </div>

        {/* ================= FILTER ================= */}
        <FilterSection
          filters={draftFilters}
          onFilterChange={setDraftFilters}
          onClear={handleClearFilters}
          onApply={handleApplyFilters}
        ></FilterSection>

        {/* ================= STATS ================= */}
        <StatsOverview />

        {/* ================= MAP ================= */}
        <LiveFleetMapCard positions={vehiclePositions} />

        {/* ================= CHARTS ================= */}
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <div className='xl:col-span-2'>
            <PerformanceChart />
          </div>
          <TripStatusDonut />
        </div>

        {/* ================= TABLE ================= */}

          <DataTable filters={filters} />
      </div>
    </ProtectedPage>
  );
}
