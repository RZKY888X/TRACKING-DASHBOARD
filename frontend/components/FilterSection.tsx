// frontend/components/FilterSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { Filters } from '@/types';

interface FilterSectionProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export default function FilterSection({ filters, onFilterChange }: FilterSectionProps) {
  const [drivers, setDrivers] = useState<string[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);

  // === FUNCTIONS HARUS DIATAS USEEFFECT ===
  const fetchDrivers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/drivers');
      const data = await res.json();

      if (Array.isArray(data)) {
        setDrivers(data);
      } else if (data?.drivers && Array.isArray(data.drivers)) {
        setDrivers(data.drivers);
      } else {
        console.warn("Unexpected driver response, applying fallback mock.");
        setDrivers(["John Doe", "Jane Smith", "Bob Johnson"]);
      }

    } catch (err) {
      console.error("Failed to load drivers:", err);
      setDrivers(["John Doe", "Jane Smith", "Bob Johnson"]);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/routes');
      const data = await res.json();

      if (Array.isArray(data)) {
        setRoutes(data);
      } else if (data?.routes && Array.isArray(data.routes)) {
        setRoutes(data.routes);
      } else {
        console.warn("Unexpected route response, applying fallback mock.");
        setRoutes([
          "Route 1 - Jakarta to Bandung",
          "Route 2 - Surabaya to Malang",
          "Route 3 - Yogyakarta to Semarang",
        ]);
      }
    } catch (err) {
      console.error("Failed to load routes:", err);
      setRoutes([
        "Route 1 - Jakarta to Bandung",
        "Route 2 - Surabaya to Malang",
        "Route 3 - Yogyakarta to Semarang",
      ]);
    }
  };

  // === TEMPATKAN SETELAH FUNGSI DIBUAT ===
  useEffect(() => {
  const loadData = async () => {
    await fetchDrivers();
    await fetchRoutes();
  };

  loadData();
}, []);


  const handleChange = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Date */}
        <select
          value={filters.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className="w-full px-4 py-2 bg-[#161B22] text-gray-300 border border-[#1F2A37] rounded-lg"
        >
          <option value="">Date</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last7">Last 7 days</option>
        </select>

        {/* Driver */}
        <select
          value={filters.driver}
          onChange={(e) => handleChange('driver', e.target.value)}
          className="w-full px-4 py-2 bg-[#161B22] text-gray-300 border border-[#1F2A37] rounded-lg"
        >
          <option value="">All Drivers</option>
          {drivers.length > 0 ? (
            drivers.map((name, idx) => (
              <option key={idx} value={name}>{name}</option>
            ))
          ) : <option disabled>Loading...</option>}
        </select>

        {/* Route */}
        <select
          value={filters.route}
          onChange={(e) => handleChange('route', e.target.value)}
          className="w-full px-4 py-2 bg-[#161B22] text-gray-300 border border-[#1F2A37] rounded-lg"
        >
          <option value="">Origin Route</option>
          {routes.length > 0 ? (
            routes.map((route, idx) => (
              <option key={idx} value={route}>{route}</option>
            ))
          ) : <option disabled>Loading...</option>}
        </select>

      </div>
    </div>
  );
}
