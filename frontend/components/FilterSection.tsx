"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Filters } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FilterSection({
  filters,
  onFilterChange,
}: {
  filters: Filters;
  onFilterChange: (f: Filters) => void;
}) {
  const { data: session } = useSession();

  const [drivers, setDrivers] = useState<string[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [departures, setDepartures] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const params = new URLSearchParams();
    if (filters.dateValue && filters.dateValue !== "Current") {
      params.append("date", filters.dateValue);
    }

    fetch(`${API_URL}/api/filters/drivers?${params}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then(setDrivers);
  }, [filters.dateValue, session]);

  useEffect(() => {
    fetch(`${API_URL}/api/origins/public`)
      .then((r) => r.json())
      .then((d) => setOrigins(d.map((i: any) => i.destination)));

    fetch(`${API_URL}/api/departures/public`)
      .then((r) => r.json())
      .then((d) => setDepartures(d.map((i: any) => i.destination)));
  }, []);

  const handle = (k: keyof Filters, v: any) =>
    onFilterChange({ ...filters, [k]: v });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <input
        type="date"
        className="bg-[#161B22] p-3 rounded text-gray-200"
        onChange={(e) => handle("dateValue", e.target.value)}
      />

      <select
        className="bg-[#161B22] p-3 rounded text-gray-200"
        value={filters.driver}
        onChange={(e) => handle("driver", e.target.value)}
      >
        <option value="">Driver</option>
        {drivers.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <select
        className="bg-[#161B22] p-3 rounded text-gray-200"
        value={filters.route}
        onChange={(e) => handle("route", e.target.value)}
      >
        <option value="">Origin</option>
        {origins.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>

      <select
        className="bg-[#161B22] p-3 rounded text-gray-200"
        value={filters.departure}
        onChange={(e) => handle("departure", e.target.value)}
      >
        <option value="">Departure</option>
        {departures.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}
