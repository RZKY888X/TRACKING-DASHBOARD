'use client';

import { useState } from 'react';
import { VehicleData } from '@/types';

interface DataTableProps {
  data: VehicleData[];
}

export default function DataTable({ data }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'On Time':
        return 'bg-green-600/30 text-green-300';
      case 'Delay':
        return 'bg-red-600/30 text-red-300';
      case 'Early':
        return 'bg-blue-600/30 text-blue-300';
      case 'On Trip':
        return 'bg-yellow-600/30 text-yellow-300';
      default:
        return 'bg-gray-600/30 text-gray-300';
    }
  };

  return (
    <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg shadow-md">
      <div className="p-4 md:p-6 border-b border-[#1F2A37]">
        <h2 className="text-lg font-semibold text-gray-100">Trip Detail</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-[#1F2A37] text-gray-200">
            <tr>
              {[
                'Driver Name', 'Vehicle', 'From', 'To', 
                'Check-In', 'Check-Out', 'Trip Time', 
                'Avg Speed', 'Status'
              ].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-sm font-semibold">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2A37]">
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#161B22] transition">
                <td className="px-4 py-3 text-sm text-gray-300">{row.driverName}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{row.vehicle}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{row.from}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{row.to}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{row.checkIn}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{row.checkOut}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{row.tripTime}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{row.avgSpeed} km/h</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(row.status)}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-[#1F2A37] flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-[#1F2A37] text-gray-200 rounded hover:bg-[#2A3441] disabled:opacity-40 text-sm"
          >
            ← Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-[#1F2A37] text-gray-200 rounded hover:bg-[#2A3441] disabled:opacity-40 text-sm"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
