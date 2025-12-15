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
        
        // Build query params dari filters
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
          setTrips(data.trips || []);
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
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">ON TRIP</span>;
      case "COMPLETED":
        return <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">COMPLETED</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">{status}</span>;
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
        <h2 className="text-lg text-gray-100 font-semibold">Trip Table</h2>
        <div className="text-sm text-gray-400">
          Showing {paginated.length} of {trips.length} trips
          {filters?.dateType && (
            <span className="ml-2 text-cyan-400">
              • Filter: {filters.dateType} {filters.dateValue ? `(${filters.dateValue})` : ''}
            </span>
          )}
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
              paginated.map((trip) => {
                const latestPosition = trip.vehicle?.positions?.[0];
                const speed = latestPosition?.speed || trip.avgSpeed || 0;

                return (
                  <tr key={trip.id} className="hover:bg-[#161B22]">
                    {/* Vehicle */}
                    <td className="px-4 py-3 text-gray-300">
                      <div className="font-medium">{trip.vehicle?.plate || "Unknown"}</div>
                      <div className="text-xs text-gray-400">{trip.vehicle?.type || "No Type"}</div>
                    </td>

                    {/* Driver */}
                    <td className="px-4 py-3 text-gray-300">
                      {trip.driver?.name || "Unknown Driver"}
                    </td>

                    {/* Route */}
                    <td className="px-4 py-3 text-gray-300">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="font-medium">{trip.origin?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-400">{trip.origin?.city || ""}</div>
                        </div>
                        <span className="mx-2">→</span>
                        <div className="flex-1">
                          <div className="font-medium">{trip.destination?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-400">{trip.destination?.city || ""}</div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {getStatusBadge(trip.status)}
                    </td>

                    {/* Start */}
                    <td className="px-4 py-3 text-gray-300">
                      {formatTime(trip.startTime)}
                    </td>

                    {/* End */}
                    <td className="px-4 py-3 text-gray-300">
                      {formatTime(trip.endTime)}
                    </td>

                    {/* Speed */}
                    <td className="px-4 py-3">
                      <div className="text-cyan-400 font-medium">
                        {speed ? `${speed} km/h` : "—"}
                      </div>
                    </td>

                    {/* Last Update */}
                    <td className="px-4 py-3 text-gray-300">
                      {formatTime(latestPosition?.timestamp)}
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