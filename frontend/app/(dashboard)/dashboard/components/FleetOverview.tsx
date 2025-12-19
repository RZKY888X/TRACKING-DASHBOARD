// frontend/app/(dashboard)/dashboard/components/FleetOverview.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MetricCard from "./MetricCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FleetMetrics {
  totalActiveVehicles: number;
  vehiclesChange: number; // Percentage change
  totalTripsToday: number;
  scheduledTrips: number;
  onTimePerformance: number; // Percentage
  performanceChange: number;
  delayRate: number; // Percentage
  delayChange: number;
}

export default function FleetOverview({ timeRange }: { timeRange: string }) {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<FleetMetrics>({
    totalActiveVehicles: 0,
    vehiclesChange: 0,
    totalTripsToday: 0,
    scheduledTrips: 0,
    onTimePerformance: 0,
    performanceChange: 0,
    delayRate: 0,
    delayChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // API call untuk dashboard metrics
        const res = await fetch(`${API_URL}/api/dashboard/fleet-overview?timeRange=${timeRange}`, {
          headers: session?.accessToken ? {
            Authorization: `Bearer ${session.accessToken}`,
          } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMetrics(data.metrics);
          }
        }
      } catch (error) {
        console.error("Error fetching fleet metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Refresh setiap 30 detik
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange, session?.accessToken]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1a1f2e] border border-cyan-500/20 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-32 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Active Vehicles */}
      <MetricCard
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        title="Total Active Vehicles"
        value={metrics.totalActiveVehicles}
        change={metrics.vehiclesChange}
        changeLabel="vs last period"
        iconBg="bg-blue-500/20"
        iconColor="text-blue-400"
      />

      {/* Total Trips Today */}
      <MetricCard
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
        title="Total Trips Today"
        value={`${metrics.totalTripsToday}`}
        subtitle={`Scheduled: ${metrics.scheduledTrips}`}
        iconBg="bg-cyan-500/20"
        iconColor="text-cyan-400"
      />

      {/* On-Time Performance */}
      <MetricCard
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="On-Time Performance"
        value={`${metrics.onTimePerformance}%`}
        change={metrics.performanceChange}
        changeLabel="Target Met"
        badge={metrics.onTimePerformance >= 90 ? "success" : "warning"}
        iconBg="bg-green-500/20"
        iconColor="text-green-400"
      />

      {/* Delay Rate */}
      <MetricCard
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3l-6.732-11c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        title="Delay Rate"
        value={`${metrics.delayRate}%`}
        change={metrics.delayChange}
        changeLabel="vs last period"
        badge="alert"
        iconBg="bg-red-500/20"
        iconColor="text-red-400"
      />
    </div>
  );
}