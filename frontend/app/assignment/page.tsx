"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
}

export default function AssignmentPage() {
  const [vehicle, setVehicle] = useState("");
  const [routeFrom, setRouteFrom] = useState("");
  const [routeTo, setRouteTo] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [jobRole, setJobRole] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  /* ===========================
     FETCH USERS & ROUTES
  ============================ */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/auth/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data: User[] = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchRoutes = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/routes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch routes");
        const data: string[] = await res.json();
        setRoutes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchUsers();
    fetchRoutes();
  }, []);

  /* ===========================
     RESET FORM
  ============================ */
  const resetForm = () => {
    setVehicle("");
    setRouteFrom("");
    setRouteTo("");
    setFullName("");
    setEmail("");
    setJobRole("");
  };

  /* ===========================
     SAVE ASSIGNMENT (dummy)
  ============================ */
  const handleSave = () => {
    if (!fullName || !email || !jobRole || !vehicle || !routeFrom || !routeTo) {
      alert("❌ Semua kolom harus diisi");
      return;
    }

    const assignmentData = { fullName, email, jobRole, vehicle, routeFrom, routeTo };
    console.log("📌 Assignment Saved:", assignmentData);
    alert("✅ Assignment berhasil disimpan (check console log)");
    resetForm();
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      {/* Header */}
      <div className="w-full bg-[#0F172A] border border-cyan-500/40 rounded-xl p-6 mb-8">
        <h1 className="text-3xl font-bold text-cyan-400">Assignment</h1>
        <p className="text-gray-400 mt-1">Manage vehicle route assignments and driver responsibilities.</p>
      </div>

      {/* Form */}
      <div className="w-full bg-[#0F172A] border border-cyan-500/40 rounded-xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nama Lengkap */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Nama Lengkap</label>
            <select
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loadingUsers}
            >
              <option value="">{loadingUsers ? "Loading..." : "Pilih Nama"}</option>
              {users.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Email (dummy input) */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Job Role (dummy dropdown) */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Job Role</label>
            <select
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            >
              <option value="">Pilih Role</option>
              <option value="Driver">Driver</option>
              <option value="Helper">Helper</option>
              <option value="Supervisor">Supervisor</option>
            </select>
          </div>

          {/* Vehicle (dummy input) */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Vehicle / Plat Nomor</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
            />
          </div>

          {/* Route From */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Route From</label>
            <select
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={routeFrom}
              onChange={(e) => setRouteFrom(e.target.value)}
              disabled={loadingRoutes}
            >
              <option value="">{loadingRoutes ? "Loading..." : "Pilih Origin"}</option>
              {routes.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Route To */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Route To</label>
            <select
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={routeTo}
              onChange={(e) => setRouteTo(e.target.value)}
              disabled={loadingRoutes}
            >
              <option value="">{loadingRoutes ? "Loading..." : "Pilih Destination"}</option>
              {routes.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-semibold"
          >
            Simpan Assignment
          </button>

          <button
            onClick={resetForm}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 font-semibold"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
