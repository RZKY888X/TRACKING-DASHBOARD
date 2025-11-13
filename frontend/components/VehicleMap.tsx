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
            html: `<div style="
              background-color: ${iconColors[pos.status]};
              width: 18px; height: 18px; border-radius: 50%;
              border: 2px solid #0D1117;
              box-shadow: 0 0 8px ${iconColors[pos.status]};
            "></div>`,
            className: '',
          });
          L.marker([pos.lat, pos.lng], { icon }).addTo(mapInstanceRef.current!);
        });
      }
    };

    initMap();
  }, [positions]);

  return (
    <div className="bg-[#0B1120] border border-cyan-500/10 rounded-2xl shadow-[0_0_20px_#00FFFF15] p-6 mb-4 text-gray-100">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-stretch gap-6">
        {/* Map Section */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-lg md:text-xl font-semibold mb-3 text-center text-white tracking-wide">
            Vehicle Position
          </h2>
          <div
            ref={mapRef}
            className="h-[420px] md:h-[480px] rounded-xl border border-cyan-500/20 shadow-inner shadow-cyan-500/10"
          ></div>
        </div>

        {/* Legend Section */}
        <div className="flex flex-col justify-center items-center lg:w-44 mt-2">
          <h3 className="text-base font-semibold mb-5 text-white tracking-wider">
            Status
          </h3>

          <div className="flex flex-col justify-center items-center gap-10">
            {[
              { color: 'bg-green-500', label: 'Idle' },
              { color: 'bg-yellow-400', label: 'On Trip' },
              { color: 'bg-purple-500', label: 'Completed' },
            ].map(({ color, label }) => (
              <div
                key={label}
                className={`relative w-24 h-24 flex items-center justify-center rounded-full border-2 border-[#0D1117] ${color} shadow-[0_0_18px_rgba(0,255,255,0.25)]`}
              >
                <span className="text-sm font-semibold text-white text-center leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
