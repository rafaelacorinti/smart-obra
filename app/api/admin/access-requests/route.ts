import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessRequests } from "@/lib/mock-store";

export async function GET() {
  const session: any = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
  }

  const requests = getAccessRequests();
  return NextResponse.json(requests);
}
