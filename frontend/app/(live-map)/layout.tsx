import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import HeaderMap from "./live-map/component/HeaderMap";
export default function LiveMapLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B1220] text-white">
      {/* SIDEBAR */}
      <Sidebar />

      {/* RIGHT AREA */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* HEADER */}
        <HeaderMap />

        {/* CONTENT AREA (INI KUNCI HEIGHT) */}
        <div className="flex flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
