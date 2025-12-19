"use client";

import TableList from "@/components/TableList";

export default function DashboardTableSection() {
  const columns = [
    "Plate",
    "Driver",
    "Route",
    "Status",
    "Speed",
    "Last Update",
  ];

  const data = [
    {
      plate: "B 1234 CD",
      driver: "Andi",
      route: "Jakarta - Bandung",
      status: "On Trip",
      speed: "62 km/h",
      updated: "10:21",
    },
  ];

  return (
    <div className="bg-[#0C1A2A] border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">
          Trip & Vehicle Data
        </h2>

        <button className="text-sm px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white">
          Download
        </button>
      </div>

      <TableList columns={columns} data={data} />
    </div>
  );
}
