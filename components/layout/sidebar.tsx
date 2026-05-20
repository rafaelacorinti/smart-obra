"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  ClipboardList,
  Users,
  Package,
  Truck,
  UserCircle,
  BarChart3,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/use-sidebar-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useEffect } from "react";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/obras", label: "Obras", icon: Building2 },
  { href: "/orcamentos", label: "Orcamentos", icon: Calculator },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/ordens-servico", label: "Ordens de Servico", icon: ClipboardList },
  { href: "/colaboradores", label: "Colaboradores", icon: Users },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/veiculos", label: "Veiculos", icon: Truck },
  { href: "/clientes", label: "Clientes", icon: UserCircle },
  { href: "/relatorios", label: "Relatorios", icon: BarChart3 },
];

const adminItems = [
  { href: "/configuracoes", label: "Configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobileOpen, toggle, closeMobile, setOpen } = useSidebarStore();
  const { user } = useCurrentUser();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setOpen(false);
      } else if (window.innerWidth < 1024) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setOpen]);

  const allItems = user?.role === "ADMIN" ? [...menuItems, ...adminItems] : menuItems;

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <Image src="/logo.svg" alt="Smart Obra" width={150} height={36} className="h-9 w-auto" priority />
          ) : (
            <Image src="/logo-icon.svg" alt="Smart Obra" width={36} height={36} className="h-9 w-9" priority />
          )}
        </div>
        <button
          onClick={closeMobile}
          className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-2 overflow-y-auto">
        {allItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600/80 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-white")} />
              {isOpen && <span className="ml-3 truncate">{item.label}</span>}
              {!isOpen && (
                <span className="invisible absolute left-full ml-2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          onClick={toggle}
          className="hidden w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white md:flex"
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b] transition-all duration-300 md:flex",
          isOpen ? "w-64" : "w-16"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
          />
          <aside className="relative flex h-screen w-64 flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}


