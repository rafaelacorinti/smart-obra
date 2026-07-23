"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { AccessDenied } from "@/components/access-denied";

interface ModuleGuardProps {
  moduleId: string;
  moduleName: string;
  children: React.ReactNode;
}

export function ModuleGuard({ moduleId, moduleName, children }: ModuleGuardProps) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return null;
  }

  // Admin always has full access
  if (user?.email === "admin@smartobra.com" || user?.role === "ADMIN") {
    return <>{children}</>;
  }

  // Users without allowedModules have full access (mock users / legacy)
  if (!user?.allowedModules) {
    return <>{children}</>;
  }

  // Check permission
  if (!user.allowedModules.includes(moduleId)) {
    return <AccessDenied moduleName={moduleName} />;
  }

  return <>{children}</>;
}
