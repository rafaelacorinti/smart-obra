"use client";

import { Menu, Moon, Sun, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { useSidebarStore } from "@/stores/use-sidebar-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState, useEffect, useRef } from "react";
import { NotificationsPanel } from "@/components/notifications-panel";
import { GlobalSearch } from "@/components/global-search";

export function Topbar() {
  const { toggle, isOpen, openMobile } = useSidebarStore();
  const { theme, setTheme } = useTheme();
  const { user } = useCurrentUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-[#1e293b]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              openMobile();
            } else {
              toggle();
            }
          }}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <GlobalSearch />

        <NotificationsPanel />

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-medium text-white">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.name || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role || ""}
              </p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b px-4 py-2 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                <User className="h-4 w-4" />
                Meu Perfil
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
