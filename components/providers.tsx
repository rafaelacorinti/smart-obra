"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { CompanyProvider } from "@/contexts/company-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <CompanyProvider>
          {children}
        </CompanyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
