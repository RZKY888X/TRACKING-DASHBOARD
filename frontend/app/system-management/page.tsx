"use client";

import { useState } from "react";

export default function SystemManagementPage() {
  // ===================== TAB =====================
  const tabs = ["Route Origin", "Sefacture", "Job Role", "Vehicle"];
  const [activeTab, setActiveTab] = useState("Route Origin");

  // ===================== DATA STATE =====================
  const [routeOrigin, setRouteOrigin] = useState([
    { id: 1, name: "Jakarta" },
    { id: 2, name: "Bandung" },
  ]);

  const [sefacture, setSefacture] = useState([
    { id: 1, name: "Warehouse A" },
    { id: 2, name: "Warehouse B" },
  ]);

  const [jobRole, setJobRole] = useState([
    { id: 1, name: "Driver" },
    { id: 2, name: "Supervisor" },
  ]);

  const [vehicle, setVehicle] = useState([
    { id: 1, name: "B 1234 XYZ" },
    { id: 2, name: "D 9090 AAA" },
  ]);

  // ===================== INPUT FORM =====================
  const [input, setInput] = useState("");

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newItem = { id: Date.now(), name: input };

    if (activeTab === "Route Origin") setRouteOrigin([...routeOrigin, newItem]);
    if (activeTab === "Sefacture") setSefacture([...sefacture, newItem]);
    if (activeTab === "Job Role") setJobRole([...jobRole, newItem]);
    if (activeTab === "Vehicle") setVehicle([...vehicle, newItem]);

    setInput("");
  };

  // Ambil dataset berdasarkan TAB aktif
  const getData = () => {
    if (activeTab === "Route Origin") return routeOrigin;
    if (activeTab === "Sefacture") return sefacture;
    if (activeTab === "Job Role") return jobRole;
    if (activeTab === "Vehicle") return vehicle;
    return [];
  };

  const data = getData();

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-semibold">System Management</h1>
      <p className="text-white/60">Kelola semua data sistem dalam satu halaman.</p>

      {/* ===================== TABS ===================== */}
      <div className="flex gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                activeTab === tab
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-[#0D1B2A] text-gray-400 hover:bg-[#162335]"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ===================== GRID WRAPPER ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===================== TABLE SECTION ===================== */}
        <div className="col-span-2 bg-[#0D1B2A] border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-medium mb-4">{activeTab} Table</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#030E1C]">
                <th className="p-3 text-left">NAME</th>
                <th className="p-3 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item: any) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">
                    <button className="px-3 py-1 bg-yellow-600 rounded mr-2">
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-red-600 rounded">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===================== FORM SECTION ===================== */}
        <div className="bg-[#0D1B2A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Add New {activeTab}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeTab === "Vehicle" ? "Masukkan plat nomor" : `Nama ${activeTab}`
              }
              className="w-full p-3 rounded bg-[#0C1A2A] border border-white/10"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 bg-gray-600 rounded"
                onClick={() => setInput("")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
