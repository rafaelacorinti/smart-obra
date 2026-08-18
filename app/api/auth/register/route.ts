import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, companyName, cnpj } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e email sao obrigatorios" },
        { status: 400 }
      );
    }

    // Create as access request (will be approved by admin)
    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .insert({
        nome: name,
        email,
        telefone: phone || null,
        empresa: companyName || null,
        cargo: null,
        mensagem: cnpj ? "CNPJ: " + cnpj : null,
        status: "pendente",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
