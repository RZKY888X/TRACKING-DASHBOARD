// frontend/components/UserProfile.tsx
"use client";

import { useSession, signOut } from "next-auth/react";

export function UserProfile() {
  const { data: session } = useSession();

  if (!session) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "ADMIN":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "USER":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-green-500/20 text-green-400 border-green-500/50";
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
        {session.user.name?.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1">
        <p className="text-white font-medium">{session.user.name}</p>
        <p className="text-slate-400 text-sm">{session.user.email}</p>
      </div>

      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(session.user.role)}`}>
        {session.user.role}
      </span>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
        title="Logout"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}