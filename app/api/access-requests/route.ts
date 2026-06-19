import { NextResponse } from "next/server";
import {
  getServerAccessRequests,
  addServerAccessRequest,
} from "@/lib/mock-store";

export async function GET() {
  const requests = getServerAccessRequests();
  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, senha, telefone, empresa, cargo, mensagem } = body;

    if (!nome || !email || !senha || !telefone || !empresa || !cargo) {
      return NextResponse.json(
        { error: "Todos os campos obrigatorios devem ser preenchidos" },
        { status: 400 }
      );
    }

    const newRequest = addServerAccessRequest({
      nome,
      email,
      senha,
      telefone,
      empresa,
      cargo,
      mensagem: mensagem || undefined,
    });

    return NextResponse.json(
      { message: "Solicitacao enviada com sucesso", request: newRequest },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar solicitacao" },
      { status: 500 }
    );
  }
}
