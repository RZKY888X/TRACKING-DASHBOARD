// frontend/components/StatsCards.tsx
'use client';

import { VehicleStats } from '@/types';
import { Clock, Gauge, CheckCircle, AlertTriangle, Timer } from 'lucide-react';

interface StatsCardsProps {
  stats: VehicleStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cardBase =
    'bg-[#0B1120] border border-cyan-500/10 rounded-2xl p-5 shadow-[0_0_15px_#00FFFF10] hover:shadow-[0_0_20px_#00FFFF20] transition-all';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-gray-200">

      {/* Vehicle Status */}
      <div className={`${cardBase} mx-auto w-[92%]`}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Vehicle Status</h3>

        <div className="flex flex-col gap-3">
          {[
            { color: 'bg-green-500', label: 'Idle', value: stats.idle },
            { color: 'bg-yellow-400', label: 'On Trip', value: stats.onTrip },
            { color: 'bg-purple-500', label: 'Completed', value: stats.completed },
          ].map(({ color, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between bg-[#0F172A]/80 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 ${color} rounded-full`} />
                <span className="text-base">{label}</span>
              </div>
              <span className="text-xl font-bold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Metrics */}
      <div className={`${cardBase} mx-auto w-[92%]`}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Trip Metrics</h3>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-[#0F172A]/80 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-400" size={20} />
              <p className="text-base">Avg Trip Duration</p>
            </div>
            <p className="text-xl font-bold">{stats.avgTripDuration ?? '-'}</p>
          </div>

          <div className="flex items-center justify-between bg-[#0F172A]/80 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Gauge className="text-cyan-400" size={20} />
              <p className="text-base">Avg Trip Speed</p>
            </div>
            <p className="text-xl font-bold">{stats.avgSpeed ?? '-'} km/h</p>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className={`${cardBase} mx-auto w-[92%]`}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Performance</h3>

        <div className="flex flex-col gap-3">
          {[
            { icon: <CheckCircle className="text-green-400" size={20} />, label: 'On Time', value: stats.onTime },
            { icon: <AlertTriangle className="text-red-400" size={20} />, label: 'Delay', value: stats.delay },
            { icon: <Timer className="text-blue-400" size={20} />, label: 'Early', value: stats.early },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between bg-[#0F172A]/80 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {icon}
                <span>{label}</span>
              </div>
              <span className="text-xl font-bold">{value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
