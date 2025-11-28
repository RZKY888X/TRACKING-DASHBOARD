// frontend/components/ProtectedPage.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredRole?: "VIEWER" | "USER" | "ADMIN" | "SUPERADMIN";
}

export function ProtectedPage({ children, requiredRole }: ProtectedPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (requiredRole) {
      const roleHierarchy = ["VIEWER", "USER", "ADMIN", "SUPERADMIN"];
      const userRoleIndex = roleHierarchy.indexOf(session.user.role);
      const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

      if (userRoleIndex < requiredRoleIndex) {
        router.push("/unauthorized");
      }
    }
  }, [session, status, requiredRole, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050812]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}