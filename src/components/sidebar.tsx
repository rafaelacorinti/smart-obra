"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  Calculator,
  FolderOpen,
  ShoppingCart,
  ClipboardList,
  Brain,
  LayoutDashboard,
  Menu,
  X,
  HardHat,
  BarChart3,
  Layers,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/obras", label: "Obras", icon: Building2 },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/despesas", label: "Despesas", icon: DollarSign },
  { href: "/orcado-realizado", label: "Orçado x Realizado", icon: BarChart3 },
  { href: "/centro-custos", label: "Centro de Custos", icon: Layers },
  { href: "/orcamentos", label: "Orçamentos", icon: Calculator },
  { href: "/documentos", label: "Documentos", icon: FolderOpen },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/os", label: "Ordens de Serviço", icon: ClipboardList },
  { href: "/ia", label: "Inteligência Artificial", icon: Brain },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-md border border-gray-200 lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600">
              <HardHat className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Smart Obra</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-orange-50 text-orange-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-orange-600" : "text-gray-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-400 text-center">Smart Obra v1.0</p>
        </div>
      </aside>
    </>
  );
}