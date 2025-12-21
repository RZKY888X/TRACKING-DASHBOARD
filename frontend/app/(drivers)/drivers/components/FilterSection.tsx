"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Filter, Download, ChevronDown, X } from 'lucide-react';

const FilterSection = () => {
  const [selectedRoute, setSelectedRoute] = useState('AllRoutes');
  const [dateRange, setDateRange] = useState('oct 1 - oct 27, 2023');
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const routes = ['AllRoutes', 'North Route', 'South Route', 'East Route', 'West Route', 'Metro Route', 'Rural Route'];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRouteDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#0f1419] via-[#161B22] to-[#0f1419] border border-white/5 rounded-xl p-4 sm:p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Title Section */}
        <div className="lg:hidden w-full mb-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Data Filters & Export
          </h3>
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          {/* Date Range */}
          <div className="group relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <Calendar className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Date Range
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{dateRange}</span>
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-white/10 mx-2"></div>
          <div className="block sm:hidden w-full h-px bg-white/10 my-2"></div>

          {/* Route Filter with Dropdown */}
          <div className="group relative w-full sm:w-auto" ref={dropdownRef}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <Filter className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Route Filter
                </p>
                <div className="relative">
                  <button
                    onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors duration-200"
                  >
                    <span className="text-white font-medium">{selectedRoute}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isRouteDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown */}
                  {isRouteDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-[#0f1419] border border-white/10 rounded-lg shadow-2xl z-50 backdrop-blur-sm">
                      <div className="p-2 space-y-1">
                        {routes.map((route) => (
                          <button
                            key={route}
                            onClick={() => {
                              setSelectedRoute(route);
                              setIsRouteDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors duration-150 ${
                              selectedRoute === route 
                                ? 'bg-cyan-500/20 text-cyan-300' 
                                : 'text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{route}</span>
                              {selectedRoute === route && (
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-white/10 p-2">
                        <button
                          onClick={() => {
                            setSelectedRoute('AllRoutes');
                            setIsRouteDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white py-1.5 hover:bg-white/5 rounded transition-colors duration-150"
                        >
                          <X className="w-3 h-3" />
                          Clear Filter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="w-full lg:w-auto mt-4 lg:mt-0">
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-300 w-full lg:w-auto group border border-cyan-500/30 hover:border-cyan-500/50 shadow-lg relative overflow-hidden">
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-200 relative z-10" />
            <span className="relative z-10">Export Data</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          </button>
        </div>
      </div>

      {/* Applied Filters Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400">Applied filters:</span>
          <span className="px-2 py-1 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
            {dateRange}
          </span>
          <span className="px-2 py-1 bg-purple-500/10 text-purple-300 rounded border border-purple-500/20">
            {selectedRoute}
          </span>
          <button 
            onClick={() => {
              setSelectedRoute('AllRoutes');
              setDateRange('oct 1 - oct 27, 2023');
            }}
            className="ml-auto text-xs text-gray-400 hover:text-white transition-colors duration-150 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;