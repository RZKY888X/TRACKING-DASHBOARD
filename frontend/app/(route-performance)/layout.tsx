import { ReactNode } from "react";
import HeaderRoute from "./route-performance/component/HeaderRoute";
import { Sidebar } from "@/components/layout/Sidebar";

export default function RoutePerformanceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      <Sidebar />
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <HeaderRoute />

        {/* Page Content */}
        <main className='flex-1 px-6 py-6 space-y-6'>{children}</main>
      </div>
    </div>
  );
}
