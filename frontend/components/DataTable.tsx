"use client";

import { useState, useEffect } from "react";

interface PositionData {
  id: number;
  tripId: number;
  vehicleId: number;
  latitude: number;
  longitude: number;
  speed?: number;
  timestamp: string;
}

interface Vehicle {
  id: number;
  plate: string;
  type?: string;
  positions: PositionData[];
}

interface Driver {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
  city: string;
}

interface TripData {
  id: number;
  driver: Driver;
  vehicle: Vehicle;
  origin: Warehouse;
  destination?: Warehouse;
  status: "ON_TRIP" | "COMPLETED";
  startTime: string;
  endTime?: string;
  avgSpeed?: number;
  positions: PositionData[];
}

interface Props {
  data: TripData[];
}

export default function DataTable({ data }: Props) {
  const [page, setPage] = useState(1);
  const limit = 5;

  useEffect(() => setPage(1), [data]);

  const paginated = data.slice((page - 1) * limit, page * limit);

  const formatTime = (val?: string) =>
    val ? new Date(val).toLocaleString("id-ID", { timeZone: "UTC" }) : "—";

  return (
    <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg">
      <div className="p-4 border-b border-[#1F2A37]">
        <h2 className="text-lg text-gray-100 font-semibold">Trip Table</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-[#1F2A37] text-gray-200">
            <tr>
              {["Vehicle", "Driver", "Route", "Start", "End", "Speed", "Last Update"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-sm">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1F2A37]">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-400">
                  No data
                </td>
              </tr>
            ) : (
              paginated.map((trip) => {
                const latestPosition = trip.vehicle.positions[0] || trip.positions[0];

                return (
                  <tr key={trip.id} className="hover:bg-[#161B22]">
                    {/* Vehicle */}
                    <td className="px-4 py-3 text-gray-300">{trip.vehicle.plate}</td>

                    {/* Driver */}
                    <td className="px-4 py-3 text-gray-300">{trip.driver.name}</td>

                    {/* Route */}
                    <td className="px-4 py-3 text-gray-300">
                      {trip.origin.name} → {trip.destination?.name ?? "—"}
                    </td>

                    {/* Start */}
                    <td className="px-4 py-3 text-gray-300">{formatTime(trip.startTime)}</td>

                    {/* End */}
                    <td className="px-4 py-3 text-gray-300">{formatTime(trip.endTime)}</td>

                    {/* Speed */}
                    <td className="px-4 py-3 text-cyan-400">
                      {latestPosition?.speed ?? "—"} km/h
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

      <div className="p-4 flex justify-between text-sm text-gray-400">
        <span>
          Page {page} of {Math.ceil(data.length / limit) || 1}
        </span>
        <div className="space-x-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <button
            disabled={page * limit >= data.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
