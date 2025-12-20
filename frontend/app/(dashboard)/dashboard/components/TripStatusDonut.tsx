// Enhanced Trip Status Donut with vibrant colors
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "On Time", value: 70, color: "#10b981" },
  { name: "Delayed", value: 20, color: "#3b82f6" },
  { name: "At Risk", value: 10, color: "#ef4444" },
];

const COLORS = ["#10b981", "#3b82f6", "#ef4444"];

export default function TripStatusDonut() {
  return (
    <div className="relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 rounded-xl p-6 overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-2xl">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-red-500"></div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Trip Status</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {COLORS.map((color, i) => (
                <radialGradient key={i} id={`gradient-${i}`}>
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </radialGradient>
              ))}
            </defs>
            <Pie
              data={data}
              innerRadius={65}
              outerRadius={90}
              dataKey="value"
              strokeWidth={3}
              stroke="#0D1117"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={`url(#gradient-${i})`} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#161B22', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {data.map((item, i) => (
          <div key={i} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full shadow-lg" 
                style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400">{item.name}</p>
            <p className="text-lg font-bold text-white">{item.value}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
