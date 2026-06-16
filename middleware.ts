import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/configuracoes") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/obras/:path*",
    "/financeiro/:path*",
    "/ordens-servico/:path*",
    "/colaboradores/:path*",
    "/estoque/:path*",
    "/veiculos/:path*",
    "/clientes/:path*",
    "/relatorios/:path*",
    "/configuracoes/:path*",
  ],
};
