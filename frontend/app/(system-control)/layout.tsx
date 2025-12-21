// frontend/app/(dashboard)/layout.tsx
"use client";

import { Sidebar } from "@/components/layout/Sidebar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Sidebar - Fixed & Scrollable */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content - Scrollable, NO PADDING HERE */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}