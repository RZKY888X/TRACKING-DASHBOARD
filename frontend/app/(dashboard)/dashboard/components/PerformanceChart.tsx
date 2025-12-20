// Enhanced Performance Chart
"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const data = [
  { name: "Mon", onTime: 40, delay: 10 },
  { name: "Tue", onTime: 55, delay: 12 },
  { name: "Wed", onTime: 50, delay: 15 },
  { name: "Thu", onTime: 65, delay: 8 },
  { name: "Fri", onTime: 70, delay: 5 },
];

export default function PerformanceChart() {
  return (
    <div className="relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 rounded-xl p-6 overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-2xl">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Performance Trends</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
            <span className="text-gray-400">On Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
            <span className="text-gray-400">Delayed</span>
          </div>
        </div>
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2A37" />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280" 
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis 
              stroke="#6B7280" 
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#161B22', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Line
              type="monotone"
              dataKey="onTime"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#22c55e', stroke: '#0D1117', strokeWidth: 2 }}
              fill="url(#colorOnTime)"
            />
            <Line
              type="monotone"
              dataKey="delay"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#ef4444', stroke: '#0D1117', strokeWidth: 2 }}
              fill="url(#colorDelay)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats below chart */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Avg On-Time</p>
          <p className="text-2xl font-bold text-green-400">56</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Avg Delay</p>
          <p className="text-2xl font-bold text-red-400">10</p>
        </div>
      </div>
    </div>
  );
}
