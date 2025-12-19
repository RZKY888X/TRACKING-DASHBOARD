"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Filters } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface StatsCardsProps {
  filters?: Filters;
}

export default function StatsCards({ filters }: StatsCardsProps) {
  const { data: session } = useSession();

  const [stats, setStats] = useState({
    idle: 0,
    onTrip: 0,
    completed: 0,
    avgTripDuration: "-",
    avgSpeed: 0,
    onTime: 0,
    delay: 0,
    early: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (filters) {
          if (filters.dateType) params.append("dateType", filters.dateType);
          if (filters.dateValue) params.append("dateValue", filters.dateValue);
          if (filters.driver) params.append("driver", filters.driver);
          if (filters.route) params.append("route", filters.route);
          if (filters.departureRoute)
            params.append("departureRoute", filters.departureRoute);
        }

        const res = await fetch(
          `${API_URL}/api/dashboard/stats?${params}`,
          {
            headers: session?.accessToken
              ? { Authorization: `Bearer ${session.accessToken}` }
              : {},
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        if (data.success) {
          setStats({
            idle: data.stats.idle ?? 0,
            onTrip: data.stats.onTrip ?? 0,
            completed: data.stats.completed ?? 0,
            avgTripDuration: data.stats.avgTripDuration ?? "-",
            avgSpeed: data.stats.avgSpeed ?? 0,
            onTime: data.stats.onTime ?? 0,
            delay: data.stats.delay ?? 0,
            early: data.stats.early ?? 0,
          });
        }
      } catch (err) {
        console.error("Stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const i = setInterval(fetchStats, 30000);
    return () => clearInterval(i);
  }, [filters, session?.accessToken]);

  const card =
    "bg-[#0f1729] border border-cyan-500/15 rounded-xl p-6 shadow-[0_0_20px_#00ffff10]";

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${card} animate-pulse`}>
            <div className="h-4 w-32 bg-slate-700 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-12 bg-slate-800 rounded" />
              <div className="h-12 bg-slate-800 rounded" />
              <div className="h-12 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Driver Status */}
      <div className={card}>
        <h3 className="text-cyan-400 font-semibold mb-4">
          Driver Status
        </h3>
        <Stat label="Idle" value={stats.idle} color="bg-green-400" />
        <Stat label="On Trip" value={stats.onTrip} color="bg-yellow-400" />
        <Stat
          label="Completed"
          value={stats.completed}
          color="bg-purple-400"
        />
      </div>

      {/* Trip Metrics */}
      <div className={card}>
        <h3 className="text-cyan-400 font-semibold mb-4">
          Trip Metrics
        </h3>
        <Metric label="Avg Trip Duration" value={stats.avgTripDuration} />
        <Metric label="Avg Speed" value={`${stats.avgSpeed} km/h`} />
      </div>

      {/* Performance */}
      <div className={card}>
        <h3 className="text-cyan-400 font-semibold mb-4">
          Performance
        </h3>
        <Metric label="On Time" value={stats.onTime} />
        <Metric label="Delay" value={stats.delay} />
        <Metric label="Early" value={stats.early} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between bg-[#0b1324] rounded-lg px-4 py-3 mb-3">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-gray-300">{label}</span>
      </div>
      <span className="text-white text-xl font-bold">{value}</span>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between bg-[#0b1324] rounded-lg px-4 py-3 mb-3">
      <span className="text-gray-300">{label}</span>
      <span className="text-white text-xl font-bold">{value}</span>
    </div>
  );
}
