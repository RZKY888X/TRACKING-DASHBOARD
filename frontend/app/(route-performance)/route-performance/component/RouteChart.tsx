// app/(route-performance)/route-performance/component/RouteChart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  {
    route: "RT-1001",
    planned: 4.5,
    actual: 4.9,
  },
  {
    route: "RT-1042",
    planned: 2.8,
    actual: 3.2,
  },
  {
    route: "RT-2099",
    planned: 6.0,
    actual: 7.2,
    severe: 7.2,
  },
  {
    route: "RT-3015",
    planned: 2.1,
    actual: 2.0,
  },
  {
    route: "RT-4100",
    planned: 8.0,
    actual: 8.4,
  },
  {
    route: "RT-5020",
    planned: 3.8,
    actual: 4.1,
  },
];

export default function RouteChart() {
  return (
    <div className="rounded-xl border border-[#1F2A37] bg-gradient-to-b from-[#0F172A] to-[#0B1220] p-5">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-200">
          Route Duration: Planned vs Actual
        </h3>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-[#4B5563]" />
            Planned
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-[#3B82F6]" />
            Actual
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-[#EF4444]" />
            Severe Delay
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barCategoryGap={22}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1F2937"
            />

            <XAxis
              dataKey="route"
              stroke="#9CA3AF"
              fontSize={11}
            />

            <YAxis
              stroke="#9CA3AF"
              fontSize={11}
              tickFormatter={(v) => `${v}h`}
              domain={[0, 10]}
            />

            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid #1F2937",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#E5E7EB" }}
            />

            <Bar
              dataKey="planned"
              fill="#4B5563"
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="actual"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="severe"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
