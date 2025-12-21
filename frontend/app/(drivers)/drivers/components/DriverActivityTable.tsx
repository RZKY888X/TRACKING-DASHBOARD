"use client";

import React, { useState } from 'react';
import { MoreVertical, Eye, FileText, TrendingUp, UserCheck, Truck, Clock } from 'lucide-react';

const driversData = [
  {
    id: 1,
    name: "Emma Wilson",
    status: "Active",
    statusColor: "bg-green-500",
    statusText: "text-green-400",
    rfid: "163-M4-05-P6",
    totalTrips: 312,
    avgDuration: "45 min",
    performance: "EXCELLENT",
    performanceColor: "bg-green-500/20",
    performanceText: "text-green-400",
    performanceGradient: "from-green-500 via-green-400 to-emerald-500",
  },
  {
    id: 2,
    name: "Michael Chen",
    status: "On Trip",
    statusColor: "bg-amber-500",
    statusText: "text-amber-400",
    rfid: "19-30-K1-L2",
    totalTrips: 234,
    avgDuration: "52 min",
    performance: "GOOD",
    performanceColor: "bg-blue-500/20",
    performanceText: "text-blue-400",
    performanceGradient: "from-blue-500 via-cyan-400 to-blue-500",
  },
  {
    id: 3,
    name: "Sarah Johnson",
    status: "Idle",
    statusColor: "bg-blue-500",
    statusText: "text-blue-400",
    rfid: "45-B9-22-R3",
    totalTrips: 189,
    avgDuration: "38 min",
    performance: "EXCELLENT",
    performanceColor: "bg-green-500/20",
    performanceText: "text-green-400",
    performanceGradient: "from-green-500 via-green-400 to-emerald-500",
  },
  {
    id: 4,
    name: "David Miller",
    status: "Break",
    statusColor: "bg-purple-500",
    statusText: "text-purple-400",
    rfid: "88-N7-11-T9",
    totalTrips: 267,
    avgDuration: "49 min",
    performance: "AVERAGE",
    performanceColor: "bg-yellow-500/20",
    performanceText: "text-yellow-400",
    performanceGradient: "from-yellow-500 via-amber-400 to-yellow-500",
  },
];

export default function DriverActivityTable() {
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  return (
    <div className="bg-gradient-to-br from-[#0f1419] via-[#161B22] to-[#0f1419] border border-white/5 rounded-xl p-5 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Detailed Driver Activity</h2>
          <p className="text-sm text-gray-400">Real-time tracking and performance metrics</p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-400">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-gray-400">On Trip</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-white/5 bg-white/2.5">
              <th className="py-3 px-4 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">DRIVER NAME</span>
                  <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                </div>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">RFID CARD ID</span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">TOTAL TRIPS</span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AVG DURATION</span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PERFORMANCE</span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ACTIONS</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/5">
            {driversData.map((driver) => (
              <tr 
                key={driver.id} 
                className="group hover:bg-white/5 transition-all duration-200"
                onMouseEnter={() => setSelectedDriver(driver.id)}
                onMouseLeave={() => setSelectedDriver(null)}
              >
                {/* Driver Name & Status */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/10">
                        <span className="font-bold text-white">{driver.name.charAt(0)}</span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${driver.statusColor} rounded-full border-2 border-[#0f1419]`}></div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{driver.name}</span>
                        <div className={`px-2 py-0.5 rounded-full ${driver.statusColor} ${driver.statusText} text-xs font-medium bg-opacity-20`}>
                          {driver.status}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">ID: DRV-{driver.id.toString().padStart(3, '0')}</p>
                    </div>
                  </div>
                </td>

                {/* RFID Card ID */}
                <td className="py-4 px-4">
                  <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 inline-block">
                    <span className="font-mono text-sm text-white">{driver.rfid}</span>
                  </div>
                </td>

                {/* Total Trips */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-500/10 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <span className="font-bold text-white">{driver.totalTrips}</span>
                      <p className="text-xs text-gray-400">trips</p>
                    </div>
                  </div>
                </td>

                {/* Average Duration */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                      <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="font-bold text-white">{driver.avgDuration}</span>
                      <p className="text-xs text-gray-400">average</p>
                    </div>
                  </div>
                </td>

                {/* Performance */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-lg ${driver.performanceColor} border border-white/5`}>
                      <span className={`text-sm font-semibold ${driver.performanceText}`}>{driver.performance}</span>
                    </div>
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${driver.performanceGradient}`}
                        style={{ 
                          width: driver.performance === 'EXCELLENT' ? '90%' : 
                                 driver.performance === 'GOOD' ? '75%' : 
                                 driver.performance === 'AVERAGE' ? '60%' : '50%' 
                        }}
                      ></div>
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all duration-200 group/action">
                      <Eye className="w-4 h-4 text-gray-400 group-hover/action:text-white" />
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all duration-200 group/action">
                      <FileText className="w-4 h-4 text-gray-400 group-hover/action:text-white" />
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all duration-200 group/action">
                      <MoreVertical className="w-4 h-4 text-gray-400 group-hover/action:text-white" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with Pagination */}
      <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm text-gray-400">
          Showing <span className="font-semibold text-white">{driversData.length}</span> of <span className="font-semibold text-white">142</span> drivers
        </div>
        
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-gray-400 hover:text-white transition-all duration-200">
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-all duration-200 ${
                  num === 1
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          
          <button className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 text-gray-400 hover:text-white transition-all duration-200">
            Next
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-white/2.5 rounded-lg border border-white/5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Active: Ready for assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-400">On Trip: Currently in transit</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Idle: Available but not assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            </div>
            <span className="text-xs text-gray-400">Break: On scheduled break</span>
          </div>
        </div>
      </div>
    </div>
  );
}