"use client";

const routes = [
  {
    code: "RT-1001",
    name: "Jakarta - Bandung",
    planned: "4h 30m",
    actual: "4h 20m",
    status: "active",
  },
  {
    code: "RT-1042",
    name: "Bandung - Jogja",
    planned: "3h 00m",
    actual: "3h 05m",
    status: "active",
  },
  {
    code: "RT-2099",
    name: "Jakarta - Semarang",
    planned: "6h 00m",
    actual: "5h 50m",
    status: "active",
  },
];

export default function RouteTable() {
  return (
    <div className="rounded-xl border border-[#1F2A37] bg-gradient-to-b from-[#0F172A] to-[#0B1220] p-5">
      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-200">
          Route Performance Details
        </h3>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#1F2A37] text-left text-gray-400">
              <th className="py-3">Route Code</th>
              <th className="py-3">Route Name</th>
              <th className="py-3">Planned Dur.</th>
              <th className="py-3">Avg Actual Dur.</th>
              <th className="py-3 text-right">Status</th>
            </tr>
          </thead>

          <tbody>
            {routes.map((route, index) => (
              <tr
                key={index}
                className="border-b border-[#1F2A37] last:border-none hover:bg-white/5 transition"
              >
                <td className="py-3 font-medium text-gray-200">
                  {route.code}
                </td>

                <td className="py-3 text-gray-300">
                  {route.name}
                </td>

                <td className="py-3 text-gray-300">
                  {route.planned}
                </td>

                <td className="py-3 text-gray-300">
                  {route.actual}
                </td>

                <td className="py-3 text-right">
                  <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
