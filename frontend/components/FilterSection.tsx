// frontend/components/FilterSection.tsx
"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Filters } from "@/types";

interface FilterSectionProps {
  children: ReactNode;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClear: () => void;
  onApply: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FilterOption {
  id: number;
  name: string;
  city?: string;
  displayName?: string;
}

export default function FilterSection({
  filters,
  onFilterChange,
  onClear,
  onApply,
}: FilterSectionProps) {
  const { data: session } = useSession();

  const [filterOptions, setFilterOptions] = useState<{
    drivers: FilterOption[];
    origins: FilterOption[];
    destinations: FilterOption[];
  }>({
    drivers: [],
    origins: [],
    destinations: [],
  });

  const [loading, setLoading] = useState(false);
  const [openDriver, setOpenDriver] = useState(false);
  const [openRoute, setOpenRoute] = useState(false);
  const [openDeparture, setOpenDeparture] = useState(false);
  const [openDate, setOpenDate] = useState(false);

  const [searchDriver, setSearchDriver] = useState("");
  const [searchRoute, setSearchRoute] = useState("");
  const [searchDeparture, setSearchDeparture] = useState("");

  const [mode, setMode] = useState<"select" | "daily" | "weekly" | "monthly">(
    "select"
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const [weekSearch, setWeekSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cascade options
  const fetchCascadeOptions = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.dateType && filters.dateType !== "select") {
        params.append("dateType", filters.dateType);
      }
      if (filters.dateValue) {
        params.append("dateValue", filters.dateValue);
      }
      if (
        filters.driver &&
        filters.driver !== "Select Driver" &&
        filters.driver !== "No drivers available"
      ) {
        params.append("driverName", filters.driver);
      }
      if (
        filters.route &&
        filters.route !== "Select Origin" &&
        filters.route !== "No origins available"
      ) {
        params.append("originName", filters.route.split("(")[0].trim());
      }

      console.log("🔄 Fetching cascade options with:", params.toString());

      const res = await fetch(
        `${API_URL}/api/filter/cascade-options?${params}`,
        {
          headers: session?.accessToken
            ? {
                Authorization: `Bearer ${session.accessToken}`,
              }
            : {},
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          console.log("📥 Cascade options received:", {
            drivers: data.drivers?.length || 0,
            origins: data.origins?.length || 0,
            destinations: data.destinations?.length || 0,
          });

          // Format options
          const formattedDrivers = (data.drivers || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            displayName: d.name,
          }));

          const formattedOrigins = (data.origins || []).map((o: any) => ({
            id: o.id,
            name: o.name,
            city: o.city || "",
            displayName: `${o.name}${o.city ? ` (${o.city})` : ""}`,
          }));

          const formattedDestinations = (data.destinations || []).map(
            (d: any) => ({
              id: d.id,
              name: d.name,
              city: d.city || "",
              displayName: `${d.name}${d.city ? ` (${d.city})` : ""}`,
            })
          );

          setFilterOptions({
            drivers: formattedDrivers,
            origins: formattedOrigins,
            destinations: formattedDestinations,
          });

          // Auto-clear dependent fields jika tidak ada data
          const updatedFilters = { ...filters };

          // Clear driver jika tidak ada driver
          if (data.drivers?.length === 0 && filters.driver) {
            updatedFilters.driver = "";
            updatedFilters.route = "";
            updatedFilters.departureRoute = "";
          }

          // Clear route jika tidak ada origin untuk driver tsb
          if (data.origins?.length === 0 && filters.route) {
            updatedFilters.route = "";
            updatedFilters.departureRoute = "";
          }

          // Clear departure jika tidak ada destination untuk route tsb
          if (data.destinations?.length === 0 && filters.departureRoute) {
            updatedFilters.departureRoute = "";
          }

          onFilterChange(updatedFilters);
        }
      } else {
        console.error("Failed to fetch cascade options");
        setFilterOptions({
          drivers: [],
          origins: [],
          destinations: [],
        });
      }
    } catch (error) {
      console.error("Error fetching cascade options:", error);
      setFilterOptions({
        drivers: [],
        origins: [],
        destinations: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch cascade options ketika filter berubah
  useEffect(() => {
    fetchCascadeOptions();
  }, [filters.dateType, filters.dateValue, filters.driver, filters.route]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDriver(false);
        setOpenRoute(false);
        setOpenDeparture(false);
        setOpenDate(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const updatedFilters = { ...filters, [key]: value };

    // Cascade reset logic
    if (key === "dateType" || key === "dateValue") {
      // Reset semua filter kecuali date
      updatedFilters.driver = "";
      updatedFilters.route = "";
      updatedFilters.departureRoute = "";

      // Hanya reset selectedMonth dan weekSearch jika dateType berubah
      if (key === "dateType") {
        // Jika dateType berubah ke weekly, jangan reset selectedMonth dan weekSearch
        if (value !== "weekly") {
          setSelectedMonth("");
          setWeekSearch("");
        }
      }
    } else if (key === "driver") {
      // Reset route dan departure
      updatedFilters.route = "";
      updatedFilters.departureRoute = "";
      setSearchDriver("");
      setOpenDriver(false);
    } else if (key === "route") {
      // Reset departure
      updatedFilters.departureRoute = "";
      setSearchRoute("");
      setOpenRoute(false);
    } else if (key === "departureRoute") {
      setSearchDeparture("");
      setOpenDeparture(false);
    }

    console.log("🔄 Changing filter:", key, value);
    onFilterChange(updatedFilters);
  };

  // Filter lists dengan search
  const getFilteredDrivers = () => {
    let filtered = filterOptions.drivers;

    if (searchDriver) {
      filtered = filtered.filter(
        (driver) =>
          driver.name.toLowerCase().includes(searchDriver.toLowerCase()) ||
          driver.displayName?.toLowerCase().includes(searchDriver.toLowerCase())
      );
    }

    return filtered;
  };

  const getFilteredRoutes = () => {
    let filtered = filterOptions.origins;

    if (searchRoute) {
      filtered = filtered.filter(
        (origin) =>
          origin.name.toLowerCase().includes(searchRoute.toLowerCase()) ||
          origin.displayName
            ?.toLowerCase()
            .includes(searchRoute.toLowerCase()) ||
          (origin.city &&
            origin.city.toLowerCase().includes(searchRoute.toLowerCase()))
      );
    }

    return filtered;
  };

  const getFilteredDepartures = () => {
    let filtered = filterOptions.destinations;

    if (searchDeparture) {
      filtered = filtered.filter(
        (destination) =>
          destination.name
            .toLowerCase()
            .includes(searchDeparture.toLowerCase()) ||
          destination.displayName
            ?.toLowerCase()
            .includes(searchDeparture.toLowerCase()) ||
          (destination.city &&
            destination.city
              .toLowerCase()
              .includes(searchDeparture.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredDrivers = getFilteredDrivers();
  const filteredRoutes = getFilteredRoutes();
  const filteredDepartures = getFilteredDepartures();

  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"].filter(
    (week) => week.toLowerCase().includes(weekSearch.toLowerCase())
  );

  const getDateLabel = () => {
    if (!filters.dateType || filters.dateType === "select")
      return "Select Date";
    if (filters.dateType === "current") return "Current (All Data)";
    if (filters.dateType === "daily" && filters.dateValue) {
      return new Date(filters.dateValue).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (filters.dateType === "weekly" && filters.dateValue) {
      // Format: "YYYY-MM Week X"
      const parts = filters.dateValue.split(" Week ");
      if (parts.length === 2) {
        const [yearMonth, weekNum] = parts;
        const [year, month] = yearMonth.split("-");
        return `Week ${weekNum}, ${new Date(
          parseInt(year),
          parseInt(month) - 1
        ).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        })}`;
      }
      return filters.dateValue; // Return as is if format doesn't match
    }
    if (filters.dateType === "monthly" && filters.dateValue) {
      const [year, month] = filters.dateValue.split("-");
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
        "id-ID",
        {
          month: "long",
          year: "numeric",
        }
      );
    }
    return "Select Date";
  };

  const dateLabel = getDateLabel();

  const formatDisplayName = (option: FilterOption) => {
    if (option.city) {
      return `${option.name} (${option.city})`;
    }
    return option.name;
  };

  return (
    <div
      className='bg-[#0D1117] border border-[#1F2A37] rounded-lg p-6 relative z-10'
      ref={dropdownRef}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-cyan-400 font-semibold'>Filters</h2>
        <span>
          Select date to filter drivers, then select driver to see their routes
        </span>

        <div className='flex gap-2'>
          <button
            onClick={onClear}
            className='
              px-4 py-2 rounded-lg text-sm
              bg-red-900/20 text-red-300
              hover:bg-red-900/40
            '
          >
            Clear
          </button>

          <button
            onClick={onApply}
            className='
              px-4 py-2 rounded-lg text-sm
              bg-cyan-600 text-white
              hover:bg-cyan-700
            '
          >
            Apply
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        {/* ================= DATE ================= */}
        <div className='relative'>
          <label className='block text-sm text-gray-400 mb-2'>
            Select Date Range
          </label>

          <button
            onClick={() => {
              setOpenDate(!openDate);
              setOpenDriver(false);
              setOpenRoute(false);
              setOpenDeparture(false);
            }}
            className='w-full px-4 py-3 bg-[#161B22] rounded-lg text-left text-gray-300 flex items-center justify-between hover:bg-[#1F2937] transition border border-cyan-500/30'
          >
            <span className='truncate'>{dateLabel}</span>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className={`w-5 h-5 text-cyan-400 transition-transform ${
                openDate ? "rotate-180" : ""
              }`}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>

          {openDate && (
            <div className='absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg p-3 space-y-2 z-50 shadow-xl'>
              {mode === "select" && (
                <>
                  <button
                    onClick={() => {
                      handleChange("dateType", "current");
                      handleChange("dateValue", "");
                      setOpenDate(false);
                    }}
                    className={`w-full py-2 text-sm rounded text-left px-3 transition ${
                      filters.dateType === "current"
                        ? "bg-[#1F2937] text-cyan-400 border border-cyan-500/30"
                        : "bg-[#161B22] hover:bg-[#1F2937] text-gray-200"
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <span>CURRENT (ALL DATA)</span>
                      {filters.dateType === "current" && (
                        <svg
                          className='w-4 h-4 text-cyan-400'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMode("daily");
                      handleChange("dateType", "daily");
                    }}
                    className={`w-full py-2 text-sm rounded text-left px-3 transition ${
                      filters.dateType === "daily"
                        ? "bg-[#1F2937] text-cyan-400 border border-cyan-500/30"
                        : "bg-[#161B22] hover:bg-[#1F2937] text-gray-200"
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <span>DAILY</span>
                      {filters.dateType === "daily" && (
                        <svg
                          className='w-4 h-4 text-cyan-400'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMode("weekly");
                      handleChange("dateType", "weekly");
                      // Reset selectedMonth dan weekSearch ketika masuk ke mode weekly
                      setSelectedMonth("");
                      setWeekSearch("");
                    }}
                    className={`w-full py-2 text-sm rounded text-left px-3 transition ${
                      filters.dateType === "weekly"
                        ? "bg-[#1F2937] text-cyan-400 border border-cyan-500/30"
                        : "bg-[#161B22] hover:bg-[#1F2937] text-gray-200"
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <span>WEEKLY</span>
                      {filters.dateType === "weekly" && (
                        <svg
                          className='w-4 h-4 text-cyan-400'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMode("monthly");
                      handleChange("dateType", "monthly");
                    }}
                    className={`w-full py-2 text-sm rounded text-left px-3 transition ${
                      filters.dateType === "monthly"
                        ? "bg-[#1F2937] text-cyan-400 border border-cyan-500/30"
                        : "bg-[#161B22] hover:bg-[#1F2937] text-gray-200"
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <span>MONTHLY</span>
                      {filters.dateType === "monthly" && (
                        <svg
                          className='w-4 h-4 text-cyan-400'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                </>
              )}

              {mode === "daily" && (
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 mb-2'>
                    <button
                      onClick={() => setMode("select")}
                      className='text-cyan-400 hover:text-cyan-300 text-sm flex items-center'
                    >
                      <svg
                        className='w-4 h-4 mr-1'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 19l-7-7 7-7'
                        />
                      </svg>
                      Back
                    </button>
                    <span className='text-sm text-gray-300'>Select Date</span>
                  </div>
                  <input
                    type='date'
                    value={filters.dateValue || ""}
                    onChange={(e) => {
                      handleChange("dateValue", e.target.value);
                      setMode("select");
                      setOpenDate(false);
                    }}
                    className='w-full px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded [&::-webkit-calendar-picker-indicator]:invert'
                  />
                </div>
              )}

              {mode === "monthly" && (
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 mb-2'>
                    <button
                      onClick={() => setMode("select")}
                      className='text-cyan-400 hover:text-cyan-300 text-sm flex items-center'
                    >
                      <svg
                        className='w-4 h-4 mr-1'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 19l-7-7 7-7'
                        />
                      </svg>
                      Back
                    </button>
                    <span className='text-sm text-gray-300'>Select Month</span>
                  </div>
                  <input
                    type='month'
                    value={filters.dateValue || ""}
                    onChange={(e) => {
                      handleChange("dateValue", e.target.value);
                      setMode("select");
                      setOpenDate(false);
                    }}
                    className='w-full px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded [&::-webkit-calendar-picker-indicator]:invert'
                  />
                </div>
              )}

              {mode === "weekly" && (
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 mb-2'>
                    <button
                      onClick={() => setMode("select")}
                      className='text-cyan-400 hover:text-cyan-300 text-sm flex items-center'
                    >
                      <svg
                        className='w-4 h-4 mr-1'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 19l-7-7 7-7'
                        />
                      </svg>
                      Back
                    </button>
                    <span className='text-sm text-gray-300'>Select Week</span>
                  </div>

                  <div>
                    <p className='text-xs text-gray-400 mb-2'>Select Month</p>
                    <input
                      type='month'
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        handleChange("dateValue", "");
                      }}
                      className='w-full px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded [&::-webkit-calendar-picker-indicator]:invert'
                    />
                  </div>

                  {selectedMonth && (
                    <div className='space-y-2'>
                      <input
                        type='text'
                        placeholder='Search week...'
                        value={weekSearch}
                        onChange={(e) => setWeekSearch(e.target.value)}
                        className='w-full px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded'
                      />

                      <div className='max-h-40 overflow-y-auto space-y-1'>
                        {weeks.map((week) => {
                          const weekNum = week.split(" ")[1]; // Extract "1" from "Week 1"
                          return (
                            <button
                              key={week}
                              onClick={() => {
                                handleChange(
                                  "dateValue",
                                  `${selectedMonth} Week ${weekNum}`
                                );
                                setMode("select");
                                setOpenDate(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm rounded transition ${
                                filters.dateValue ===
                                `${selectedMonth} Week ${weekNum}`
                                  ? "bg-[#1F2937] text-cyan-400 border border-cyan-500/30"
                                  : "hover:bg-[#1F2937] text-gray-200"
                              }`}
                            >
                              {week}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= DRIVER ================= */}
        <div className='relative'>
          <label className='block text-sm text-gray-400 mb-2'>Driver</label>
          <div className='relative'>
            <button
              onClick={() => {
                if (filterOptions.drivers.length === 0) return;
                setOpenDriver(!openDriver);
                setOpenRoute(false);
                setOpenDeparture(false);
                setOpenDate(false);
                if (openDriver) {
                  setSearchDriver("");
                }
              }}
              className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between transition ${
                loading
                  ? "bg-[#1F2937] text-gray-500 cursor-wait border border-gray-600"
                  : !filters.dateType || filters.dateType === "select"
                  ? "bg-[#1F2937] text-gray-500 cursor-not-allowed border border-gray-600"
                  : filterOptions.drivers.length === 0
                  ? "bg-[#1F2937] text-gray-500 cursor-not-allowed border border-gray-600"
                  : "bg-[#161B22] text-gray-300 hover:bg-[#1F2937] border border-cyan-500/30 hover:border-cyan-500/50"
              }`}
              disabled={
                loading ||
                !filters.dateType ||
                filters.dateType === "select" ||
                filterOptions.drivers.length === 0
              }
              title={
                !filters.dateType || filters.dateType === "select"
                  ? "Select date first"
                  : filterOptions.drivers.length === 0
                  ? "No drivers for selected date"
                  : ""
              }
            >
              <div className='flex items-center space-x-2 truncate'>
                {loading ? (
                  <div className='flex items-center'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2'></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <svg
                      className='w-4 h-4 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                      />
                    </svg>
                    <span className='truncate'>
                      {filters.driver ||
                        (filterOptions.drivers.length > 0
                          ? "Select Driver"
                          : "No drivers available")}
                    </span>
                  </>
                )}
              </div>
              {filterOptions.drivers.length > 0 &&
                !loading &&
                filters.dateType &&
                filters.dateType !== "select" && (
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className={`w-5 h-5 transition-transform ${
                      openDriver ? "rotate-180" : ""
                    } text-cyan-400`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                )}
            </button>

            {filterOptions.drivers.length > 0 &&
              !loading &&
              filters.dateType &&
              filters.dateType !== "select" && (
                <div className='absolute right-3 top-3 text-xs text-cyan-400'>
                  {filterOptions.drivers.length} available
                </div>
              )}
          </div>

          {openDriver && filterOptions.drivers.length > 0 && (
            <div className='absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50 shadow-xl'>
              <div className='p-2 border-b border-[#1F2A37]'>
                <div className='relative'>
                  <svg
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                  <input
                    type='text'
                    placeholder='Search driver...'
                    value={searchDriver}
                    onChange={(e) => setSearchDriver(e.target.value)}
                    className='w-full pl-9 pr-3 py-2 bg-[#161B22] text-gray-200 text-sm rounded border border-[#1F2A37] focus:border-cyan-500/50 focus:outline-none'
                    autoFocus
                  />
                </div>
              </div>
              <div className='max-h-60 overflow-y-auto'>
                {filteredDrivers.length > 0 ? (
                  filteredDrivers.map((driver) => (
                    <button
                      key={driver.id}
                      onClick={() => handleChange("driver", driver.name)}
                      className={`w-full text-left px-3 py-2 text-sm transition flex items-center justify-between ${
                        filters.driver === driver.name
                          ? "bg-[#1F2937] text-cyan-400"
                          : "hover:bg-[#1F2937] text-gray-200"
                      }`}
                    >
                      <div className='flex items-center space-x-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.driver === driver.name
                              ? "bg-cyan-400"
                              : "bg-gray-600"
                          }`}
                        ></div>
                        <span>{driver.name}</span>
                      </div>
                      {filters.driver === driver.name && (
                        <svg
                          className='w-4 h-4 text-cyan-400'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div className='px-3 py-4 text-gray-400 text-sm text-center'>
                    <svg
                      className='w-6 h-6 mx-auto mb-2 text-gray-500'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1}
                        d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    No drivers found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= ORIGIN ROUTE ================= */}
        <div className='relative'>
          <label className='block text-sm text-gray-400 mb-2'>
            Origin Route
          </label>
          <div className='relative'>
            <button
              onClick={() => {
                if (filterOptions.origins.length === 0 || !filters.driver)
                  return;
                setOpenRoute(!openRoute);
                setOpenDriver(false);
                setOpenDeparture(false);
                setOpenDate(false);
                if (openRoute) {
                  setSearchRoute("");
                }
              }}
              className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between transition ${
                loading
                  ? "bg-[#1F2937] text-gray-500 cursor-wait border border-gray-600"
                  : !filters.driver
                  ? "bg-[#1F2937] text-gray-500 cursor-not-allowed border border-gray-600"
                  : filterOptions.origins.length === 0
                  ? "bg-[#1F2937] text-gray-500 cursor-not-allowed border border-gray-600"
                  : "bg-[#161B22] text-gray-300 hover:bg-[#1F2937] border border-cyan-500/30 hover:border-cyan-500/50"
              }`}
              disabled={
                loading || !filters.driver || filterOptions.origins.length === 0
              }
              title={
                !filters.driver
                  ? "Select driver first"
                  : filterOptions.origins.length === 0
                  ? "No origins for selected driver"
                  : ""
              }
            >
              <div className='flex items-center space-x-2 truncate'>
                {loading ? (
                  <div className='flex items-center'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2'></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <svg
                      className='w-4 h-4 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                    <span className='truncate'>
                      {filters.route ||
                        (filterOptions.origins.length > 0
                          ? "Select Origin"
                          : "No origins available")}
                    </span>
                  </>
                )}
              </div>
              {filterOptions.origins.length > 0 &&
                !loading &&
                filters.driver && (
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className={`w-5 h-5 transition-transform ${
                      openRoute ? "rotate-180" : ""
                    } text-cyan-400`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                )}
            </button>

            {filterOptions.origins.length > 0 && !loading && filters.driver && (
              <div className='absolute right-3 top-3 text-xs text-cyan-400'>
                {filterOptions.origins.length} available
              </div>
            )}
          </div>

          {openRoute && filterOptions.origins.length > 0 && filters.driver && (
            <div className='absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50 shadow-xl'>
              <div className='p-2 border-b border-[#1F2A37]'>
                <div className='relative'>
                  <svg
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                  <input
                    type='text'
                    placeholder='Search origin...'
                    value={searchRoute}
                    onChange={(e) => setSearchRoute(e.target.value)}
                    className='w-full pl-9 pr-3 py-2 bg-[#161B22] text-gray-200 text-sm rounded border border-[#1F2A37] focus:border-cyan-500/50 focus:outline-none'
                    autoFocus
                  />
                </div>
              </div>
              <div className='max-h-60 overflow-y-auto'>
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((origin) => (
                    <button
                      key={origin.id}
                      onClick={() =>
                        handleChange("route", formatDisplayName(origin))
                      }
                      className={`w-full text-left px-3 py-2 text-sm transition flex items-center justify-between ${
                        filters.route === formatDisplayName(origin)
                          ? "bg-[#1F2937] text-cyan-400"
                          : "hover:bg-[#1F2937] text-gray-200"
                      }`}
                    >
                      <div className='flex items-center space-x-2'>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.route === formatDisplayName(origin)
                              ? "bg-cyan-400"
                              : "bg-gray-600"
                          }`}
                        ></div>
                        <span className='truncate'>
                          {formatDisplayName(origin)}
                        </span>
                      </div>
                      {filters.route === formatDisplayName(origin) && (
                        <svg
                          className='w-4 h-4 text-cyan-400'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div className='px-3 py-4 text-gray-400 text-sm text-center'>
                    <svg
                      className='w-6 h-6 mx-auto mb-2 text-gray-500'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1}
                        d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    No origins found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= DEPARTURE ================= */}
        <div className='relative'>
          <label className='block text-sm text-gray-400 mb-2'>
            Departure (Destination)
          </label>
          <div className='relative'>
            <button
              onClick={() => {
                if (
                  filterOptions.destinations.length === 0 ||
                  !filters.driver ||
                  !filters.route
                )
                  return;
                setOpenDeparture(!openDeparture);
                setOpenDriver(false);
                setOpenRoute(false);
                setOpenDate(false);
                if (openDeparture) {
                  setSearchDeparture("");
                }
              }}
              className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between transition ${
                loading
                  ? "bg-[#1F2937] text-gray-500 cursor-wait border border-gray-600"
                  : !filters.driver || !filters.route
                  ? "bg-[#1F2937] text-gray-500 cursor-not-allowed border border-gray-600"
                  : filterOptions.destinations.length === 0
                  ? "bg-[#1F2937] text-gray-500 cursor-not-allowed border border-gray-600"
                  : "bg-[#161B22] text-gray-300 hover:bg-[#1F2937] border border-cyan-500/30 hover:border-cyan-500/50"
              }`}
              disabled={
                loading ||
                !filters.driver ||
                !filters.route ||
                filterOptions.destinations.length === 0
              }
              title={
                !filters.driver
                  ? "Select driver first"
                  : !filters.route
                  ? "Select origin first"
                  : filterOptions.destinations.length === 0
                  ? "No departures for selected route"
                  : ""
              }
            >
              <div className='flex items-center space-x-2 truncate'>
                {loading ? (
                  <div className='flex items-center'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2'></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <svg
                      className='w-4 h-4 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                    <span className='truncate'>
                      {filters.departureRoute ||
                        (filterOptions.destinations.length > 0
                          ? "Select Departure"
                          : "No departures available")}
                    </span>
                  </>
                )}
              </div>
              {filterOptions.destinations.length > 0 &&
                !loading &&
                filters.driver &&
                filters.route && (
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className={`w-5 h-5 transition-transform ${
                      openDeparture ? "rotate-180" : ""
                    } text-cyan-400`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                )}
            </button>

            {filterOptions.destinations.length > 0 &&
              !loading &&
              filters.driver &&
              filters.route && (
                <div className='absolute right-3 top-3 text-xs text-cyan-400'>
                  {filterOptions.destinations.length} available
                </div>
              )}
          </div>

          {openDeparture &&
            filterOptions.destinations.length > 0 &&
            filters.driver &&
            filters.route && (
              <div className='absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50 shadow-xl'>
                <div className='p-2 border-b border-[#1F2A37]'>
                  <div className='relative'>
                    <svg
                      className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                    <input
                      type='text'
                      placeholder='Search departure...'
                      value={searchDeparture}
                      onChange={(e) => setSearchDeparture(e.target.value)}
                      className='w-full pl-9 pr-3 py-2 bg-[#161B22] text-gray-200 text-sm rounded border border-[#1F2A37] focus:border-cyan-500/50 focus:outline-none'
                      autoFocus
                    />
                  </div>
                </div>
                <div className='max-h-60 overflow-y-auto'>
                  {filteredDepartures.length > 0 ? (
                    filteredDepartures.map((destination) => (
                      <button
                        key={destination.id}
                        onClick={() =>
                          handleChange(
                            "departureRoute",
                            formatDisplayName(destination)
                          )
                        }
                        className={`w-full text-left px-3 py-2 text-sm transition flex items-center justify-between ${
                          filters.departureRoute ===
                          formatDisplayName(destination)
                            ? "bg-[#1F2937] text-cyan-400"
                            : "hover:bg-[#1F2937] text-gray-200"
                        }`}
                      >
                        <div className='flex items-center space-x-2'>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              filters.departureRoute ===
                              formatDisplayName(destination)
                                ? "bg-cyan-400"
                                : "bg-gray-600"
                            }`}
                          ></div>
                          <span className='truncate'>
                            {formatDisplayName(destination)}
                          </span>
                        </div>
                        {filters.departureRoute ===
                          formatDisplayName(destination) && (
                          <svg
                            className='w-4 h-4 text-cyan-400'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className='px-3 py-4 text-gray-400 text-sm text-center'>
                      <svg
                        className='w-6 h-6 mx-auto mb-2 text-gray-500'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1}
                          d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                      No departures found
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Filter status indicator */}
      <div className='mt-4 pt-4 border-t border-[#1F2A37]'>
        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center space-x-4'>
            <div
              className={`flex items-center space-x-2 ${
                filters.dateType && filters.dateType !== "select"
                  ? "text-cyan-400"
                  : "text-gray-500"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  filters.dateType && filters.dateType !== "select"
                    ? "bg-cyan-400"
                    : "bg-gray-600"
                }`}
              ></div>
              <span>
                Date:{" "}
                {filters.dateType && filters.dateType !== "select"
                  ? "Selected"
                  : "Not selected"}
              </span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                filters.driver ? "text-cyan-400" : "text-gray-500"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  filters.driver ? "bg-cyan-400" : "bg-gray-600"
                }`}
              ></div>
              <span>
                Driver: {filters.driver ? "Selected" : "Not selected"}
              </span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                filters.route ? "text-cyan-400" : "text-gray-500"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  filters.route ? "bg-cyan-400" : "bg-gray-600"
                }`}
              ></div>
              <span>Origin: {filters.route ? "Selected" : "Not selected"}</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                filters.departureRoute ? "text-cyan-400" : "text-gray-500"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  filters.departureRoute ? "bg-cyan-400" : "bg-gray-600"
                }`}
              ></div>
              <span>
                Departure:{" "}
                {filters.departureRoute ? "Selected" : "Not selected"}
              </span>
            </div>
          </div>
          {loading && (
            <div className='flex items-center text-cyan-400'>
              <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400 mr-2'></div>
              <span>Updating filters...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
