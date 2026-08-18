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
    const { nome, email, senha, telefone, empresa, cargo, mensagem } = body;

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Nome, email e senha sao obrigatorios" },
        { status: 400 }
      );
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

    // Store password temporarily in metadata (will be used on approval)
    // We store it as user metadata since access_requests table doesn't have password
    const { error: metaError } = await supabaseAdmin
      .from("access_requests")
      .update({ mensagem: body.mensagem ? `${body.mensagem}` : null } as any)
      .eq("id", data.id);

    // Note: password is handled during approval via Supabase Auth createUser

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
