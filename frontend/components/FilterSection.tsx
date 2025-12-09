"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Filters } from "@/types";

interface FilterSectionProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FilterSection({
  filters,
  onFilterChange,
}: FilterSectionProps) {
  const { data: session } = useSession();
  
  // ✅ DYNAMIC DATA FROM API
  const [drivers, setDrivers] = useState<string[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [departures, setDepartures] = useState<string[]>([]);
  const [loading, setLoading] = useState({
    drivers: true,
    routes: true,
    departures: true
  });

  // ✅ DROPDOWN STATE
  const [openDriver, setOpenDriver] = useState(false);
  const [openRoute, setOpenRoute] = useState(false);
  const [openDeparture, setOpenDeparture] = useState(false);
  const [openDate, setOpenDate] = useState(false);

  // ✅ SEARCH STATE
  const [searchDriver, setSearchDriver] = useState("");
  const [searchRoute, setSearchRoute] = useState("");
  const [searchDeparture, setSearchDeparture] = useState("");

  // ✅ DATE MODE
  const [mode, setMode] = useState<"select" | "daily" | "weekly" | "monthly">(
    "select"
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const [weekSearch, setWeekSearch] = useState("");

  // ✅ FETCH DRIVERS FROM API
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!session?.accessToken) return;
      
      try {
        const res = await fetch(`${API_URL}/api/filters/drivers`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setDrivers(data);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setLoading(prev => ({ ...prev, drivers: false }));
      }
    };

    fetchDrivers();
  }, [session]);

  // ✅ FETCH ROUTES (ORIGINS) FROM API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        // Mengambil dari origins/public untuk dropdown Origin Route
        const res = await fetch(`${API_URL}/api/origins/public`);
        
        if (res.ok) {
          const data = await res.json();
          setRoutes(data.map((item: { destination: string }) => item.destination));
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(prev => ({ ...prev, routes: false }));
      }
    };

    fetchRoutes();
  }, []);

  // ✅ FETCH DEPARTURES FROM API
  useEffect(() => {
    const fetchDepartures = async () => {
      try {
        // Mengambil dari departures/public untuk dropdown Departure
        const res = await fetch(`${API_URL}/api/departures/public`);
        
        if (res.ok) {
          const data = await res.json();
          setDepartures(data.map((item: { destination: string }) => item.destination));
        }
      } catch (error) {
        console.error("Error fetching departures:", error);
      } finally {
        setLoading(prev => ({ ...prev, departures: false }));
      }
    };

    fetchDepartures();
  }, []);

  const handleChange = <K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  // ✅ PREVENT SAME ROUTE & DEPARTURE + SEARCH FILTER
  const filteredRoutes = routes
    .filter((route) => route !== filters.departure)
    .filter((route) =>
      route.toLowerCase().includes(searchRoute.toLowerCase())
    );

  const filteredDepartures = departures
    .filter((departure) => departure !== filters.route)
    .filter((departure) =>
      departure.toLowerCase().includes(searchDeparture.toLowerCase())
    );

  const filteredDrivers = drivers.filter((driver) =>
    driver.toLowerCase().includes(searchDriver.toLowerCase())
  );

  const weeks = [
    "Week 1", "Week 2", "Week 3", "Week 4", "Week 5"
  ].filter((week) =>
    week.toLowerCase().includes(weekSearch.toLowerCase())
  );

  const dateLabel =
    filters.dateType === "current"
      ? "Current"
      : filters.dateValue || "Select Date";

  // Loading states
  if (loading.drivers || loading.routes || loading.departures) {
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
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          {openDate && (
            <div className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg p-3 space-y-2 z-50 shadow-xl">
              {mode === "select" &&
                ["current", "daily", "weekly", "monthly"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (type === "current") {
                        handleChange("dateType", "current");
                        handleChange("dateValue", "Current");
                        setOpenDate(false);
                      } else {
                        setMode(type as any);
                        handleChange("dateType", type as any);
                      }
                    }}
                    className="w-full py-2 text-xs rounded bg-[#161B22] hover:bg-[#1F2937] text-gray-200 transition"
                  >
                    {type.toUpperCase()}
                  </button>
                ))}

              {mode === "daily" && (
                <input
                  type="date"
                  onChange={(e) => {
                    handleChange("dateValue", e.target.value);
                    setMode("select");
                    setOpenDate(false);
                  }}
                  className="w-full px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded [&::-webkit-calendar-picker-indicator]:invert"
                />
              )}

              {mode === "monthly" && (
                <>
                  <p className="text-xs text-gray-400">Search Month</p>
                  <input
                    type="month"
                    onChange={(e) => {
                      handleChange("dateValue", e.target.value);
                      setMode("select");
                      setOpenDate(false);
                    }}
                    className="w-full px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </>
              )}

              {mode === "weekly" && (
                <>
                  <p className="text-xs text-gray-400">Search Month</p>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full mb-2 px-3 py-2 bg-[#0D1117] text-gray-200 border border-[#1F2A37] rounded [&::-webkit-calendar-picker-indicator]:invert"
                  />

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
                        className="px-3 py-2 text-xs cursor-pointer hover:bg-[#1F2937] rounded text-gray-200"
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

        {/* ================= DRIVER ================= */}
        <div className="relative z-40">
          <label className="block text-sm text-gray-400 mb-2">Driver</label>
          <button
            onClick={() => {
              setOpenDriver(!openDriver);
              setOpenRoute(false);
              setOpenDeparture(false);
              setOpenDate(false);
            }}
            className="w-full px-4 py-3 bg-[#161B22] rounded-lg text-left text-gray-300 hover:bg-[#1F2937] transition"
          >
            {filters.driver || "Select Driver"}
          </button>

          {openDriver && (
            <div className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50 shadow-xl">
              <input
                type="text"
                placeholder="Search driver..."
                value={searchDriver}
                onChange={(e) => setSearchDriver(e.target.value)}
                className="w-full px-3 py-2 bg-[#161B22] text-gray-200 text-sm border-b border-[#1F2A37]"
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
                      className="px-3 py-2 cursor-pointer hover:bg-[#1F2937] text-gray-200 text-sm"
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
            }}
            className="w-full px-4 py-3 bg-[#161B22] rounded-lg text-left text-gray-300 hover:bg-[#1F2937] transition"
          >
            {filters.route || "Select Origin"}
          </button>

          {openRoute && (
            <div className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50 shadow-xl">
              <input
                type="text"
                placeholder="Search origin..."
                value={searchRoute}
                onChange={(e) => setSearchRoute(e.target.value)}
                className="w-full px-3 py-2 bg-[#161B22] text-gray-200 text-sm border-b border-[#1F2A37]"
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
                      className="px-3 py-2 cursor-pointer hover:bg-[#1F2937] text-gray-200 text-sm"
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
            }}
            className="w-full px-4 py-3 bg-[#161B22] rounded-lg text-left text-gray-300 hover:bg-[#1F2937] transition"
          >
            {filters.departure || "Select Departure"}
          </button>

          {openDeparture && (
            <div className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50 shadow-xl">
              <input
                type="text"
                placeholder="Search departure..."
                value={searchDeparture}
                onChange={(e) => setSearchDeparture(e.target.value)}
                className="w-full px-3 py-2 bg-[#161B22] text-gray-200 text-sm border-b border-[#1F2A37]"
              />
              <div className="max-h-60 overflow-y-auto">
                {filteredDepartures.length > 0 ? (
                  filteredDepartures.map((departure) => (
                    <div
                      key={departure}
                      onClick={() => {
                        handleChange("departure", departure);
                        setOpenDeparture(false);
                        setSearchDeparture("");
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-[#1F2937] text-gray-200 text-sm"
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