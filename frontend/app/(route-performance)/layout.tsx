import { ReactNode } from "react";
import HeaderRoute from "./route-performance/component/HeaderRoute";

export default function RoutePerformanceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-white flex flex-col">
      {/* Header */}
      <HeaderRoute />

      {/* Page Content */}
      <main className="flex-1 px-6 py-6 space-y-6">
        {children}
      </main>
    </div>
  );
}
