"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useSidebarStore } from "@/stores/use-sidebar-store";
import { cn } from "@/lib/utils";
import AIAssistant from "@/components/ai-assistant";
import { QuickActionsFab } from "@/components/quick-actions-fab";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebarStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          "md:ml-16",
          isOpen && "md:ml-64"
        )}
      >
        <Topbar />
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <AIAssistant />
      <QuickActionsFab />
    </div>
  );
}
