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
    console.log("[admin approve] session user:", session?.user ? { role: (session.user as any).role, email: session.user?.email } : "sem sessao");

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nao autorizado - apenas administradores podem aprovar solicitacoes" },
        { status: 401 }
      );
    }

    const { data: accessReq, error: fetchError } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !accessReq) {
      console.error("[admin approve] Solicitacao nao encontrada:", fetchError);
      return NextResponse.json(
        { error: "Solicitacao nao encontrada" },
        { status: 404 }
      );
    }

    console.log("[admin approve] Solicitacao encontrada:", { email: (accessReq as any).email, status: (accessReq as any).status });

    if ((accessReq as any).status === "aprovado") {
      return NextResponse.json(
        { error: "Solicitacao ja foi aprovada anteriormente" },
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
      console.error("[admin approve] Erro ao criar usuario auth:", authError);
      return NextResponse.json(
        { error: "Erro ao criar usuario: " + authError.message },
        { status: 500 }
      );
    }

    console.log("[admin approve] Usuario auth criado:", authData.user.id);

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
      console.error("[admin approve] Erro ao criar perfil:", profileError);
      // Rollback: delete created auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Erro ao criar perfil do usuario: " + profileError.message },
        { status: 500 }
      );
    }

    console.log("[admin approve] Perfil criado com sucesso");

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

    if (error) {
      console.error("[admin approve] Erro ao atualizar solicitacao:", error);
      throw error;
    }

    console.log("[admin approve] Aprovacao concluida com sucesso");

    return NextResponse.json({
      ...data,
      senhaTemporaria: tempPassword,
      userId: authData.user.id,
    });
  } catch (error: any) {
    console.error("[admin approve] Erro inesperado:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
