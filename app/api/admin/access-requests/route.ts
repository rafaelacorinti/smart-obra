import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .order("data_solicitacao", { ascending: false });

    if (error) throw error;

    // Map DB columns to frontend-expected format
    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      name: r.nome,
      email: r.email,
      phone: r.telefone || "",
      companyName: r.empresa || "",
      cnpj: "",
      status: r.status === "pendente" ? "PENDING" : r.status === "aprovado" ? "APPROVED" : "REJECTED",
      createdAt: r.data_solicitacao,
      cargo: r.cargo || "",
      mensagem: r.mensagem || "",
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
