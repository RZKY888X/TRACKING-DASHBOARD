// Enhanced StatsOverview with eye-catching colors
"use client";

import { Card } from "@/components/ui/card";
import { Truck, Route, CheckCircle, AlertTriangle } from "lucide-react";

const stats = [
  {
    label: "Total Active Vehicles",
    value: 124,
    change: "+2.5%",
    icon: Truck,
    gradient: "from-cyan-500 via-blue-500 to-purple-600",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    glowColor: "shadow-cyan-500/50",
  },
  {
    label: "Total Trips Today",
    value: 45,
    sub: "Scheduled: 48",
    icon: Route,
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    glowColor: "shadow-blue-500/50",
  },
  {
    label: "On-Time Performance",
    value: "92.4%",
    change: "Target Met",
    icon: CheckCircle,
    gradient: "from-green-500 via-emerald-500 to-teal-600",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    glowColor: "shadow-green-500/50",
  },
  {
    label: "Delay Rate",
    value: "5.8%",
    change: "+1.2%",
    icon: AlertTriangle,
    gradient: "from-red-500 via-orange-500 to-yellow-600",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    glowColor: "shadow-red-500/50",
  },
];

export default function StatsOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((s, i) => (
        <Card
          key={i}
          className="relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 p-6 overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
        >
          {/* Animated gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
          
          {/* Top accent line */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient}`}></div>
          
          <div className="relative flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-2">{s.label}</p>
              <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">
                {s.value}
              </h3>
              {s.change && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 011 1v4a1 1 0 11-2 0V9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4A1 1 0 0112 7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-green-400">
                    {s.change}
                  </span>
                </div>
              )}
              {s.sub && (
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  {s.sub}
                </p>
              )}
            </div>
            
            {/* Icon with glow effect */}
            <div className={`relative ${s.iconBg} p-3 rounded-xl ${s.glowColor} shadow-lg group-hover:shadow-2xl transition-all duration-300`}>
              <s.icon className={`w-7 h-7 ${s.iconColor} group-hover:scale-110 transition-transform duration-300`} />
              {/* Pulse effect */}
              <div className={`absolute inset-0 ${s.iconBg} rounded-xl animate-ping opacity-20`}></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
