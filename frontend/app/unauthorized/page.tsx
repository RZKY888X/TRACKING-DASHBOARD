"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-2">
          You don&apos;t have permission to access this page.
        </p>
        {session && (
          <p className="text-slate-500 text-sm mb-6">
            Your role: <span className="text-cyan-400 font-semibold">{session.user.role}</span>
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
          >
            Go Back Home
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
