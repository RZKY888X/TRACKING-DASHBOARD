"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  jobRole?: string;
}

interface Origin {
  id: number;
  destination: string;
}

interface Departure {
  id: number;
  destination: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AssignmentPage() {
  const [vehicle, setVehicle] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [jobRole, setJobRole] = useState("");

  const [origin, setOrigin] = useState("");
  const [departure, setDeparture] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingOrigins, setLoadingOrigins] = useState(true);
  const [loadingDepartures, setLoadingDepartures] = useState(true);

  const [fetchError, setFetchError] = useState<string | null>(null);

  /* =============================
        FETCH USERS & ROUTES
  ============================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setFetchError("❌ Token tidak ditemukan, silakan login kembali");
      setLoadingUsers(false);
      setLoadingOrigins(false);
      setLoadingDepartures(false);
      return;
    }

    const fetchData = async () => {
      try {
        // FETCH USERS
        const usersRes = await fetch(`${API_URL}/api/assignment/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!usersRes.ok) throw new Error(`Users fetch error: ${usersRes.status}`);
        const usersData: User[] = await usersRes.json();
        setUsers(usersData);

        // FETCH ORIGINS
        const originsRes = await fetch(`${API_URL}/api/origins/public`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!originsRes.ok) throw new Error(`Origins fetch error: ${originsRes.status}`);
        const originsData: Origin[] = await originsRes.json();
        setOrigins(originsData);

        // FETCH DEPARTURES
        const departuresRes = await fetch(`${API_URL}/api/departures/public`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!departuresRes.ok) throw new Error(`Departures fetch error: ${departuresRes.status}`);
        const departuresData: Departure[] = await departuresRes.json();
        setDepartures(departuresData);
      } catch (err: any) {
        console.error(err);
        setFetchError(err.message || "❌ Gagal mengambil data");
      } finally {
        setLoadingUsers(false);
        setLoadingOrigins(false);
        setLoadingDepartures(false);
      }
    };

    fetchData();
  }, []);

  /* =============================
        RESET FORM
  ============================== */
  const resetForm = () => {
    setVehicle("");
    setFullName("");
    setEmail("");
    setJobRole("");
    setOrigin("");
    setDeparture("");
  };

  /* =============================
        SAVE ASSIGNMENT
  ============================== */
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("❌ Token tidak ditemukan, silakan login ulang");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: fullName || null,
          email: email || null,
          jobRole: jobRole || null,
          vehicle: vehicle || null,
          routeFrom: origin || null,
          routeTo: departure || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "❌ Gagal menyimpan assignment");
        return;
      }

      alert("✅ Assignment berhasil disimpan");
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert("❌ Terjadi kesalahan saat menyimpan assignment");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      {/* Header */}
      <div className="w-full bg-[#0F172A] border border-cyan-500/40 rounded-xl p-6 mb-8">
        <h1 className="text-3xl font-bold text-cyan-400">Assignment</h1>
        <p className="text-gray-400 mt-1">
          Manage vehicle route assignments and driver responsibilities.
        </p>
        {fetchError && <p className="text-red-500 mt-2">{fetchError}</p>}
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
              onChange={(e) => {
                const selectedName = e.target.value;
                setFullName(selectedName);

                const selectedUser = users.find((u) => u.name === selectedName);
                if (selectedUser) {
                  setEmail(selectedUser.email);
                  setJobRole(selectedUser.jobRole || "");
                }
              }}
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

          {/* Email */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={email}
              readOnly
            />
          </div>

          {/* Job Role */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Job Role</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={jobRole}
              readOnly
            />
          </div>

          {/* Vehicle */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Vehicle / Plat Nomor</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
            />
          </div>

          {/* Origin */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Route From (Origin)</label>
            <select
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              disabled={loadingOrigins}
            >
              <option value="">{loadingOrigins ? "Loading..." : "Pilih Origin"}</option>
              {origins.map((o) => (
                <option key={o.id} value={o.destination}>
                  {o.destination}
                </option>
              ))}
            </select>
          </div>

          {/* Departure */}
          <div>
            <label className="block mb-1 text-sm text-gray-300">Route To (Departure)</label>
            <select
              className="w-full px-4 py-2 bg-[#0D1117] border border-cyan-600/40 rounded-md text-gray-200"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              disabled={loadingDepartures}
            >
              <option value="">{loadingDepartures ? "Loading..." : "Pilih Destination"}</option>
              {departures.map((d) => (
                <option key={d.id} value={d.destination}>
                  {d.destination}
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
