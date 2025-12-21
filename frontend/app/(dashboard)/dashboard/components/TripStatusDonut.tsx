"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import("recharts").then(m => m.ResponsiveContainer),
  { ssr: false }
);
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });

const COLORS = ["#10b981", "#3b82f6", "#ef4444"];

type TripStatusData = {
  name: string;
  value: number;
  color: string;
};

export default function TripStatusDonut() {
  const [data, setData] = useState<TripStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!API_URL) {
      console.error("NEXT_PUBLIC_API_URL is not defined");
      setLoading(false);
      return;
    }

    const fetchTripStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard/trip-status`, {
          cache: "no-store"
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        setData(json.data ?? []);
      } catch (err) {
        console.error("TripStatus error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTripStatus();
  }, [API_URL]);

  return (
    <div className="relative bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-white/10 rounded-xl p-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-red-500" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Trip Status</h3>
        <span className="text-xs text-gray-400">Live</span>
      </div>

      <div className="h-[260px] flex items-center justify-center">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-500">No data</p>
        ) : (
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
                dataKey="value"
                innerRadius={65}
                outerRadius={90}
                stroke="#0D1117"
                strokeWidth={3}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={`url(#gradient-${i})`} />
                ))}
              </Pie>

              <Tooltip
                formatter={(v: number) => [`${v}%`, ""]}
                contentStyle={{
                  backgroundColor: "#161B22",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {data.map((item, i) => (
          <div key={i} className="text-center">
            <div
              className="w-3 h-3 mx-auto rounded-full shadow-lg"
              style={{
                backgroundColor: item.color,
                boxShadow: `0 0 10px ${item.color}`
              }}
            />
            <p className="text-xs text-gray-400 mt-1">{item.name}</p>
            <p className="text-lg font-bold text-white">{item.value}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
