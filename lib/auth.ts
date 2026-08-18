import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

        // Fetch user profile from user_profiles table
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

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          companyId: "company-1",
          companyName: profile.company_name || "Smart Obra",
          allowedModules: profile.allowed_modules as string[] | undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
        token.companyName = (user as any).companyName;
        token.allowedModules = (user as any).allowedModules;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
        (session.user as any).companyName = token.companyName;
        (session.user as any).allowedModules = token.allowedModules;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "smart-obra-dev-secret-key-2024",
};
