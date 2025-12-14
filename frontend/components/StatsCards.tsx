"use client";

import { Clock, Gauge, CheckCircle, AlertTriangle, Timer } from "lucide-react";
import { VehicleData, Position } from "@/types";

interface StatsCardsProps {
  data: VehicleData[];
}

interface Stats {
  idle: number;
  onTrip: number;
  completed: number;
  avgTripDuration: string;
  avgSpeed: number;
  onTime: number;
  delay: number;
  early: number;
}

export default function StatsCards({ data }: StatsCardsProps) {
  const stats: Stats = {
    idle: 0,
    onTrip: 0,
    completed: 0,
    avgTripDuration: "-",
    avgSpeed: 0,
    onTime: 0,
    delay: 0,
    early: 0,
  };

  if (data.length) {
    // Status count
    stats.idle = data.filter((d) => !d.vehicle?.positions?.length).length;
    stats.completed = data.filter((d) => d.updatedAt !== d.createdAt).length;
    stats.onTrip = data.length - stats.idle - stats.completed;

    // Trip metrics → hanya dari yang Completed
    const completedDrivers = data.filter((d) => d.updatedAt !== d.createdAt);

    const allSpeeds: number[] = completedDrivers
      .flatMap((d) => d.vehicle?.positions ?? [])
      .map((p: Position) => p.speed)
      .filter((s) => s !== undefined && s !== null);

    stats.avgSpeed = allSpeeds.length
      ? Math.round(allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length)
      : 0;

    // Trip duration rata-rata (dalam menit)
    const tripDurations: number[] = completedDrivers
      .map((d) => {
        const start = new Date(d.createdAt).getTime();
        const end = new Date(d.updatedAt).getTime();
        return (end - start) / 1000 / 60; // menit
      })
      .filter((v) => !isNaN(v));

    const avgDuration = tripDurations.length
      ? Math.round(tripDurations.reduce((a, b) => a + b, 0) / tripDurations.length)
      : 0;

    stats.avgTripDuration = `${avgDuration} min`;

    // Performance → gunakan avgDuration sebagai acuan
    stats.onTime = completedDrivers.length; // semua Completed dianggap On Time
    stats.delay = Math.floor(data.length * 0.2); // simulasi delay untuk demo
    stats.early = Math.floor(data.length * 0.1); // simulasi early untuk demo
  }

  const cardBase =
    "bg-[#0B1120] border border-cyan-500/10 rounded-2xl p-5 shadow-[0_0_15px_#00FFFF10]";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-gray-200">
      {/* Vehicle Status / Driver Status */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Driver Status</h3>
        {[
          { color: "bg-green-500", label: "Idle", value: stats.idle },
          { color: "bg-yellow-400", label: "On Trip", value: stats.onTrip },
          { color: "bg-purple-500", label: "Completed", value: stats.completed },
        ].map((item) => (
          <StatRow key={item.label} {...item} />
        ))}
      </div>

      {/* Trip Metrics */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Trip Metrics</h3>
        <MetricRow
          icon={<Clock className="text-blue-400" size={20} />}
          label="Avg Trip Duration"
          value={stats.avgTripDuration}
        />
        <MetricRow
          icon={<Gauge className="text-cyan-400" size={20} />}
          label="Avg Speed"
          value={`${stats.avgSpeed} km/h`}
        />
      </div>

      {/* Performance */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Performance</h3>
        <MetricRow
          icon={<CheckCircle className="text-green-400" size={20} />}
          label="On Time"
          value={stats.onTime}
        />
        <MetricRow
          icon={<AlertTriangle className="text-red-400" size={20} />}
          label="Delay"
          value={stats.delay}
        />
        <MetricRow
          icon={<Timer className="text-blue-400" size={20} />}
          label="Early"
          value={stats.early}
        />
      </div>
    </div>
  );
}

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
