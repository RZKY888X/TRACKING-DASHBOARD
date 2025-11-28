"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ✅ PAGE YANG TIDAK BOLEH ADA SIDEBAR
  const hideSidebarRoutes = ["/login"];

  const shouldHideSidebar = hideSidebarRoutes.includes(pathname);

  return (
    <html lang="en">
      <body>
        <Providers>
          {shouldHideSidebar ? (
            // ✅ MODE TANPA SIDEBAR (LOGIN)
            <>{children}</>
          ) : (
            // ✅ MODE DENGAN SIDEBAR (SEMUA PAGE LAIN)
            <div className="flex min-h-screen bg-[#0a0e1a] text-gray-200">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-4">{children}</main>
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
