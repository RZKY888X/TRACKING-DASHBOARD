// app/(dashboard)/drivers/components/TopDriversBarChart.tsx
"use client";

import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

const weeklyData = [
  { name: "Emma Wilson", trips: 312, color: "#06b6d4" },
  { name: "Michael Chen", trips: 234, color: "#0ea5e9" },
  { name: "Sarah Connor", trips: 210, color: "#22d3ee" },
  { name: "John Doe", trips: 145, color: "#38bdf8" },
  { name: "David Kim", trips: 56, color: "#7dd3fc" },
];

const monthlyData = [
  { name: "Emma Wilson", trips: 1280, color: "#06b6d4" },
  { name: "Michael Chen", trips: 980, color: "#0ea5e9" },
  { name: "Sarah Connor", trips: 856, color: "#22d3ee" },
  { name: "John Doe", trips: 620, color: "#38bdf8" },
  { name: "David Kim", trips: 240, color: "#7dd3fc" },
];

export default function TopDriversBarChart() {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly">("weekly");
  const data = timeRange === "weekly" ? weeklyData : monthlyData;
  const maxValue = Math.max(...data.map(item => item.trips));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = Math.round((value / maxValue) * 100);
      return (
        <div className="bg-[#0f1419] border border-white/10 rounded-lg p-3 sm:p-4 shadow-2xl backdrop-blur-sm min-w-[160px] sm:min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></div>
            <p className="text-white font-semibold text-sm">{label}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xl sm:text-2xl font-bold text-white">{value.toLocaleString()}</p>
            <p className="text-sm text-cyan-300">Total trips</p>
            <div className="pt-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Performance</span>
                <span className="text-white font-medium">{percentage}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative bg-gradient-to-br from-[#0f1419] via-[#161B22] to-[#0f1419] border border-white/5 rounded-xl p-4 sm:p-6 overflow-hidden group hover:border-white/10 transition-all duration-300 h-full">

      
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-blue-500/3 to-cyan-600/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative h-full flex flex-col">
        {/* Header - Responsif */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
              <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Top Drivers by Trip Count</h2>
              <p className="text-xs text-gray-400 hidden sm:block">Most productive drivers this period</p>
            </div>
          </div>
          
          {/* Toggle Buttons - Responsif */}
          <div className="flex bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-white/5 self-start sm:self-auto">
            <button
              onClick={() => setTimeRange("weekly")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-300 ${
                timeRange === "weekly" 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md" 
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange("monthly")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-300 ${
                timeRange === "monthly" 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md" 
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Horizontal Bar Chart dengan spacing yang lebih baik */}
        <div className="flex-1 min-h-[220px] sm:min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 15, left: 80, bottom: 10 }}
              barSize={20}
              barGap={4}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                horizontal={true}
                vertical={false}
                stroke="#374151" 
                strokeOpacity={0.3}
              />
              
              <XAxis 
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                domain={[0, maxValue * 1.1]}
                tickMargin={8}
              />
              
              <YAxis 
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#D1D5DB', fontSize: 11, fontWeight: 500 }}
                width={75}
                tickMargin={10}
              />
              
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              />
              
              <Bar 
                dataKey="trips"
                radius={[0, 6, 6, 0]}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer dengan informasi yang lebih jelas - Responsif */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm gap-2 sm:gap-0">
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs sm:text-sm">Top 5 performers ranked by trip count</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-cyan-300 font-medium text-xs sm:text-sm">
                {timeRange === "weekly" ? "Current week" : "Current month"}
              </div>
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle border animation on hover */}
      <div className="absolute inset-0 border border-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}