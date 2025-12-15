"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Trip, Filters } from "@/types";

interface Props {
  filters?: Filters;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DataTable({ filters }: Props) {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [total, setTotal] = useState(0);
  const limit = 5;

  // Fetch trips dengan filter
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        
        // Build query params
        const params = new URLSearchParams();
        
        if (filters) {
          if (filters.dateType) params.append('dateType', filters.dateType);
          if (filters.dateValue) params.append('dateValue', filters.dateValue);
          if (filters.driver && filters.driver !== "Select Driver" && filters.driver !== "No drivers available") {
            params.append('driverName', filters.driver);
          }
          if (filters.route && filters.route !== "Select Origin" && filters.route !== "No origins available") {
            params.append('originName', filters.route);
          }
          if (filters.departureRoute && filters.departureRoute !== "Select Departure" && filters.departureRoute !== "No departures available") {
            params.append('destinationName', filters.departureRoute);
          }
        }

        console.log("📋 Fetching trips with params:", params.toString());

        const res = await fetch(`${API_URL}/api/trips/filter?${params}`, {
          headers: session?.accessToken ? {
            Authorization: `Bearer ${session.accessToken}`,
          } : {},
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ API Error:", errorText);
          throw new Error(`Failed to fetch trips: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.success) {
          console.log(`✅ Received ${data.trips?.length || 0} trips`);
          // Sort trips: ON_TRIP first, then by startTime desc
          const sortedTrips = (data.trips || []).sort((a: any, b: any) => {
            if (a.status === "ON_TRIP" && b.status !== "ON_TRIP") return -1;
            if (a.status !== "ON_TRIP" && b.status === "ON_TRIP") return 1;
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
          });
          
          setTrips(sortedTrips);
          setTotal(data.count || 0);
        } else {
          console.error("❌ API returned error:", data.error);
          setTrips([]);
          setTotal(0);
        }
      } catch (error) {
        console.error("❌ Error fetching trips:", error);
        setTrips([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [filters, session?.accessToken]);

  useEffect(() => {
    setPage(1);
  }, [trips]);

  const paginated = trips.slice((page - 1) * limit, page * limit);

  const formatTime = (val?: string) => {
    if (!val) return "—";
    try {
      return new Date(val).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return "—";
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ON_TRIP":
        return (
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">ON TRIP</span>
          </div>
        );
      case "COMPLETED":
        return (
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">COMPLETED</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
            <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">{status}</span>
          </div>
        );
    }
  };

  const getSpeedDisplay = (trip: any) => {
    // Prioritaskan avgSpeed dari database jika ada
    if (trip.avgSpeed !== null && trip.avgSpeed !== undefined) {
      return {
        value: trip.avgSpeed,
        source: "database",
        tooltip: "Average speed from database"
      };
    }
    // Jika tidak ada avgSpeed, gunakan dari latest position
    else if (trip.latestPosition?.speed) {
      return {
        value: trip.latestPosition.speed,
        source: "gps",
        tooltip: "Latest GPS speed"
      };
    }
    // Jika tidak ada sama sekali
    else {
      return {
        value: 0,
        source: "none",
        tooltip: "No speed data available"
      };
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg">
        <div className="p-4 border-b border-[#1F2A37]">
          <h2 className="text-lg text-gray-100 font-semibold">Trip Table</h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-2">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg">
      <div className="p-4 border-b border-[#1F2A37] flex justify-between items-center">
        <div>
          <h2 className="text-lg text-gray-100 font-semibold">Trip Table</h2>
          <p className="text-sm text-gray-400 mt-1">
            Showing {paginated.length} of {trips.length} trips
            {filters?.dateType && (
              <span className="ml-2 text-cyan-400">
                • Filter: {filters.dateType} {filters.dateValue ? `(${filters.dateValue})` : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-[#1F2A37] text-gray-200">
            <tr>
              {["Vehicle", "Driver", "Route", "Status", "Start", "End", "Speed", "Last Update"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-sm">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1F2A37]">
            {trips.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No trips found for the selected filters</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Try changing your filter criteria
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((trip: any) => {
                const speedInfo = getSpeedDisplay(trip);
                const isActive = trip.status === "ON_TRIP";

                return (
                  <tr key={trip.id} className={`hover:bg-[#161B22] ${isActive ? 'bg-[#0f1729]/50' : ''}`}>
                    {/* Vehicle */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-300">{trip.vehicle?.plate || "Unknown"}</div>
                      <div className="text-xs text-gray-400">{trip.vehicle?.type || "No Type"}</div>
                    </td>

                    {/* Driver */}
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{trip.driver?.name || "Unknown Driver"}</div>
                    </td>

                    {/* Route */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center text-gray-300">
                          <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="font-medium">{trip.origin?.name || "Unknown"}</span>
                          <span className="mx-2 text-gray-500">→</span>
                          <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="font-medium">{trip.destination?.name || "Unknown"}</span>
                        </div>
                        <div className="text-xs text-gray-400 pl-6">
                          {trip.origin?.city || ""} → {trip.destination?.city || ""}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {getStatusBadge(trip.status)}
                    </td>

                    {/* Start */}
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{formatTime(trip.startTime)}</div>
                    </td>

                    {/* End */}
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{formatTime(trip.endTime)}</div>
                    </td>

                    {/* Speed */}
                    <td className="px-4 py-3">
                      <div className="relative group">
                        <div className={`font-medium ${
                          speedInfo.source === "database" 
                            ? 'text-green-400' 
                            : speedInfo.source === "gps" 
                            ? 'text-yellow-400' 
                            : 'text-gray-400'
                        }`}>
                          {speedInfo.value > 0 ? `${speedInfo.value} km/h` : "—"}
                        </div>
                        {speedInfo.tooltip && (
                          <div className="absolute z-10 hidden group-hover:block bg-[#1F2A37] text-xs text-gray-300 px-2 py-1 rounded mt-1">
                            {speedInfo.tooltip}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Last Update */}
                    <td className="px-4 py-3">
                      <div className="text-gray-300">
                        {formatTime(trip.latestPosition?.timestamp)}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {trips.length > 0 && (
        <div className="p-4 border-t border-[#1F2A37] flex justify-between items-center text-sm text-gray-400">
          <div>
            Page {page} of {Math.ceil(trips.length / limit) || 1}
          </div>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded transition-colors ${
                page === 1 
                  ? 'bg-[#1F2A37] text-gray-500 cursor-not-allowed' 
                  : 'bg-[#1F2A37] hover:bg-[#2D3748] text-gray-300'
              }`}
              disabled={page === 1} 
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <button
              className={`px-3 py-1 rounded transition-colors ${
                page >= Math.ceil(trips.length / limit) 
                  ? 'bg-[#1F2A37] text-gray-500 cursor-not-allowed' 
                  : 'bg-[#1F2A37] hover:bg-[#2D3748] text-gray-300'
              }`}
              disabled={page >= Math.ceil(trips.length / limit)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}