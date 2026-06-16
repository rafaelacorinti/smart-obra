"use client";

import { Sidebar } from "@/components/sidebar";
import { GlobalSearch } from "@/components/global-search";
import { Fab } from "@/components/fab";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-6">
          <div className="lg:hidden w-11" />
          <div className="flex-1 max-w-md mx-auto lg:mx-0">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-sm font-medium text-orange-700">U</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
      <Fab />
      <Toaster />
    </div>
  );
}