import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .order("data_solicitacao", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, telefone, empresa, cargo, mensagem } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { error: "Nome e email sao obrigatorios" },
        { status: 400 }
      );
    }

    // Check if email already has a pending request
    const { data: existing } = await supabaseAdmin
      .from("access_requests")
      .select("id, status")
      .eq("email", email)
      .in("status", ["pendente", "aprovado"])
      .limit(1);

    if (existing && existing.length > 0) {
      const status = (existing[0] as any).status;
      if (status === "pendente") {
        return NextResponse.json(
          { error: "Ja existe uma solicitacao pendente para este email" },
          { status: 409 }
        );
      }
      if (status === "aprovado") {
        return NextResponse.json(
          { error: "Este email ja possui acesso aprovado" },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .insert({
        nome,
        email,
        telefone: telefone || null,
        empresa: empresa || null,
        cargo: cargo || null,
        mensagem: mensagem || null,
        status: "pendente",
      } as any)
      .select()
      .single() as any;

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
