// Enhanced Live Fleet Map Card - FIXED Z-INDEX
"use client";

import VehicleMap from "@/components/map/VehicleMap";

export default function LiveFleetMapCard({ positions }: any) {
  return (
    <div className="relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 rounded-xl p-6 overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-2xl z-0">
      {/* Animated top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-pulse"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="w-3 h-3 bg-red-500 rounded-full block shadow-lg shadow-red-500/50" />
            <span className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
          </div>
          <h3 className="text-white font-semibold text-lg">
            Live Fleet Overview
          </h3>
        </div>
        
        <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-red-400">LIVE</span>
        </div>
      </div>

      <div className="h-[420px] rounded-xl overflow-hidden border border-white/10 shadow-2xl relative z-0">
        <VehicleMap positions={positions} />
      </div>

      {/* Bottom info bar */}
      <div className="mt-4 flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
            <span className="text-gray-400">Active: <span className="text-white font-semibold">45</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"></div>
            <span className="text-gray-400">Idle: <span className="text-white font-semibold">12</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
            <span className="text-gray-400">Alert: <span className="text-white font-semibold">3</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
