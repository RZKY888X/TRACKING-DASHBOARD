// components/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MapPin,
  Users,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  BarChart3,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface MenuItem {
  icon: any;
  label: string;
  href: string;
}

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: MapPin, label: "Vehicle Tracking", href: "/tracking" },
    { icon: Users, label: "User Management", href: "/users" },
    { icon: Activity, label: "Activity Logs", href: "/activity" },
    { icon: Activity, label: "Assignment", href: "/assignment" },
    { icon: BarChart3, label: "Reports", href: "/reports" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen z-50 w-56 bg-[#0d1421] border-r border-cyan-500/20
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}

          /* Desktop mode */
          lg:static lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">

          {/* Sidebar Header */}
          <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
            <h2 className="text-base font-bold text-cyan-400">Fleet Manager</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-cyan-400 transition-colors lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Info */}
          {session?.user && (
            <div className="p-4 border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                  {session.user.name?.charAt(0).toUpperCase() || "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {session.user.name || "Super Admin"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.user.email || "superadmin@example.com"}
                  </p>
                  <p className="text-xs text-cyan-400 font-medium mt-0.5">
                    {session.user.role || "SUPERADMIN"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Menu List */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-600/30">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-cyan-500/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all hover:text-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Background Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Toggle Button (Mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-30 p-2 bg-[#0d1421] border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-all text-gray-400 hover:text-cyan-400 lg:hidden"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}
