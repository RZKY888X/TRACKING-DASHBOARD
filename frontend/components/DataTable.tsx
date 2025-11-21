"use client";

import { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { VehicleData } from "@/types";

interface DataTableProps {
  data: VehicleData[];
}

export default function DataTable({ data }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // =========================================================================
  // EXPORT TO EXCEL (ExcelJS)
  // =========================================================================
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Vehicle Report");

    // Header
    const header = ["Vehicle", "Driver", "Route", "Speed (km/h)", "Last Update"];
    sheet.addRow(header);

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F2A37" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF4B5563" } },
        left: { style: "thin", color: { argb: "FF4B5563" } },
        bottom: { style: "thin", color: { argb: "FF4B5563" } },
        right: { style: "thin", color: { argb: "FF4B5563" } },
      };
    });

    // Data rows
    data.forEach((row) => {
      const excelRow = [
        row.name ?? "—",
        row.driver ?? "—",
        row.route ?? "—",
        row.speed ?? 0,
        row.timestamp ? new Date(row.timestamp).toLocaleString() : "—",
      ];

      const added = sheet.addRow(excelRow);

      added.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF4B5563" } },
          left: { style: "thin", color: { argb: "FF4B5563" } },
          bottom: { style: "thin", color: { argb: "FF4B5563" } },
          right: { style: "thin", color: { argb: "FF4B5563" } },
        };
      });
    });

    // Auto column width
    sheet.columns.forEach((col) => {
      let maxLength = 15;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        if (val.length > maxLength) maxLength = val.length;
      });
      col.width = maxLength + 5;
    });

    // Download file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Vehicle_Report.xlsx");
  };

  return (
    <div className="bg-[#0D1117] border border-[#1F2A37] rounded-lg shadow-md">

      {/* HEADER */}
      <div className="p-4 md:p-6 border-b border-[#1F2A37] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Vehicle Table</h2>

        <button
          onClick={exportToExcel}
          className="px-3 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 rounded text-white transition"
        >
          Export to Excel
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-[#1F2A37] text-gray-200">
            <tr>
              {["Vehicle", "Driver", "Route", "Speed", "Last Update"].map(
                (head) => (
                  <th
                    key={head}
                    className="px-4 py-3 text-left text-sm font-semibold"
                  >
                    {head}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1F2A37]">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-400 text-sm"
                >
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#161B22] transition"
                >
                  <td className="px-4 py-3 text-sm text-gray-300">{row.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{row.driver}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{row.route}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {row.speed} km/h
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {row.timestamp
                      ? new Date(row.timestamp).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="p-4 border-t border-[#1F2A37] flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Page {currentPage} of {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-[#1F2A37] text-gray-200 rounded hover:bg-[#2A3441] disabled:opacity-40 text-sm"
          >
            ← Previous
          </button>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-[#1F2A37] text-gray-200 rounded hover:bg-[#2A3441] disabled:opacity-40 text-sm"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
