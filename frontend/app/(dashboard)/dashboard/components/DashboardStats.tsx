// frontend/app/(dashboard)/dashboard/components/DashboardStats.tsx
"use client";

import React from "react";

type DashboardStatItem = {
  label: string;
  value: number;
  change?: string;
};

const mockDashboardStats: DashboardStatItem[] = [
  {
    label: "Total Devices",
    value: 128,
    change: "+12%",
  },
  {
    label: "Active Devices",
    value: 97,
    change: "+5%",
  },
  {
    label: "Inactive Devices",
    value: 31,
    change: "-3%",
  },
  {
    label: "Total Data Logs",
    value: 18234,
    change: "+18%",
  },
];

export default function DashboardStats() {
  return (
    <section className='w-full space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-white'>Dashboard Overview</h2>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {mockDashboardStats.map((stat) => (
          <div
            key={stat.label}
            className='rounded-xl bg-[#0C1A2A] p-5 shadow-md'
          >
            <p className='text-sm text-gray-400'>{stat.label}</p>

            <div className='mt-2 flex items-end justify-between'>
              <h3 className='text-2xl font-bold text-white'>
                {stat.value.toLocaleString()}
              </h3>

              {stat.change && (
                <span
                  className={`text-sm font-medium ${
                    stat.change.startsWith("+")
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
