// app/(route-performance)/route-performance/page.tsx

import RouteStat from "./component/RouteStat";
import RouteDonut from "./component/RouteDonut";
import RouteChart from "./component/RouteChart";
import RouteTable from "./component/RouteTable";

export default function RoutePerformancePage() {
  return (
    <div className="space-y-6">
      {/* ===== ROUTE STATS (4 BOX ATAS) ===== */}
      <RouteStat />

      {/* ===== CHART (LEFT) & DONUT (RIGHT) ===== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RouteChart />
        <RouteDonut />
      </div>

      {/* ===== TABLE ===== */}
      <RouteTable />
    </div>
  );
}
