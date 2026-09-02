import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      companyId: string;
      companyName: string;
      allowedModules?: string[];
      companyRole?: string;
      companySlug?: string;
      isPlatformAdmin?: boolean;
      companies?: any[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    companyId: string;
    companyName: string;
    allowedModules?: string[];
    companyRole?: string;
    companySlug?: string;
    isPlatformAdmin?: boolean;
    companies?: any[];
  }
}
