"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Truck, Route, CheckCircle, AlertTriangle } from "lucide-react";

interface DashboardStats {
  activeVehicles: number;
  activeVehiclesChange: string;
  tripsToday: number;
  scheduledTrips: number;
  onTimePerformance: number;
  delayRate: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StatsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!API_URL) {
          throw new Error("NEXT_PUBLIC_API_URL is not defined");
        }

        const res = await fetch(`${API_URL}/api/dashboard/stats`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Fetch failed: ${res.status}`);
        }

        const data: DashboardStats = await res.json();
        setStats(data);
      } catch (error) {
        console.error("StatsOverview fetch error:", error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      label: "Total Active Vehicles",
      value: stats?.activeVehicles ?? "-",
      change: stats?.activeVehiclesChange,
      icon: Truck,
      gradient: "from-cyan-500 via-blue-500 to-purple-600",
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
      glowColor: "shadow-cyan-500/50",
    },
    {
      label: "Total Trips Today",
      value: stats?.tripsToday ?? "-",
      sub: stats ? `Scheduled: ${stats.scheduledTrips}` : undefined,
      icon: Route,
      gradient: "from-blue-500 via-indigo-500 to-purple-600",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      glowColor: "shadow-blue-500/50",
    },
    {
      label: "On-Time Performance",
      value: stats ? `${stats.onTimePerformance}%` : "-",
      change: "Target Met",
      icon: CheckCircle,
      gradient: "from-green-500 via-emerald-500 to-teal-600",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      glowColor: "shadow-green-500/50",
    },
    {
      label: "Delay Rate",
      value: stats ? `${stats.delayRate}%` : "-",
      change: stats ? `${stats.delayRate > 5 ? "+" : ""}${stats.delayRate}%` : undefined,
      icon: AlertTriangle,
      gradient: "from-red-500 via-orange-500 to-yellow-600",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      glowColor: "shadow-red-500/50",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="h-32 bg-[#0D1117] border border-white/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((s, i) => (
        <Card
          key={i}
          className="relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 p-6 overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
          />
          <div
            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient}`}
          />

          <div className="relative flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-2">
                {s.label}
              </p>
              <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">
                {s.value}
              </h3>

              {s.change && (
                <span className="text-sm font-semibold text-green-400">
                  {s.change}
                </span>
              )}

              {s.sub && (
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  {s.sub}
                </p>
              )}
            </div>

            <div
              className={`relative ${s.iconBg} p-3 rounded-xl ${s.glowColor} shadow-lg`}
            >
              <s.icon className={`w-7 h-7 ${s.iconColor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
