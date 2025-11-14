'use client';

import { Clock, Gauge, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import { VehicleStats } from '@/types';

interface StatsCardsProps {
  stats: VehicleStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cardBase =
    'bg-[#0B1120] border border-cyan-500/10 rounded-2xl p-6 shadow-[0_0_15px_#00FFFF10] hover:shadow-[0_0_25px_#00FFFF20] transition-all';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6 text-gray-200">
      {/* Vehicle Status */}
      <div className={`${cardBase} mx-auto w-[90%]`}>
        <h3 className="text-xl font-semibold text-cyan-400 mb-5 tracking-tight">
          Vehicle Status
        </h3>
        <div className="flex flex-col gap-4">
          {[
            { color: 'bg-green-500', label: 'Idle', value: stats.idle },
            { color: 'bg-yellow-400', label: 'On Trip', value: stats.onTrip },
            { color: 'bg-purple-500', label: 'Completed', value: stats.completed },
          ].map(({ color, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between bg-[#0F172A]/70 rounded-xl px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 ${color} rounded-full`} />
                <span className="text-base md:text-lg text-gray-100 font-semibold">
                  {label}
                </span>
              </div>
              <span className="text-2xl font-bold text-gray-100">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Metrics */}
      <div className={`${cardBase} mx-auto w-[90%]`}>
        <h3 className="text-xl font-semibold text-cyan-400 mb-5 tracking-tight">
          Trip Metrics
        </h3>
        <div className="flex flex-col gap-4">
          {/* Average Trip Duration */}
          <div className="flex items-center justify-between bg-[#0F172A]/70 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-400" size={24} />
              <p className="text-base md:text-lg text-gray-300 font-medium">
                Avg Trip Duration
              </p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-100">
              3h 42m
            </p>
          </div>

          {/* Average Trip Speed */}
          <div className="flex items-center justify-between bg-[#0F172A]/70 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <Gauge className="text-cyan-400" size={24} />
              <p className="text-base md:text-lg text-gray-300 font-medium">
                Avg Trip Speed
              </p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-100">
              50 km/h
            </p>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className={`${cardBase} mx-auto w-[90%]`}>
        <h3 className="text-xl font-semibold text-cyan-400 mb-5 tracking-tight">
          Performance
        </h3>
        <div className="flex flex-col gap-4">
          {[
            {
              icon: <CheckCircle className="text-green-400" size={24} />,
              label: 'On Time',
              value: stats.onTime,
            },
            {
              icon: <AlertTriangle className="text-red-400" size={24} />,
              label: 'Delay',
              value: stats.delay,
            },
            {
              icon: <Timer className="text-blue-400" size={24} />,
              label: 'Early',
              value: stats.early,
            },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between bg-[#0F172A]/70 rounded-xl px-5 py-3"
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className="text-base md:text-lg text-gray-100 font-semibold">
                  {label}
                </span>
              </div>
              <span className="text-2xl font-bold text-gray-100">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
