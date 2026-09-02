"use client";

import { useState } from "react";
import { Building2, ChevronDown, Check, Loader2 } from "lucide-react";
import { useCompany } from "@/contexts/company-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CompanySwitcher() {
  const {
    companyId,
    companyName,
    companySlug,
    companies,
    hasMultipleCompanies,
    switchCompany,
    isSwitching,
  } = useCompany();

  const [open, setOpen] = useState(false);

  if (companies.length === 0) {
    return null;
  }

  const displayName = companyName || "Empresa";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg border border-transparent px-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700",
            isSwitching && "pointer-events-none opacity-70"
          )}
          aria-label="Trocar empresa"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            {initial}
          </div>
          <div className="hidden max-w-[140px] flex-col leading-tight md:flex">
            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
              {displayName}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {companySlug}
            </span>
          </div>
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : hasMultipleCompanies ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      {hasMultipleCompanies && (
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Building2 className="h-3.5 w-3.5" />
            Trocar empresa
          </div>
          <DropdownMenuSeparator />
          {companies.map((company) => {
            const isActive = company.companyId === companyId;
            return (
              <DropdownMenuItem
                key={company.companyId}
                className="flex cursor-pointer items-center justify-between"
                onClick={() => {
                  if (isActive || isSwitching) return;
                  void switchCompany(company.companyId);
                  setOpen(false);
                }}
                disabled={isSwitching}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{company.companyName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {company.companySlug}
                  </span>
                </div>
                {isActive && <Check className="h-4 w-4 text-indigo-600" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

