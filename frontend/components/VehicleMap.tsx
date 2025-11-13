'use client';

import { useEffect, useRef } from 'react';
import type L from 'leaflet';
import { VehiclePosition } from '@/types';

interface VehicleMapProps {
  positions: VehiclePosition[];
}

export default function VehicleMap({ positions }: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current!, {
          center: [-6.9175, 107.6191],
          zoom: 9,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(mapInstanceRef.current);

        const iconColors: Record<VehiclePosition['status'], string> = {
          idle: '#22c55e',
          onTrip: '#eab308',
          completed: '#8b5cf6',
        };

        positions.forEach((pos) => {
          const icon = L.divIcon({
            html: `<div style="background-color: ${iconColors[pos.status]}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #0D1117; box-shadow: 0 0 8px ${iconColors[pos.status]};"></div>`,
            className: '',
          });
          L.marker([pos.lat, pos.lng], { icon }).addTo(mapInstanceRef.current!);
        });
      }
    };
    initMap();
  }, [positions]);

  return (
    <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg p-4 md:p-6 mb-6 text-gray-100">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-4">Vehicle Position</h2>
          <div ref={mapRef} className="h-64 md:h-80 rounded-lg border border-[#1F2A37]"></div>
        </div>
        <div className="lg:w-32">
          <h3 className="text-sm font-semibold mb-4 lg:mb-6 text-gray-400">Legend</h3>
          <div className="space-y-3">
            {[
              { color: 'bg-green-500', label: 'Idle' },
              { color: 'bg-yellow-500', label: 'On Trip' },
              { color: 'bg-purple-500', label: 'Completed' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-6 h-6 ${color} rounded-full`}></div>
                <span className="text-sm text-gray-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
