import { NextResponse } from "next/server";
import { addAccessRequest } from "@/lib/mock-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, companyName, cnpj } = body;

    if (!name || !email || !phone || !companyName || !cnpj) {
      return NextResponse.json(
        { error: "Todos os campos sao obrigatorios" },
        { status: 400 }
      );
    }

    const newRequest = addAccessRequest({ name, email, phone, companyName, cnpj });

    return NextResponse.json(
      { message: "Solicitacao enviada com sucesso", request: newRequest },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao processar solicitacao" },
      { status: 500 }
    );
  }
}
