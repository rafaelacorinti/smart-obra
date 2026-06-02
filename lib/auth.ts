import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getRegisteredUsers } from "@/lib/mock-store";

// Mock users for development (no database required)
const MOCK_USERS = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@smartobra.com",
    password: "smart123",
    role: "ADMIN",
    companyId: "company-1",
    companyName: "Smart Obra Ltda",
    active: true,
  },
  {
    id: "2",
    name: "Carlos Financeiro",
    email: "financeiro@smartobra.com",
    password: "smart123",
    role: "FINANCEIRO",
    companyId: "company-1",
    companyName: "Smart Obra Ltda",
    active: true,
  },
  {
    id: "3",
    name: "Maria Gestora",
    email: "gestor@smartobra.com",
    password: "smart123",
    role: "GESTOR",
    companyId: "company-1",
    companyName: "Smart Obra Ltda",
    active: true,
  },
];

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

        // Check mock users first
        const mockUser = MOCK_USERS.find(
          (u) => u.email === credentials.email && u.active
        );

        if (mockUser) {
          if (mockUser.password !== credentials.password) {
            throw new Error("Senha incorreta");
          }
          return {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            companyId: mockUser.companyId,
            companyName: mockUser.companyName,
          };
        }

        // Check registered users (approved access requests)
        const registeredUsers = getRegisteredUsers();
        const regUser = registeredUsers.find(
          (u) => u.email === credentials.email && u.active
        );

        if (regUser) {
          if (regUser.password !== credentials.password) {
            throw new Error("Senha incorreta");
          }
          return {
            id: regUser.id,
            name: regUser.name,
            email: regUser.email,
            role: regUser.role,
            companyId: "company-1",
            companyName: regUser.companyName,
          };
        }

        throw new Error("Usuario nao encontrado ou inativo");
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
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
        (session.user as any).companyName = token.companyName;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "smart-obra-dev-secret-key-2024",
};
