import { NextResponse } from "next/server";
import { registerUser } from "@/lib/mock-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, companyName } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha sao obrigatorios" },
        { status: 400 }
      );
    }

    const user = registerUser({
      name,
      email,
      password,
      companyName: companyName || "",
    });

    return NextResponse.json(
      { message: "Usuario registrado com sucesso", user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao registrar usuario" },
      { status: 500 }
    );
  }
}
