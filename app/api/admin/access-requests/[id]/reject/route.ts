import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rejectAccessRequest } from "@/lib/mock-store";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session: any = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
  }

  const result = rejectAccessRequest(params.id);

  if (!result) {
    return NextResponse.json(
      { error: "Solicitacao nao encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "Solicitacao rejeitada", request: result });
}
