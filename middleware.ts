import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const pathname = req.nextUrl.pathname;

    // Platform admin routes
    if (
      (pathname.startsWith("/configuracoes/empresas") || pathname.startsWith("/configuracoes/usuarios")) &&
      !token?.isPlatformAdmin
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Admin routes (configuracoes)
    if (pathname.startsWith("/configuracoes") && token?.role !== "ADMIN" && !token?.isPlatformAdmin) {
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
    "/relatorios-pdf/:path*",
    "/orcamentos/:path*",
    "/orcado-realizado/:path*",
    "/centro-custos/:path*",
    "/compras/:path*",
    "/cronograma/:path*",
    "/diario-obra/:path*",
    "/documentos/:path*",
    "/galeria/:path*",
    "/configuracoes/:path*",
  ],
};
