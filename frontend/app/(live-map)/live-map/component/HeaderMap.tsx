"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeaderMap() {
  const { data: session } = useSession();
  const router = useRouter();
  const [openProfile, setOpenProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdown when click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-[#0f1419] border-b border-cyan-500/20 z-40">
      {/* LEFT */}
      <div>
        <h1 className="text-lg font-semibold text-white">
          Live Vehicle Map
        </h1>
        <p className="text-xs text-gray-400">
          Real-time vehicle tracking & status
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {/* Refresh */}
        <button
          className="p-2 rounded-lg hover:bg-cyan-500/10 transition"
          title="Refresh map"
        >
          <svg
            className="w-5 h-5 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0014-7M19 5a9 9 0 00-14 7"
            />
          </svg>
        </button>

        {/* PROFILE */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpenProfile(!openProfile)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-cyan-500/10 transition"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-200">
                {session?.user?.name ?? "User"}
              </p>
              <p className="text-xs text-gray-500">
                {session?.user?.role ?? "OPERATOR"}
              </p>
            </div>

            <svg
              className={`w-4 h-4 text-gray-400 transition ${
                openProfile ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {openProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0f1419] border border-cyan-500/20 rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-cyan-500/20">
                <p className="text-sm font-semibold text-white">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {session?.user?.email}
                </p>
              </div>

              <button
                onClick={() => {
                  router.push("/profile");
                  setOpenProfile(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10"
              >
                Profile
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
