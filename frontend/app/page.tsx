// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import FilterSection from '@/components/FilterSection';
import StatsCards from '@/components/StatsCards';
import VehicleMap from '@/components/VehicleMap';
import DataTable from '@/components/DataTable';
import { useMQTT } from '@/hooks/useMQTT';
import { useLoRaWAN } from '@/hooks/useLoRaWAN';
import { generateMockData, vehiclePositions } from '@/lib/mockData';
import { calculateStats } from '@/lib/calculateStats';
import { Filters, VehicleData } from '@/types';

export default function Home() {
  const [data, setData] = useState<VehicleData[]>([]);
  const [filters, setFilters] = useState<Filters>({ date: '', driver: '', route: '' });

  useEffect(() => {
    setData(generateMockData());
  }, []);

  const { messages: mqttMessages, isConnected: mqttConnected } = useMQTT({
    enabled: false,
    brokerUrl: 'ws://localhost:8083/mqtt',
    topics: ['vehicle/position', 'vehicle/status'],
  });

  const { data: loraData, isConnected: loraConnected } = useLoRaWAN({
    enabled: false,
    apiUrl: 'localhost:8080',
    apiKey: 'your-api-key',
  });

  useEffect(() => {
    if (mqttMessages.length > 0) {
      const latest = mqttMessages[mqttMessages.length - 1];
      console.log('MQTT Update:', latest);
    }
  }, [mqttMessages]);

  useEffect(() => {
    if (loraData.length > 0) {
      const latest = loraData[loraData.length - 1];
      console.log('LoRaWAN Update:', latest);
    }
  }, [loraData]);

  const stats = calculateStats(data);

  return (
    <main className="min-h-screen bg-[#050812] text-gray-200 px-3 md:px-4 py-2">
      <div className="max-w-7xl mx-auto space-y-3">

        {/* Header */}
        <div className="bg-[#0B1120] border border-cyan-500/20 rounded-xl shadow-[0_0_15px_#00FFFF15] p-4 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-cyan-400 tracking-wide drop-shadow-[0_0_8px_#00FFFF80] mb-1">
            Vehicle Operation Management System
          </h1>
          <div className="flex justify-center gap-3 text-[11px] md:text-sm text-gray-400">
            {[
              { label: 'MQTT', connected: mqttConnected },
              { label: 'LoRaWAN', connected: loraConnected },
            ].map(({ label, connected }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full shadow-[0_0_6px_#00FFFF] ${
                    connected ? 'bg-cyan-400' : 'bg-gray-600'
                  }`}
                ></div>
                <span>
                  {label}:{' '}
                  <span className={connected ? 'text-cyan-300' : 'text-gray-500'}>
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_10px_#00FFFF10] p-3 md:p-4">
          <FilterSection filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Stats Cards */}
        <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_10px_#00FFFF10] p-3">
          <StatsCards stats={stats} />
        </div>

        {/* Vehicle Map */}
        <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_10px_#00FFFF10] p-3">
          <VehicleMap positions={vehiclePositions} />
        </div>

        {/* Data Table */}
        <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_10px_#00FFFF10] p-3">
          <DataTable data={data} />
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] md:text-[11px] text-gray-500 py-2">
          © {new Date().getFullYear()} Fleet Management Dashboard — Compact Neon Layout
        </p>
      </div>
    </main>
  );
}
