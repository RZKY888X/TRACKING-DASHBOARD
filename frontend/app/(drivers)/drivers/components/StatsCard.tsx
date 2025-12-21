// app/(dashboard)/drivers/components/StatsCards.tsx
"use client";

import { Users, UserCheck, Truck, Clock } from "lucide-react";

const stats = [
  {
    label: "TOTAL DRIVERS",
    value: 142,
    change: "+2 this week",
    icon: Users,
    gradient: "from-gray-300 via-gray-100 to-gray-400",
    iconBg: "bg-gray-500/20",
    iconColor: "text-gray-300",
    glowColor: "shadow-gray-500/20",
    changeColor: "text-gray-300",
    borderColor: "border-gray-500/20",
    progress: 100,
    progressColor: "bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300",
  },
  {
    label: "ACTIVE DRIVERS",
    value: 98,
    change: "69% Online",
    icon: UserCheck,
    gradient: "from-green-400 via-green-500 to-green-600",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    glowColor: "shadow-green-500/30",
    changeColor: "text-green-400",
    borderColor: "border-green-500/20",
    progress: 69,
    progressColor: "bg-gradient-to-r from-green-400 via-green-500 to-green-600",
  },
  {
    label: "DRIVERS ON TRIP",
    value: 45,
    change: "In Transit",
    icon: Truck,
    gradient: "from-amber-400 via-yellow-500 to-amber-600",
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    glowColor: "shadow-yellow-500/30",
    changeColor: "text-yellow-400",
    borderColor: "border-yellow-500/20",
    progress: 32,
    progressColor: "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600",
  },
  {
    label: "IDLE DRIVERS",
    value: 12,
    change: "Awaiting Assignment",
    icon: Clock,
    gradient: "from-blue-400 via-blue-500 to-blue-600",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    glowColor: "shadow-blue-500/30",
    changeColor: "text-blue-400",
    borderColor: "border-blue-500/20",
    progress: 8,
    progressColor: "bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
      {stats.map((s, i) => (
        <div
          key={i}
          className="relative bg-gradient-to-br from-[#0f1419] via-[#161B22] to-[#0f1419] border border-white/5 p-4 sm:p-5 rounded-xl overflow-hidden group hover:border-white/10 transition-all duration-300 hover:shadow-xl"
        >
          {/* Animated gradient background */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
          ></div>
          
          <div className="relative">
            {/* Header: Label and Icon */}
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {s.label}
              </p>
              <div 
                className={`relative ${s.iconBg} p-2 sm:p-2.5 rounded-lg ${s.glowColor} shadow-md group-hover:shadow-lg transition-all duration-300`}
              >
                <s.icon 
                  className={`w-5 h-5 ${s.iconColor}`} 
                />
                {/* Subtle pulse effect */}
                <div 
                  className={`absolute inset-0 ${s.iconBg} rounded-lg group-hover:animate-ping opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                ></div>
              </div>
            </div>
            
            {/* Value and Change */}
            <div className="mb-4 sm:mb-5">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">
                {s.value.toLocaleString()}
              </h3>
              {s.change && (
                <div className="flex items-center gap-2">
                  {s.change.includes("+") ? (
                    <svg 
                      className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M12 7a1 1 0 011 1v4a1 1 0 11-2 0V9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4A1 1 0 0112 7z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  ) : s.change.includes("-") ? (
                    <svg 
                      className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M12 13a1 1 0 01-1 1H9a1 1 0 110-2h2a1 1 0 011 1z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  ) : null}
                  <span className={`text-xs sm:text-sm font-medium ${s.changeColor}`}>
                    {s.change}
                  </span>
                </div>
              )}
            </div>
            
            {/* Progress Bar dengan label yang lebih jelas */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-400">Completion</span>
                <span className="text-xs font-semibold text-white">{s.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${s.progressColor} transition-all duration-1000 ease-out group-hover:opacity-100`}
                  style={{ width: `${s.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Subtle border animation on hover */}
          <div 
            className={`absolute inset-0 border ${s.borderColor} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
          ></div>
        </div>
      ))}
    </div>
  );
}