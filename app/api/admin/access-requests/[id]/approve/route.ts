import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

function generateTempPassword(): string {
  return "Smart" + crypto.randomBytes(3).toString("hex") + "!";
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { data: accessReq, error: fetchError } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !accessReq) {
      return NextResponse.json(
        { error: "Solicitacao nao encontrada" },
        { status: 404 }
      );
    }

    if ((accessReq as any).status === "aprovado") {
      return NextResponse.json(
        { error: "Solicitacao ja foi aprovada" },
        { status: 400 }
      );
    }

    // 1. Generate temporary password
    const tempPassword = generateTempPassword();

    // 2. Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: (accessReq as any).email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        { error: "Erro ao criar usuario: " + authError.message },
        { status: 500 }
      );
    }

    // 3. Create user profile
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        name: (accessReq as any).nome,
        email: (accessReq as any).email,
        role: "GESTOR",
        company_name: (accessReq as any).empresa,
        phone: (accessReq as any).telefone,
        active: true,
        allowed_modules: [],
      } as any);

    if (profileError) {
      // Rollback: delete created auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Erro ao criar perfil: " + profileError.message },
        { status: 500 }
      );
    }

    // 4. Update access request status
    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .update({
        status: "aprovado",
        data_resposta: new Date().toISOString(),
      } as any)
      .eq("id", params.id)
      .select()
      .single() as any;

    if (error) throw error;

    return NextResponse.json({
      ...data,
      senhaTemporaria: tempPassword,
      userId: authData.user.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
