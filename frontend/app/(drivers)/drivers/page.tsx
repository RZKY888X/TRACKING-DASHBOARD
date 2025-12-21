import StatsCards from "./components/StatsCard";
import TopDriversBarChart from "./components/TopDriversBarChart";
import PerformanceDonutChart from "./components/PeformanceDonutChart";
import FilterSection from "./components/FilterSection";
import DriverActivityTable from "./components/DriverActivityTable";

export default function DriversPage() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-gradient-to-b from-[#0f1419] via-[#161B22] to-[#0f1419]">
      {/* Header */}
      <div className="relative mb-4 sm:mb-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Driver Activity & Insights</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-green-400">Live</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-gray-400 text-sm">Source: Real-time Telemetry • Last updated: Just now</p>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <span className="text-gray-400">Real-time Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards />
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <TopDriversBarChart />
        </div>
        <div className="lg:col-span-1">
          <PerformanceDonutChart />
        </div>
      </div>

      {/* Filter Section - DI BAWAH semua konten */}
      <FilterSection />

      {/* Detailed Driver Activity Table */}
      <DriverActivityTable />

      {/* Bottom subtle gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/5 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
}