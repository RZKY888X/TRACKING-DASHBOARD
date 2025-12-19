// frontend/app/(dashboard)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { ProtectedPage } from "@/components/ProtectedPage";
import FilterSection from "@/components/FilterSection";
import DashboardStats from "./components/DashboardStats";
import DataTable from "@/components/DataTable";
import { Filters, VehiclePosition } from "@/types";

const VehicleMap = dynamic(() => import("@/components/map/VehicleMap"), {
  ssr: false,
  loading: () => (
    <div className='h-[400px] bg-[#0f1729] rounded-lg flex items-center justify-center border border-cyan-500/20'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2' />
        <span className='text-gray-400 text-sm'>Loading map...</span>
      </div>
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DashboardPage() {
  const { data: session } = useSession();

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

  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>(
    []
  );
  const [mapError, setMapError] = useState("");
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    const loadVehiclePositions = async () => {
      try {
        setMapLoading(true);

        const res = await fetch(`${API_URL}/api/dashboard/map`, {
          headers: session?.accessToken
            ? { Authorization: `Bearer ${session.accessToken}` }
            : {},
        });

        if (!res.ok) throw new Error("Failed to load vehicle positions");

        const data = await res.json();
        const positions: VehiclePosition[] = [];

        if (data.vehicles) {
          data.vehicles.forEach((vehicle: any) => {
            if (vehicle.positions?.length) {
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

  return (
    <ProtectedPage requiredRole='VIEWER'>
      <div className='p-6 space-y-6 bg-[#0f1729] min-h-screen'>
        {/* Header */}
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-white'>
              Executive Overview
            </h1>
            <p className='text-gray-400 mt-1'>
              High-level operational performance metrics and live fleet status
            </p>
          </div>

          {/* Download Button */}
          <button
            onClick={() => {
              // nanti bisa kamu isi logic download CSV / Excel
              console.log("Download data");
            }}
            className='
            h-fit px-4 py-2 rounded-lg text-sm font-medium
            bg-cyan-600 text-white
            hover:bg-cyan-700
            transition
            flex items-center gap-2
          '
          >
            Download Data
          </button>
        </div>

        {/* Filters */}
        <div className='bg-[#0b1324] border border-cyan-500/20 rounded-xl p-5'>
          <div className='flex items-center justify-between mb-5'>
            <h2 className='text-lg font-semibold text-cyan-400'>Filters</h2>

            <div className='flex gap-2'>
              <button
                onClick={handleClearFilters}
                className='px-4 py-2 rounded-lg text-sm font-medium
                bg-red-900/20 text-red-300
                hover:bg-red-900/40 transition'
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className='px-4 py-2 rounded-lg text-sm font-medium
                bg-cyan-600 text-white
                hover:bg-cyan-700 transition'
              >
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
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold text-white'>
              Overview Statistics
            </h2>

            {filters.dateType !== "current" && (
              <span
                className='text-sm px-3 py-1 rounded-full
              bg-cyan-500/15 text-cyan-300
              border border-cyan-500/25'
              >
                {filters.dateType === "daily"
                  ? `Daily: ${new Date(
                      filters.dateValue || ""
                    ).toLocaleDateString("id-ID")}`
                  : filters.dateType === "weekly"
                  ? `Weekly: ${filters.dateValue}`
                  : `Monthly: ${filters.dateValue}`}
              </span>
            )}
          </div>

          <DashboardStats filters={filters} />
        </div>

        {/* Map */}
        <div className='bg-[#0b1324] border border-cyan-500/20 rounded-xl p-5'>
          <div className='mb-4'>
            <h2 className='text-xl font-semibold text-white'>
              Vehicle Locations
            </h2>
            <p className='text-gray-400 text-sm mt-1'>
              Real-time GPS positions on map
            </p>
          </div>

          {mapError ? (
            <div className='bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400'>
              {mapError}
            </div>
          ) : (
            <VehicleMap positions={vehiclePositions} />
          )}
        </div>

        {/* Table */}
        <div className='bg-[#0b1324] border border-cyan-500/20 rounded-xl p-5'>
          <div className='mb-4'>
            <h2 className='text-xl font-semibold text-white'>Trip Details</h2>
            <p className='text-gray-400 text-sm mt-1'>
              Filtered trip information
            </p>
          </div>

          <DataTable filters={filters} />
        </div>
      </div>
    </ProtectedPage>
  );
}
