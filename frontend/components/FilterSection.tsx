"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Filters } from "@/types";

interface FilterSectionProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FilterOption {
  id: number;
  name: string;
  city?: string;
}

export default function FilterSection({
  filters,
  onFilterChange,
}: FilterSectionProps) {
  const { data: session } = useSession();
  
  const [filterOptions, setFilterOptions] = useState<{
    drivers: FilterOption[];
    origins: FilterOption[];
    destinations: FilterOption[];
  }>({
    drivers: [],
    origins: [],
    destinations: []
  });

  const [loading, setLoading] = useState({
    drivers: false,
    origins: false,
    destinations: false
  });

  const [openDriver, setOpenDriver] = useState(false);
  const [openRoute, setOpenRoute] = useState(false);
  const [openDeparture, setOpenDeparture] = useState(false);
  const [openDate, setOpenDate] = useState(false);

  const [searchDriver, setSearchDriver] = useState("");
  const [searchRoute, setSearchRoute] = useState("");
  const [searchDeparture, setSearchDeparture] = useState("");

  const [mode, setMode] = useState<"select" | "daily" | "weekly" | "monthly">("select");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [weekSearch, setWeekSearch] = useState("");

  // Fetch filter options berdasarkan tanggal yang dipilih
  const fetchFilterOptions = async (resetFields = false) => {
    try {
      setLoading({ drivers: true, origins: true, destinations: true });
      
      const params = new URLSearchParams();
      if (filters.dateType) {
        params.append('dateType', filters.dateType);
      }
      if (filters.dateValue) {
        params.append('dateValue', filters.dateValue);
      }

      const res = await fetch(`${API_URL}/api/filter/options?${params}`, {
        headers: session?.accessToken ? {
          Authorization: `Bearer ${session.accessToken}`,
        } : undefined,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          console.log("📥 Filter options received:", {
            drivers: data.drivers.length,
            origins: data.origins.length,
            destinations: data.destinations.length
          });
          
          setFilterOptions({
            drivers: data.drivers || [],
            origins: data.origins || [],
            destinations: data.destinations || []
          });

          // Reset dependent fields jika diminta
          if (resetFields) {
            const updatedFilters = { ...filters };
            
            // Jika tidak ada driver di tanggal tsb, reset driver
            if (data.drivers.length === 0) {
              updatedFilters.driver = "";
            } else if (filters.driver && !data.drivers.some(d => d.name === filters.driver.split('(')[0].trim())) {
              updatedFilters.driver = "";
            }
            
            // Jika tidak ada origin di tanggal tsb, reset origin
            if (data.origins.length === 0) {
              updatedFilters.route = "";
            } else if (filters.route && !data.origins.some(o => 
              `${o.name} (${o.city})` === filters.route
            )) {
              updatedFilters.route = "";
            }
            
            // Jika tidak ada destination di tanggal tsb, reset destination
            if (data.destinations.length === 0) {
              updatedFilters.departureRoute = "";
            } else if (filters.departureRoute && !data.destinations.some(d => 
              `${d.name} (${d.city})` === filters.departureRoute
            )) {
              updatedFilters.departureRoute = "";
            }
            
            onFilterChange(updatedFilters);
          }
        }
      } else {
        console.error("Failed to fetch filter options");
        setFilterOptions({
          drivers: [],
          origins: [],
          destinations: []
        });
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
      setFilterOptions({
        drivers: [],
        origins: [],
        destinations: []
      });
    } finally {
      setLoading({ drivers: false, origins: false, destinations: false });
    }
  };

  // Fetch options ketika tanggal berubah
  useEffect(() => {
    fetchFilterOptions(true); // Reset fields ketika tanggal berubah
  }, [filters.dateType, filters.dateValue]);

  const handleChange = <K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    const updatedFilters = { ...filters, [key]: value };
    
    // Reset dependent filters
    if (key === 'dateType' || key === 'dateValue') {
      updatedFilters.driver = "";
      updatedFilters.route = "";
      updatedFilters.departureRoute = "";
    } else if (key === 'driver') {
      updatedFilters.route = "";
      updatedFilters.departureRoute = "";
    } else if (key === 'route') {
      updatedFilters.departureRoute = "";
    }
    
    onFilterChange(updatedFilters);
  };

  // Filter lists berdasarkan search
  const getFilteredDrivers = () => {
    let filtered = filterOptions.drivers.map(d => d.name);
    
    if (searchDriver) {
      filtered = filtered.filter(driver => 
        driver.toLowerCase().includes(searchDriver.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredRoutes = () => {
    // Jika driver dipilih, hanya tampilkan origins dari driver tersebut
    let origins = filterOptions.origins;
    
    // Filter out jika sama dengan departure yang dipilih
    let filtered = origins
      .filter(o => {
        if (filters.departureRoute) {
          return `${o.name} (${o.city})` !== filters.departureRoute;
        }
        return true;
      })
      .map(o => `${o.name} (${o.city})`);
    
    if (searchRoute) {
      filtered = filtered.filter(route => 
        route.toLowerCase().includes(searchRoute.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredDepartures = () => {
    // Jika driver dan route dipilih, hanya tampilkan destinations yang sesuai
    let destinations = filterOptions.destinations;
    
    // Filter out jika sama dengan route yang dipilih
    let filtered = destinations
      .filter(d => {
        if (filters.route) {
          return `${d.name} (${d.city})` !== filters.route;
        }
        return true;
      })
      .map(d => `${d.name} (${d.city})`);
    
    if (searchDeparture) {
      filtered = filtered.filter(departure => 
        departure.toLowerCase().includes(searchDeparture.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredDrivers = getFilteredDrivers();
  const filteredRoutes = getFilteredRoutes();
  const filteredDepartures = getFilteredDepartures();

  const weeks = [
    "Week 1", "Week 2", "Week 3", "Week 4", "Week 5"
  ].filter((week) => week.toLowerCase().includes(weekSearch.toLowerCase()));

  const getDateLabel = () => {
    if (filters.dateType === "current") return "Current";
    if (filters.dateType === "daily" && filters.dateValue) {
      return new Date(filters.dateValue).toLocaleDateString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    if (filters.dateType === "weekly" && filters.dateValue) return filters.dateValue;
    if (filters.dateType === "monthly" && filters.dateValue) {
      const [year, month] = filters.dateValue.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long'
      });
    }
    return "Select Date";
  };

  const dateLabel = getDateLabel();

  if (loading.drivers && loading.origins && loading.destinations) {
    return (
      <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
              <div className="h-12 bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg p-6 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* ================= DATE ================= */}
        <div className="relative z-50">
          <label className="block text-sm text-gray-400 mb-2">Date</label>

          <button
            onClick={() => setOpenDate(!openDate)}
            className="w-full px-4 py-3 bg-[#161B22] rounded-lg text-left text-gray-300 flex items-center justify-between hover:bg-[#1F2937] transition"
          >
            <span>{dateLabel}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 text-white transition-transform ${openDate ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {openDate && (
            <div 
              className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg p-3 space-y-2 z-50 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {mode === "select" && (
                <>
                  <button
                    onClick={() => {
                      handleChange("dateType", "current");
                      handleChange("dateValue", "");
                      setOpenDate(false);
                    }}
                    className={`w-full py-2 text-xs rounded text-left px-3 transition ${
                      filters.dateType === "current" 
                        ? 'bg-[#1F2937] text-cyan-400' 
                        : 'bg-[#161B22] hover:bg-[#1F2937] text-gray-200'
                    }`}
                  >
                    CURRENT
                  </button>
                  <button
                    onClick={() => {
                      setMode("daily");
                      handleChange("dateType", "daily");
                    }}
                    className={`w-full py-2 text-xs rounded text-left px-3 transition ${
                      filters.dateType === "daily" 
                        ? 'bg-[#1F2937] text-cyan-400' 
                        : 'bg-[#161B22] hover:bg-[#1F2937] text-gray-200'
                    }`}
                  >
                    DAILY
                  </button>
                  <button
                    onClick={() => {
                      setMode("weekly");
                      handleChange("dateType", "weekly");
                    }}
                    className={`w-full py-2 text-xs rounded text-left px-3 transition ${
                      filters.dateType === "weekly" 
                        ? 'bg-[#1F2937] text-cyan-400' 
                        : 'bg-[#161B22] hover:bg-[#1F2937] text-gray-200'
                    }`}
                  >
                    WEEKLY
                  </button>
                  <button
                    onClick={() => {
                      setMode("monthly");
                      handleChange("dateType", "monthly");
                    }}
                    className={`w-full py-2 text-xs rounded text-left px-3 transition ${
                      filters.dateType === "monthly" 
                        ? 'bg-[#1F2937] text-cyan-400' 
                        : 'bg-[#161B22] hover:bg-[#1F2937] text-gray-200'
                    }`}
                  >
                    MONTHLY
                  </button>
                </>
              )}

              {mode === "daily" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setMode("select")}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      ← Back
                    </button>
                    <span className="text-sm text-gray-300">Select Date</span>
                  </div>
                  <input
                    type="date"
                    value={filters.dateValue || ''}
                    onChange={(e) => {
                      handleChange("dateValue", e.target.value);
                      setMode("select");
                      setOpenDate(false);
                    }}
                    className="w-full px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              )}

              {mode === "monthly" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setMode("select")}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      ← Back
                    </button>
                    <span className="text-sm text-gray-300">Select Month</span>
                  </div>
                  <input
                    type="month"
                    value={filters.dateValue || ''}
                    onChange={(e) => {
                      handleChange("dateValue", e.target.value);
                      setMode("select");
                      setOpenDate(false);
                    }}
                    className="w-full px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              )}

              {mode === "weekly" && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setMode("select")}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      ← Back
                    </button>
                    <span className="text-sm text-gray-300">Select Week</span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-2">Select Month First</p>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        // Reset week value jika bulan berubah
                        if (filters.dateValue && filters.dateValue.includes(e.target.value)) {
                          // Keep the week if same month
                        } else {
                          handleChange("dateValue", "");
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>

                  {selectedMonth && (
                    <>
                      <input
                        type="text"
                        placeholder="Search week..."
                        value={weekSearch}
                        onChange={(e) => setWeekSearch(e.target.value)}
                        className="w-full mb-2 px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded"
                      />

                      <div className="max-h-40 overflow-y-auto">
                        {weeks.map((week) => (
                          <div
                            key={week}
                            onClick={() => {
                              handleChange("dateValue", `${selectedMonth} ${week}`);
                              setMode("select");
                              setOpenDate(false);
                            }}
                            className={`px-3 py-2 text-xs cursor-pointer rounded transition ${
                              filters.dateValue === `${selectedMonth} ${week}`
                                ? 'bg-[#1F2937] text-cyan-400'
                                : 'hover:bg-[#1F2937] text-gray-200'
                            }`}
                          >
                            {week}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= DRIVER ================= */}
        <div className="relative z-40">
          <label className="block text-sm text-gray-400 mb-2">Driver</label>
          <button
            onClick={() => {
              setOpenDriver(!openDriver);
              setOpenRoute(false);
              setOpenDeparture(false);
              setOpenDate(false);
              if (openDriver) {
                setSearchDriver("");
              }
            }}
            className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between transition ${
              loading.drivers 
                ? 'bg-[#1F2937] text-gray-500 cursor-wait'
                : filterOptions.drivers.length === 0
                ? 'bg-[#1F2937] text-gray-500 cursor-not-allowed'
                : 'bg-[#161B22] text-gray-300 hover:bg-[#1F2937]'
            }`}
            disabled={loading.drivers || filterOptions.drivers.length === 0}
          >
            <span className="truncate">
              {loading.drivers 
                ? "Loading..." 
                : filters.driver || (
                    filterOptions.drivers.length > 0 
                      ? "Select Driver" 
                      : "No drivers available"
                  )
              }
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 transition-transform ${openDriver ? 'rotate-180' : ''} ${
                filterOptions.drivers.length === 0 ? 'text-gray-600' : 'text-white'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openDriver && filterOptions.drivers.length > 0 && (
            <div 
              className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                placeholder="Search driver..."
                value={searchDriver}
                onChange={(e) => setSearchDriver(e.target.value)}
                className="w-full px-3 py-2 bg-[#161B22] text-gray-200 text-sm border-b border-[#1F2A37]"
                autoFocus
              />
              <div className="max-h-60 overflow-y-auto">
                {filteredDrivers.length > 0 ? (
                  filteredDrivers.map((driver) => (
                    <div
                      key={driver}
                      onClick={() => {
                        handleChange("driver", driver);
                        setOpenDriver(false);
                        setSearchDriver("");
                      }}
                      className={`px-3 py-2 cursor-pointer text-sm transition ${
                        filters.driver === driver
                          ? 'bg-[#1F2937] text-cyan-400'
                          : 'hover:bg-[#1F2937] text-gray-200'
                      }`}
                    >
                      {driver}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-400 text-sm text-center">
                    No drivers found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= ORIGIN ROUTE ================= */}
        <div className="relative z-30">
          <label className="block text-sm text-gray-400 mb-2">Origin Route</label>
          <button
            onClick={() => {
              setOpenRoute(!openRoute);
              setOpenDriver(false);
              setOpenDeparture(false);
              setOpenDate(false);
              if (openRoute) {
                setSearchRoute("");
              }
            }}
            className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between transition ${
              loading.origins 
                ? 'bg-[#1F2937] text-gray-500 cursor-wait'
                : filterOptions.origins.length === 0
                ? 'bg-[#1F2937] text-gray-500 cursor-not-allowed'
                : 'bg-[#161B22] text-gray-300 hover:bg-[#1F2937]'
            }`}
            disabled={loading.origins || filterOptions.origins.length === 0}
          >
            <span className="truncate">
              {loading.origins 
                ? "Loading..." 
                : filters.route || (
                    filterOptions.origins.length > 0 
                      ? "Select Origin" 
                      : "No origins available"
                  )
              }
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 transition-transform ${openRoute ? 'rotate-180' : ''} ${
                filterOptions.origins.length === 0 ? 'text-gray-600' : 'text-white'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openRoute && filterOptions.origins.length > 0 && (
            <div 
              className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                placeholder="Search origin..."
                value={searchRoute}
                onChange={(e) => setSearchRoute(e.target.value)}
                className="w-full px-3 py-2 bg-[#161B22] text-gray-200 text-sm border-b border-[#1F2A37]"
                autoFocus
              />
              <div className="max-h-60 overflow-y-auto">
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((route) => (
                    <div
                      key={route}
                      onClick={() => {
                        handleChange("route", route);
                        setOpenRoute(false);
                        setSearchRoute("");
                      }}
                      className={`px-3 py-2 cursor-pointer text-sm transition ${
                        filters.route === route
                          ? 'bg-[#1F2937] text-cyan-400'
                          : 'hover:bg-[#1F2937] text-gray-200'
                      }`}
                    >
                      {route}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-400 text-sm text-center">
                    No origins found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= DEPARTURE ================= */}
        <div className="relative z-20">
          <label className="block text-sm text-gray-400 mb-2">Departure</label>
          <button
            onClick={() => {
              setOpenDeparture(!openDeparture);
              setOpenDriver(false);
              setOpenRoute(false);
              setOpenDate(false);
              if (openDeparture) {
                setSearchDeparture("");
              }
            }}
            className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between transition ${
              loading.destinations 
                ? 'bg-[#1F2937] text-gray-500 cursor-wait'
                : filterOptions.destinations.length === 0
                ? 'bg-[#1F2937] text-gray-500 cursor-not-allowed'
                : 'bg-[#161B22] text-gray-300 hover:bg-[#1F2937]'
            }`}
            disabled={loading.destinations || filterOptions.destinations.length === 0}
          >
            <span className="truncate">
              {loading.destinations 
                ? "Loading..." 
                : filters.departureRoute || (
                    filterOptions.destinations.length > 0 
                      ? "Select Departure" 
                      : "No departures available"
                  )
              }
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 transition-transform ${openDeparture ? 'rotate-180' : ''} ${
                filterOptions.destinations.length === 0 ? 'text-gray-600' : 'text-white'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openDeparture && filterOptions.destinations.length > 0 && (
            <div 
              className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                placeholder="Search departure..."
                value={searchDeparture}
                onChange={(e) => setSearchDeparture(e.target.value)}
                className="w-full px-3 py-2 bg-[#161B22] text-gray-200 text-sm border-b border-[#1F2A37]"
                autoFocus
              />
              <div className="max-h-60 overflow-y-auto">
                {filteredDepartures.length > 0 ? (
                  filteredDepartures.map((departure) => (
                    <div
                      key={departure}
                      onClick={() => {
                        handleChange("departureRoute", departure);
                        setOpenDeparture(false);
                        setSearchDeparture("");
                      }}
                      className={`px-3 py-2 cursor-pointer text-sm transition ${
                        filters.departureRoute === departure
                          ? 'bg-[#1F2937] text-cyan-400'
                          : 'hover:bg-[#1F2937] text-gray-200'
                      }`}
                    >
                      {departure}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-400 text-sm text-center">
                    No departures found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}