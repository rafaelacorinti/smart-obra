import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { UserCompany } from "@/types";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais invalidas");
        }

        // Authenticate via Supabase Auth
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError || !authData.user) {
          throw new Error("Email ou senha incorretos");
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("user_profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Perfil de usuario nao encontrado");
        }

        if (!profile.active) {
          throw new Error("Usuario bloqueado ou inativo");
        }

        // Fetch user companies
        const { data: userCompanies, error: ucError } = await supabaseAdmin
          .from("user_companies")
          .select("company_id, role, status, companies(id, name, slug, status)")
          .eq("user_id", authData.user.id)
          .eq("status", "active");

        if (ucError) {
          console.error("Erro ao buscar empresas do usuario:", ucError);
        }

        const companies: UserCompany[] = (userCompanies || [])
          .filter((uc: any) => uc.companies?.status === "active")
          .map((uc: any) => ({
            companyId: uc.company_id,
            companyName: uc.companies?.name || "Sem nome",
            companySlug: uc.companies?.slug || "",
            role: uc.role,
            status: uc.status,
          }));

        // Select default company (first one, or fallback)
        const defaultCompany = companies[0] || {
          companyId: "00000000-0000-0000-0000-000000000001",
          companyName: "Empresa Principal",
          companySlug: "empresa-principal",
          role: "member",
          status: "active",
        };

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          companyId: defaultCompany.companyId,
          companyName: defaultCompany.companyName,
          companyRole: defaultCompany.role,
          companySlug: defaultCompany.companySlug,
          isPlatformAdmin: profile.is_platform_admin || false,
          allowedModules: profile.allowed_modules as string[] | undefined,
          companies,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
        token.companyRole = user.companyRole;
        token.companySlug = user.companySlug;
        token.isPlatformAdmin = user.isPlatformAdmin;
        token.allowedModules = user.allowedModules;
        token.companies = user.companies;
      }
      // Allow updating company via session update
      if (trigger === "update" && session?.companyId) {
        const company = (token.companies as UserCompany[])?.find(
          (c: UserCompany) => c.companyId === session.companyId
        );
        if (company) {
          token.companyId = company.companyId;
          token.companyName = company.companyName;
          token.companyRole = company.role;
          token.companySlug = company.companySlug;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.companyName = token.companyName;
        session.user.companyRole = token.companyRole;
        session.user.companySlug = token.companySlug;
        session.user.isPlatformAdmin = token.isPlatformAdmin;
        session.user.allowedModules = token.allowedModules;
        session.user.companies = token.companies;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "smart-obra-dev-secret-key-2024",
};
