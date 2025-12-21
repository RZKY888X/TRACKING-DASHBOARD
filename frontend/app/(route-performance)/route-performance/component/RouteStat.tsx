import { Map, Truck, Clock, AlertTriangle } from "lucide-react";

export default function RouteStat() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* ================= TOTAL ROUTES ================= */}
      <div className="rounded-xl border border-[#1F2A37] bg-gradient-to-b from-[#0F172A] to-[#0B1220] p-5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Total Routes
          </p>

          <div className="rounded-lg bg-[#111827] p-2 text-gray-400">
            <Map size={18} />
          </div>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <h2 className="text-3xl font-bold text-white">42</h2>
          <span className="text-xs text-emerald-400">↑ 2 new</span>
        </div>
      </div>

      {/* ================= ACTIVE ROUTES ================= */}
      <div className="rounded-xl border border-[#1F2A37] bg-gradient-to-b from-[#0F172A] to-[#0B1220] p-5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Active Routes
          </p>

          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              LIVE
            </span>
            <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
              <Truck size={18} />
            </div>
          </div>
        </div>

        <h2 className="mt-4 text-3xl font-bold text-white">18</h2>

        <div className="mt-4 h-1.5 w-full rounded-full bg-[#1F2937]">
          <div className="h-1.5 w-[60%] rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* ================= AVG PLAN VS ACTUAL ================= */}
      <div className="rounded-xl border border-[#1F2A37] bg-gradient-to-b from-[#0F172A] to-[#0B1220] p-5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Avg Plan vs Actual
          </p>

          <div className="rounded-lg bg-blue-500/15 p-2 text-blue-400">
            <Clock size={18} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-semibold text-white">4h 15m</span>
          <span className="text-gray-500">vs</span>
          <span className="font-semibold text-white">4h 32m</span>
        </div>

        <p className="mt-2 text-xs text-yellow-400">
          ↗ +6.6% deviation
        </p>
      </div>

      {/* ================= FREQ. DELAYED ================= */}
      <div className="rounded-xl border border-[#1F2A37] bg-gradient-to-b from-[#0F172A] to-[#0B1220] p-5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">
            Freq. Delayed
          </p>

          <div className="rounded-lg bg-red-500/15 p-2 text-red-400">
            <AlertTriangle size={18} />
          </div>
        </div>

        <h2 className="mt-4 text-3xl font-bold text-red-500">
          5 Routes
        </h2>

        <p className="mt-2 text-xs text-gray-500">
          Requires scheduling review.
        </p>
      </div>
    </div>
  );
}
