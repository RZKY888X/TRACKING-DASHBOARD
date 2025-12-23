import { ReactNode } from "react";
import HeaderRoute from "./route-performance/component/HeaderRoute";
import { Sidebar } from "@/components/layout/Sidebar";

export default function RoutePerformanceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* SIDEBAR */}
      <Sidebar />

      {/* RIGHT AREA */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* HEADER */}
        <HeaderRoute />

        {/* 🔑 SATU-SATUNYA SCROLL CONTAINER */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
