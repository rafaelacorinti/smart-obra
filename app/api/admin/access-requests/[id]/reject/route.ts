import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .update({
        status: "rejeitado",
        data_resposta: new Date().toISOString(),
      } as any)
      .eq("id", params.id)
      .select()
      .single() as any;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}