import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email obrigatorio" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("allowed_modules")
      .eq("email", email)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(data.allowed_modules || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { email, allowedModules } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email obrigatorio" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .update({ allowed_modules: allowedModules || [] })
      .eq("email", email)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
