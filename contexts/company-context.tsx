"use client";

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import type { UserCompany, CompanyRole } from "@/types";

interface CompanyContextType {
  companyId: string;
  companyName: string;
  companySlug: string;
  companyRole: CompanyRole;
  isPlatformAdmin: boolean;
  companies: UserCompany[];
  hasMultipleCompanies: boolean;
  switchCompany: (companyId: string) => Promise<void>;
  isSwitching: boolean;
  canEdit: boolean;
  canManageUsers: boolean;
  canDeleteCompany: boolean;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { data: session, update } = useSession();
  const [isSwitching, setIsSwitching] = useState(false);

  const user = session?.user as any;
  const companyId = user?.companyId || "";
  const companyName = user?.companyName || "";
  const companySlug = user?.companySlug || "";
  const companyRole: CompanyRole = user?.companyRole || "member";
  const isPlatformAdmin = user?.isPlatformAdmin || false;
  const companies: UserCompany[] = user?.companies || [];

  const canEdit = companyRole === "owner" || companyRole === "admin" || companyRole === "manager" || isPlatformAdmin;
  const canManageUsers = companyRole === "owner" || companyRole === "admin" || isPlatformAdmin;
  const canDeleteCompany = companyRole === "owner" || isPlatformAdmin;

  const switchCompany = useCallback(async (newCompanyId: string) => {
    if (newCompanyId === companyId) return;
    setIsSwitching(true);
    try {
      await update({ companyId: newCompanyId });
      // Force page reload to refresh all data
      window.location.reload();
    } catch (err) {
      console.error("Erro ao trocar empresa:", err);
    } finally {
      setIsSwitching(false);
    }
  }, [companyId, update]);

  return (
    <CompanyContext.Provider
      value={{
        companyId,
        companyName,
        companySlug,
        companyRole,
        isPlatformAdmin,
        companies,
        hasMultipleCompanies: companies.length > 1,
        switchCompany,
        isSwitching,
        canEdit,
        canManageUsers,
        canDeleteCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
