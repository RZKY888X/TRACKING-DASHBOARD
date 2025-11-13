'use client';

import { Clock, Gauge, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import { VehicleStats } from '@/types';

interface StatsCardsProps {
  stats: VehicleStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cardBase = 'bg-[#0D1117] border border-[#1F2A37] rounded-lg p-6 shadow-md';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 text-gray-200">
      {/* Vehicle Status */}
      <div className={cardBase}>
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Vehicle Status</h3>
        <div className="space-y-4">
          {[
            { color: 'bg-green-500', label: 'Idle', value: stats.idle },
            { color: 'bg-yellow-500', label: 'On Trip', value: stats.onTrip },
            { color: 'bg-purple-500', label: 'Completed', value: stats.completed },
          ].map(({ color, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 ${color} rounded-full`}></div>
                <span>{label}</span>
              </div>
              <span className="text-2xl font-bold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Metrics */}
      <div className={cardBase}>
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Trip Metrics</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-400" size={24} />
            <div>
              <p className="text-sm text-gray-400">Avg Trip Duration</p>
              <p className="text-lg font-semibold text-gray-100">3h 42m</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Gauge className="text-cyan-400" size={24} />
            <div>
              <p className="text-sm text-gray-400">Avg Trip Speed</p>
              <p className="text-lg font-semibold text-gray-100">50 km/h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className={cardBase}>
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Performance</h3>
        <div className="space-y-4">
          {[
            { icon: <CheckCircle className="text-green-400" size={20} />, label: 'On Time', value: stats.onTime },
            { icon: <AlertTriangle className="text-red-400" size={20} />, label: 'Delay', value: stats.delay },
            { icon: <Timer className="text-blue-400" size={20} />, label: 'Early', value: stats.early },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon}
                <span>{label}</span>
              </div>
              <span className="text-2xl font-bold">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
