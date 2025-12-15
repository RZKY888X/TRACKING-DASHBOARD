"use client";

import { useEffect, useState } from "react";
import { Filters } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface StatsCardsProps {
  filters?: Filters;
}

export default function StatsCards({ filters }: Props) {
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
        
        // Build query params from filters
        const params = new URLSearchParams();
        
        if (filters) {
          if (filters.dateType) params.append('dateType', filters.dateType);
          if (filters.dateValue) params.append('dateValue', filters.dateValue);
          if (filters.driver && filters.driver !== "Select Driver" && filters.driver !== "No drivers available") {
            params.append('driver', filters.driver);
          }
          if (filters.route && filters.route !== "Select Origin" && filters.route !== "No origins available") {
            params.append('route', filters.route);
          }
          if (filters.departureRoute && filters.departureRoute !== "Select Departure" && filters.departureRoute !== "No departures available") {
            params.append('departureRoute', filters.departureRoute);
          }
        }

        const res = await fetch(`${API_URL}/api/dashboard/stats?${params}`);
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            console.log("📊 Stats received:", data.stats);
            setStats({
              idle: data.stats.idle || 0,
              onTrip: data.stats.onTrip || 0,
              completed: data.stats.completed || 0,
              avgTripDuration: data.stats.avgTripDuration || "-",
              avgSpeed: data.stats.avgSpeed || 0,
              onTime: data.stats.onTime || 0,
              delay: data.stats.delay || 0,
              early: data.stats.early || 0,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Fallback data
        setStats({
          idle: 0,
          onTrip: 0,
          completed: 0,
          avgTripDuration: "-",
          avgSpeed: 0,
          onTime: 0,
          delay: 0,
          early: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const cardBase = "bg-[#0B1120] border border-cyan-500/10 rounded-2xl p-5 shadow-[0_0_15px_#00FFFF10]";

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-gray-200">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={cardBase}>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-gray-200">
      {/* Driver Status */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Driver Status</h3>
        <StatRow color="bg-green-500" label="Idle" value={stats.idle} />
        <StatRow color="bg-yellow-400" label="On Trip" value={stats.onTrip} />
        <StatRow color="bg-purple-500" label="Completed" value={stats.completed} />
      </div>

      {/* Trip Metrics */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Trip Metrics</h3>
        <MetricRow
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Avg Trip Duration"
          value={stats.avgTripDuration}
        />
        <MetricRow
          icon={
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          label="Avg Speed"
          value={`${stats.avgSpeed} km/h`}
        />
      </div>

      {/* Performance */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Performance</h3>
        <MetricRow
          icon={
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="On Time"
          value={stats.onTime}
        />
        <MetricRow
          icon={
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
          label="Delay"
          value={stats.delay}
        />
        <MetricRow
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Early"
          value={stats.early}
        />
      </div>
    </div>
  );
}

/* ================== UI HELPERS ================== */

function StatRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between bg-[#0F172A]/80 rounded-xl px-4 py-3 mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 ${color} rounded-full`} />
        <span>{label}</span>
      </div>
      <span className="text-xl font-bold">{value}</span>
    </div>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: JSX.Element;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between bg-[#0F172A]/80 rounded-xl px-4 py-3 mb-3">
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-xl font-bold">{value}</span>
    </div>
  );
}