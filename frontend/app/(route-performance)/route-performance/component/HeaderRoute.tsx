"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeaderRoute() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-gradient-to-r from-[#0f1419] via-[#0a0e14] to-[#0f1419] border-b border-cyan-500/30 px-6 flex items-center justify-between relative z-40 shadow-lg">
      {/* Glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40" />

      {/* Page Title + Search */}
      <div className="flex items-center gap-6 flex-1">
        {/* Title */}
        <div>
          <h1 className="text-lg font-semibold text-gray-100">
            Route Performance
          </h1>
          <p className="text-xs text-gray-500">
            Analyze route efficiency & trends
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full group hidden md:block">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-400 transition"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search route, origin, destination..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-cyan-500/30 rounded-xl text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:shadow-cyan-500/20 transition"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-6">
        {/* Notification */}
        <button className="relative p-2.5 hover:bg-cyan-500/10 rounded-xl transition group">
          <svg
            className="w-6 h-6 text-gray-400 group-hover:text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-2 hover:bg-cyan-500/10 rounded-xl transition group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-cyan-500/30">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-200">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500">
                {session?.user?.role || "VIEWER"}
              </p>
            </div>

            <svg
              className={`w-4 h-4 text-gray-400 transition ${
                showProfileMenu ? "rotate-180" : ""
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

          {/* Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-[#0f1419] border border-cyan-500/30 rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-cyan-500/20">
                <p className="text-sm font-semibold text-gray-200">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {session?.user?.email}
                </p>
              </div>

              <button
                onClick={() => {
                  router.push("/profile");
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-cyan-500/10"
              >
                Profile
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
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
