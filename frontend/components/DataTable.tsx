// Enhanced DataTable with Excel Export Feature
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Trip, Filters } from "@/types";
import * as XLSX from 'xlsx';

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
  const [exporting, setExporting] = useState(false);
  const limit = 5;

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
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

        const res = await fetch(`${API_URL}/api/trips/filter?${params}`, {
          headers: session?.accessToken ? {
            Authorization: `Bearer ${session.accessToken}`,
          } : {},
        });

        if (!res.ok) throw new Error(`Failed to fetch trips: ${res.status}`);

        const data = await res.json();
        
        if (data.success) {
          const sortedTrips = (data.trips || []).sort((a: any, b: any) => {
            if (a.status === "ON_TRIP" && b.status !== "ON_TRIP") return -1;
            if (a.status !== "ON_TRIP" && b.status === "ON_TRIP") return 1;
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
          });
          
          setTrips(sortedTrips);
          setTotal(data.count || 0);
        } else {
          setTrips([]);
          setTotal(0);
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
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
      return "—";
    }
  };

  const formatTimeForExcel = (val?: string) => {
    if (!val) return "";
    try {
      return new Date(val).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ON_TRIP":
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"></div>
              <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
            <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 rounded-lg text-xs font-semibold border border-yellow-500/30">
              ON TRIP
            </span>
          </div>
        );
      case "COMPLETED":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
            <span className="px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 rounded-lg text-xs font-semibold border border-green-500/30">
              COMPLETED
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="px-3 py-1.5 bg-gray-500/20 text-gray-300 rounded-lg text-xs font-medium border border-gray-500/30">
              {status}
            </span>
          </div>
        );
    }
  };

  const getSpeedDisplay = (trip: any) => {
    if (trip.avgSpeed !== null && trip.avgSpeed !== undefined) {
      return {
        value: trip.avgSpeed,
        source: "database",
        tooltip: "Average speed from database",
        color: "text-green-400"
      };
    } else if (trip.latestPosition?.speed) {
      return {
        value: trip.latestPosition.speed,
        source: "gps",
        tooltip: "Latest GPS speed",
        color: "text-yellow-400"
      };
    } else {
      return {
        value: 0,
        source: "none",
        tooltip: "No speed data available",
        color: "text-gray-500"
      };
    }
  };

  // Export to Excel Function
  const handleExportToExcel = () => {
    try {
      setExporting(true);

      // Prepare data for export
      const exportData = trips.map((trip: any) => {
        const speedInfo = getSpeedDisplay(trip);
        return {
          'Vehicle Plate': trip.vehicle?.plate || "Unknown",
          'Vehicle Type': trip.vehicle?.type || "No Type",
          'Driver Name': trip.driver?.name || "Unknown Driver",
          'Origin': trip.origin?.name || "Unknown",
          'Origin City': trip.origin?.city || "",
          'Destination': trip.destination?.name || "Unknown",
          'Destination City': trip.destination?.city || "",
          'Status': trip.status,
          'Start Time': formatTimeForExcel(trip.startTime),
          'End Time': formatTimeForExcel(trip.endTime),
          'Speed (km/h)': speedInfo.value > 0 ? speedInfo.value : 0,
          'Speed Source': speedInfo.source,
          'Last Update': formatTimeForExcel(trip.latestPosition?.timestamp),
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Vehicle Plate
        { wch: 15 }, // Vehicle Type
        { wch: 20 }, // Driver Name
        { wch: 20 }, // Origin
        { wch: 15 }, // Origin City
        { wch: 20 }, // Destination
        { wch: 15 }, // Destination City
        { wch: 12 }, // Status
        { wch: 20 }, // Start Time
        { wch: 20 }, // End Time
        { wch: 12 }, // Speed
        { wch: 12 }, // Speed Source
        { wch: 20 }, // Last Update
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Trips Report");

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Trips_Report_${dateStr}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      console.log(`✅ Exported ${trips.length} trips to ${filename}`);
    } catch (error) {
      console.error("❌ Error exporting to Excel:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 rounded-xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
        
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl text-white font-bold">Trip Table</h2>
        </div>
        <div className="p-12 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"></div>
          </div>
          <p className="text-gray-400 font-medium">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-2xl">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
      
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl text-white font-bold mb-2">Trip Table</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400">
                Showing <span className="text-cyan-400 font-semibold">{paginated.length}</span> of{" "}
                <span className="text-cyan-400 font-semibold">{trips.length}</span> trips
              </span>
              {filters?.dateType && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                  <span className="text-cyan-400 font-medium">
                    Filter: {filters.dateType} {filters.dateValue ? `(${filters.dateValue})` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-xs font-semibold text-green-400">LIVE DATA</span>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportToExcel}
              disabled={exporting || trips.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                exporting || trips.length === 0
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20'
              }`}
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export to Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gradient-to-r from-[#1F2A37] to-[#161B22] border-b border-white/10">
            <tr>
              {["Vehicle", "Driver", "Route", "Status", "Start Time", "End Time", "Speed", "Last Update"].map((h) => (
                <th key={h} className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {trips.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 font-semibold mb-1">No trips found</p>
                    <p className="text-sm text-gray-500">
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
                  <tr 
                    key={trip.id} 
                    className={`group hover:bg-white/5 transition-all duration-200 ${
                      isActive ? 'bg-yellow-500/5 border-l-2 border-yellow-500' : ''
                    }`}
                  >
                    {/* Vehicle */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-white">{trip.vehicle?.plate || "Unknown"}</div>
                          <div className="text-xs text-gray-400">{trip.vehicle?.type || "No Type"}</div>
                        </div>
                      </div>
                    </td>

                    {/* Driver */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-gray-300 font-medium">{trip.driver?.name || "Unknown Driver"}</span>
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/30">
                            <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-medium text-cyan-400">{trip.origin?.name || "Unknown"}</span>
                          </div>
                          
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          
                          <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/30">
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-medium text-green-400">{trip.destination?.name || "Unknown"}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 pl-2">
                          {trip.origin?.city || ""} → {trip.destination?.city || ""}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(trip.status)}
                    </td>

                    {/* Start */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300 text-sm">{formatTime(trip.startTime)}</span>
                      </div>
                    </td>

                    {/* End */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300 text-sm">{formatTime(trip.endTime)}</span>
                      </div>
                    </td>

                    {/* Speed */}
                    <td className="px-6 py-4">
                      <div className="relative group/speed">
                        <div className={`flex items-center gap-2 ${speedInfo.color}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="font-semibold">
                            {speedInfo.value > 0 ? `${speedInfo.value} km/h` : "—"}
                          </span>
                        </div>
                        {speedInfo.tooltip && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/speed:block z-10">
                            <div className="bg-[#1F2A37] text-xs text-gray-300 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border border-white/10">
                              {speedInfo.tooltip}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1F2A37]"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Last Update */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                        <span className="text-gray-400 text-sm">
                          {formatTime(trip.latestPosition?.timestamp)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {trips.length > 0 && (
        <div className="p-6 border-t border-white/10 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Page <span className="text-white font-semibold">{page}</span> of{" "}
            <span className="text-white font-semibold">{Math.ceil(trips.length / limit) || 1}</span>
          </div>
          <div className="flex gap-2">
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                page === 1 
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 hover:border-cyan-500/50'
              }`}
              disabled={page === 1} 
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                page >= Math.ceil(trips.length / limit) 
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 hover:border-cyan-500/50'
              }`}
              disabled={page >= Math.ceil(trips.length / limit)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}