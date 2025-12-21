"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { HeaderDashboard } from "../(dashboard)/dashboard/components/HeaderDashboard";
import { HeaderDriver } from "./drivers/components/HeaderDriver";

export default function DriversLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderDriver />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
