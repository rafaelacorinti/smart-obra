import { NextResponse } from "next/server";
import {
  approveServerAccessRequest,
  rejectServerAccessRequest,
  deleteServerAccessRequest,
} from "@/lib/mock-store";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, motivoRejeicao } = body;
    const { id } = params;

    if (status === "aprovado") {
      const result = approveServerAccessRequest(id);
      if (!result) {
        return NextResponse.json(
          { error: "Solicitacao nao encontrada" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        message: "Solicitacao aprovada. Usuario registrado para login.",
        request: result,
      });
    }

    if (status === "rejeitado") {
      const result = rejectServerAccessRequest(id, motivoRejeicao || "");
      if (!result) {
        return NextResponse.json(
          { error: "Solicitacao nao encontrada" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        message: "Solicitacao rejeitada",
        request: result,
      });
    }

    return NextResponse.json(
      { error: "Status invalido. Use 'aprovado' ou 'rejeitado'" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar solicitacao" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const deleted = deleteServerAccessRequest(params.id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Solicitacao nao encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "Solicitacao removida" });
}
