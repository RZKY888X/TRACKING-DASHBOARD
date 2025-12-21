// app/(dashboard)/drivers/components/PerformanceDonutChart.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "On Time", value: 75, color: "#10b981" },
  { name: "Delayed", value: 25, color: "#ef4444" },
];

export default function PerformanceDonutChart() {
  return (
    <div className="relative bg-gradient-to-br from-[#0f1419] via-[#161B22] to-[#0f1419] border border-cyan-500/20 rounded-xl p-4 sm:p-6 overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 h-full">

      
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-cyan-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative h-full flex flex-col">
        {/* Header dengan layout yang lebih baik */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-lg border border-green-500/30">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Delivery Performance</h2>
              <p className="text-xs text-gray-400 hidden sm:block">On-time vs delayed deliveries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        </div>

        {/* Donut Chart dengan padding yang lebih baik */}
        <div className="h-[220px] sm:h-[260px] mb-4 sm:mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <radialGradient id="gradient-on-time">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
                </radialGradient>
                <radialGradient id="gradient-delayed">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.7} />
                </radialGradient>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={4}
                stroke="#0f1419"
                strokeOpacity={0.8}
                cornerRadius={8}
              >
                {data.map((entry, i) => (
                  <Cell 
                    key={`cell-${i}`} 
                    fill={`url(#gradient-${entry.name.toLowerCase().replace(" ", "-")})`}
                    strokeLinejoin="round"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f1419', 
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(value) => [`${value}%`, 'Percentage']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend and Details dengan layout yang lebih baik */}
        <div className="space-y-4 sm:space-y-6 flex-1">
          {/* Performance Badge dengan efek yang lebih halus */}
          <div className="flex justify-center">
            <div className="px-6 py-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-green-500/30 transition-all duration-300 w-full max-w-xs">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">75%</div>
                <div className="text-sm text-gray-300 font-medium">On-Time Performance</div>
                <div className="text-xs text-gray-400 mt-1">Industry average: 68%</div>
              </div>
            </div>
          </div>

          {/* Legend dalam layout grid yang lebih baik */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {data.map((item, i) => (
              <div key={i} className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg" 
                    style={{ 
                      backgroundColor: item.color, 
                      boxShadow: `0 0 10px ${item.color}80` 
                    }}
                  ></div>
                  <span className="text-sm font-medium text-gray-300">{item.name}</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white mb-1">{item.value}%</p>
                <div className="text-xs text-gray-400">
                  {item.name === "On Time" ? "Excellent" : "Needs improvement"}
                </div>
              </div>
            ))}
          </div>

          {/* Stats tambahan di bagian bawah */}
          <div className="pt-4 border-t border-cyan-500/10 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Total Deliveries</div>
                <div className="text-lg font-semibold text-white">450</div>
                <div className="text-xs text-green-400 mt-1">+12% vs last month</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Avg Delay Time</div>
                <div className="text-lg font-semibold text-amber-400">12 min</div>
                <div className="text-xs text-amber-400 mt-1">-3 min vs last month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle border animation on hover */}
      <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}