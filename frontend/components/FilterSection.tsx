// components/FilterSection.tsx
'use client';

import { Filters } from '@/types';

interface FilterSectionProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export default function FilterSection({ filters, onFilterChange }: FilterSectionProps) {
  const handleChange = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'date', label: 'Date', options: ['Today', 'Yesterday', 'Last 7 days'] },
          { key: 'driver', label: 'Driver', options: ['All', 'Budi Santoso', 'Joko Prasetyo'] },
          { key: 'route', label: 'Origin Route', options: ['Jakarta', 'Bandung', 'Cirebon'] },
        ].map(({ key, label, options }) => (
          <select
            key={key}
            value={filters[key as keyof Filters]}
            onChange={(e) => handleChange(key as keyof Filters, e.target.value)}
            className="w-full px-4 py-2 bg-[#161B22] text-gray-300 border border-[#1F2A37] rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="">{label}</option>
            {options.map((opt) => (
              <option key={opt} value={opt.toLowerCase()}>
                {opt}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}
