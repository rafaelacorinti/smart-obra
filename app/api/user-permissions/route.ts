import { NextResponse } from "next/server";
import { getUserPermissions, updateUserPermissions } from "@/lib/mock-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email e obrigatorio" },
      { status: 400 }
    );
  }

  const modules = getUserPermissions(email);
  if (modules === undefined) {
    return NextResponse.json(
      { error: "Usuario nao encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ allowedModules: modules });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { email, allowedModules } = body;

    if (!email || !Array.isArray(allowedModules)) {
      return NextResponse.json(
        { error: "Email e allowedModules sao obrigatorios" },
        { status: 400 }
      );
    }

    const updated = updateUserPermissions(email, allowedModules);
    if (!updated) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Permissoes atualizadas com sucesso" });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar permissoes" },
      { status: 500 }
    );
  }
}
