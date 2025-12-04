"use client";

import { useState, useMemo } from "react";
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
  // ✅ STATIC DATA
  const [drivers] = useState<string[]>([
    "John Doe",
    "Jane Smith",
    "Bob Johnson",
  ]);

  const [routes] = useState<string[]>([
    "Jakarta",
    "Malang",
    "Surabaya",
    "Yogyakarta",
    "Bandung",
  ]);

  const [departures] = useState<string[]>([
    "Jakarta",
    "Malang",
    "Surabaya",
    "Yogyakarta",
    "Bandung",
  ]);

  // ✅ DROPDOWN STATE
  const [openDriver, setOpenDriver] = useState(false);
  const [openRoute, setOpenRoute] = useState(false);
  const [openDeparture, setOpenDeparture] = useState(false);
  const [openDate, setOpenDate] = useState(false);

  // ✅ SEARCH STATE (BARU)
  const [searchDriver, setSearchDriver] = useState("");
  const [searchRoute, setSearchRoute] = useState("");
  const [searchDeparture, setSearchDeparture] = useState("");

  // ✅ DATE MODE
  const [mode, setMode] = useState<"select" | "daily" | "weekly" | "monthly">(
    "select"
  );

  const [selectedMonth, setSelectedMonth] = useState("");
  const [weekSearch, setWeekSearch] = useState("");

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

  const weeks = useMemo(() => {
    const base = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    return base.filter((w) =>
      w.toLowerCase().includes(weekSearch.toLowerCase())
    );
  }, [weekSearch]);

  const dateLabel =
    filters.dateType === "current"
      ? "Current"
      : filters.dateValue || "Select Date";

  return (
    <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg p-6 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* ================= DATE (tetap semua logika) ================= */}
        <div className="relative z-50">
          <label className="block text-sm text-gray-400 mb-2">Date</label>

          {/* tombol Date dengan ikon kalender putih */}
          <button
            onClick={() => setOpenDate(!openDate)}
            className="w-full px-4 py-3 bg-[#161B22] rounded-lg text-left text-gray-300 flex items-center justify-between"
          >
            <span>{dateLabel}</span>

            {/* SVG kalender — warna putih */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          {openDate && (
            <div className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg p-3 space-y-2 z-50">

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
                    className="w-full py-2 text-xs rounded bg-[#161B22] hover:bg-[#1F2937] text-gray-200"
                  >
                    {type.toUpperCase()}
                  </button>
                ))}

              {/* daily - tetap ada */}
              {mode === "daily" && (
                <input
                  type="date"
                  onChange={(e) => {
                    handleChange("dateValue", e.target.value);
                    setMode("select");
                    setOpenDate(false);
                  }}
                  // Tailwind arbitrary to invert native calendar picker icon so it looks white in dark bg
                  className="w-full px-3 py-2 bg-[#0D1117] text-gray-200 rounded [&::-webkit-calendar-picker-indicator]:invert"
                />
              )}

              {/* monthly - tambahkan teks "Search Month" */}
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
                    className="w-full px-3 py-2 bg-[#0D1117] text-gray-200 rounded [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </>
              )}

              {/* weekly - tambahkan teks "Search Month" */}
              {mode === "weekly" && (
                <>
                  <p className="text-xs text-gray-400">Search Month</p>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full mb-2 px-3 py-2 bg-[#0D1117] text-gray-200 rounded [&::-webkit-calendar-picker-indicator]:invert"
                  />

                  <input
                    type="text"
                    placeholder="Search week..."
                    value={weekSearch}
                    onChange={(e) => setWeekSearch(e.target.value)}
                    className="w-full mb-2 px-3 py-2 bg-[#0D1117] text-gray-200 rounded"
                  />

                  {weeks.map((week) => (
                    <div
                      key={week}
                      onClick={() => {
                        handleChange(
                          "dateValue",
                          `${selectedMonth} ${week}`
                        );
                        setMode("select");
                        setOpenDate(false);
                      }}
                      className="px-3 py-2 text-xs cursor-pointer hover:bg-[#1F2937] rounded text-gray-200"
                    >
                      {week}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ================= DRIVER + SEARCH ================= */}
        <div className="relative z-40">
          <label className="block text-sm text-gray-400 mb-2">Driver</label>
          <button
            onClick={() => {
              setOpenDriver(!openDriver);
              setOpenRoute(false);
              setOpenDeparture(false);
              setOpenDate(false);
            }}
            className="w-full px-4 py-3 bg-[#161B22] rounded-lg text-left text-gray-300"
          >
            {filters.driver || "Select Driver"}
          </button>

          {openDriver && (
            <div className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50">
              <input
                type="text"
                placeholder="Search driver..."
                value={searchDriver}
                onChange={(e) => setSearchDriver(e.target.value)}
                className="w-full px-3 py-2 bg-[#161B22] text-gray-200 text-sm rounded-t"
              />

              {filteredDrivers.map((driver) => (
                <div
                  key={driver}
                  onClick={() => {
                    handleChange("driver", driver);
                    setOpenDriver(false);
                    setSearchDriver("");
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-[#1F2937] text-gray-200"
                >
                  {driver}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= ORIGIN + SEARCH ================= */}
        <div className="relative z-30">
          <label className="block text-sm text-gray-400 mb-2">Origin Route</label>
          <button
            onClick={() => {
              setOpenRoute(!openRoute);
              setOpenDriver(false);
              setOpenDeparture(false);
              setOpenDate(false);
            }}
            className="w-full px-4 py-3 bg-[#161B22] rounded-lg text-left text-gray-300"
          >
            {filters.route || "Select Route"}
          </button>

          {openRoute && (
            <div className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50">
              <input
                type="text"
                placeholder="Search route..."
                value={searchRoute}
                onChange={(e) => setSearchRoute(e.target.value)}
                className="w-full px-3 py-2 bg-[#161B22] text-gray-200 text-sm rounded-t"
              />

              {filteredRoutes.map((route) => (
                <div
                  key={route}
                  onClick={() => {
                    handleChange("route", route);
                    setOpenRoute(false);
                    setSearchRoute("");
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-[#1F2937] text-gray-200"
                >
                  {route}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= DEPARTURE + SEARCH ================= */}
        <div className="relative z-20">
          <label className="block text-sm text-gray-400 mb-2">Departure</label>
          <button
            onClick={() => {
              setOpenDeparture(!openDeparture);
              setOpenDriver(false);
              setOpenRoute(false);
              setOpenDate(false);
            }}
            className="w-full px-4 py-3 bg-[#161B22] rounded-lg text-left text-gray-300"
          >
            {filters.departure || "Select Departure"}
          </button>

          {openDeparture && (
            <div className="absolute mt-2 w-full bg-[#0D1117] border border-[#1F2A37] rounded-lg z-50">
              <input
                type="text"
                placeholder="Search departure..."
                value={searchDeparture}
                onChange={(e) => setSearchDeparture(e.target.value)}
                className="w-full px-3 py-2 bg-[#161B22] text-gray-200 text-sm rounded-t"
              />

              {filteredDepartures.map((departure) => (
                <div
                  key={departure}
                  onClick={() => {
                    handleChange("departure", departure);
                    setOpenDeparture(false);
                    setSearchDeparture("");
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-[#1F2937] text-gray-200"
                >
                  {departure}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
