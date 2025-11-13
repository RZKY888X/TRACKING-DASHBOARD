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

  // Initial mock data
  useEffect(() => {
    setData(generateMockData());
  }, []);

  // MQTT
  const { messages: mqttMessages, isConnected: mqttConnected } = useMQTT({
    enabled: false,
    brokerUrl: 'ws://localhost:8083/mqtt',
    topics: ['vehicle/position', 'vehicle/status'],
  });

  // LoRaWAN
  const { data: loraData, isConnected: loraConnected } = useLoRaWAN({
    enabled: false,
    apiUrl: 'localhost:8080',
    apiKey: 'your-api-key',
  });

  // Update dari MQTT
  useEffect(() => {
    if (mqttMessages.length > 0) {
      const latestMessage = mqttMessages[mqttMessages.length - 1];
      console.log('MQTT Update:', latestMessage);
      // setData(prev => updateVehicleData(prev, latestMessage));
    }
  }, [mqttMessages]);

  // Update dari LoRaWAN
  useEffect(() => {
    if (loraData.length > 0) {
      const latestData = loraData[loraData.length - 1];
      console.log('LoRaWAN Update:', latestData);
      // setData(prev => updateVehicleData(prev, latestData));
    }
  }, [loraData]);

  const stats = calculateStats(data);

  return (
    <main className="min-h-screen bg-[#050812] p-4 md:p-6 text-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_25px_#00FFFF20] p-6 mb-6 transition-all hover:shadow-[0_0_35px_#00FFFF30]">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-cyan-400 drop-shadow-[0_0_10px_#00FFFF90]">
            Vehicle Operation Management System
          </h1>

          {/* Connection Status */}
          <div className="flex gap-6 justify-center mt-5">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full shadow-[0_0_10px_#00FFFF] ${
                  mqttConnected ? 'bg-cyan-400' : 'bg-gray-600'
                }`}
              ></div>
              <span className="text-sm text-gray-400">
                MQTT:{' '}
                <span className={mqttConnected ? 'text-cyan-300' : 'text-gray-500'}>
                  {mqttConnected ? 'Connected' : 'Disconnected'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full shadow-[0_0_10px_#00FFFF] ${
                  loraConnected ? 'bg-cyan-400' : 'bg-gray-600'
                }`}
              ></div>
              <span className="text-sm text-gray-400">
                LoRaWAN:{' '}
                <span className={loraConnected ? 'text-cyan-300' : 'text-gray-500'}>
                  {loraConnected ? 'Connected' : 'Disconnected'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_20px_#00FFFF15] mb-6 p-4">
          <FilterSection filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Map */}
        <div className="mt-6 bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_20px_#00FFFF20] p-4">
          <VehicleMap positions={vehiclePositions} />
        </div>

        {/* Data Table */}
        <div className="mt-6 bg-[#0B1120] border border-cyan-500/20 rounded-lg shadow-[0_0_20px_#00FFFF20] p-4 overflow-hidden">
          <DataTable data={data} />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} Fleet Management Dashboard — Neon Dark Theme
        </p>
      </div>
    </main>
  );
}
