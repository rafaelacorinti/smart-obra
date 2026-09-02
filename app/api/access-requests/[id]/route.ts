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
    console.log("[access-requests PATCH] session user:", session?.user ? { role: (session.user as any).role, email: session.user?.email } : "sem sessao");

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nao autorizado - apenas administradores podem realizar esta acao" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, allowedModules, motivoRejeicao } = body;
    console.log("[access-requests PATCH] id:", params.id, "status:", status);

    if (status === "aprovado") {
      const { data: accessReq, error: fetchError } = await supabaseAdmin
        .from("access_requests")
        .select("*")
        .eq("id", params.id)
        .single();

      if (fetchError || !accessReq) {
        console.error("[access-requests PATCH] Solicitacao nao encontrada:", fetchError);
        return NextResponse.json(
          { error: "Solicitacao nao encontrada" },
          { status: 404 }
        );
      }

      console.log("[access-requests PATCH] Solicitacao encontrada:", { email: (accessReq as any).email, status: (accessReq as any).status });

      if ((accessReq as any).status === "aprovado") {
        return NextResponse.json(
          { error: "Solicitacao ja foi aprovada anteriormente" },
          { status: 400 }
        );
      }

      const tempPassword = generateTempPassword();

      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: (accessReq as any).email,
          password: tempPassword,
          email_confirm: true,
        });

      if (authError) {
        console.error("[access-requests PATCH] Erro ao criar usuario auth:", authError);
        return NextResponse.json(
          { error: "Erro ao criar usuario: " + authError.message },
          { status: 500 }
        );
      }

      console.log("[access-requests PATCH] Usuario auth criado:", authData.user.id);

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
          allowed_modules: allowedModules || [],
        } as any);

      if (profileError) {
        console.error("[access-requests PATCH] Erro ao criar perfil:", profileError);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Erro ao criar perfil do usuario: " + profileError.message },
          { status: 500 }
        );
      }

      console.log("[access-requests PATCH] Perfil criado com sucesso");

      // Link user to a company via user_companies
      const empresaNome = (accessReq as any).empresa;
      if (empresaNome) {
        const { data: existingCompany } = await supabaseAdmin
          .from("companies")
          .select("id")
          .ilike("name", empresaNome)
          .limit(1)
          .maybeSingle();

        let companyId: string | null = existingCompany?.id || null;

        if (!companyId) {
          const slug = empresaNome
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

          const { data: newCompany } = await supabaseAdmin
            .from("companies")
            .insert({
              name: empresaNome,
              slug: slug || "empresa-" + Date.now(),
              status: "active",
              plan: "free",
            })
            .select("id")
            .single();

          companyId = newCompany?.id || null;
        }

        if (companyId) {
          await supabaseAdmin
            .from("user_companies")
            .insert({
              company_id: companyId,
              user_id: authData.user.id,
              role: "admin",
              status: "active",
            });
        }
      }

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
        console.error("[access-requests PATCH] Erro ao atualizar solicitacao:", error);
        throw error;
      }

      console.log("[access-requests PATCH] Aprovacao concluida com sucesso");
      return NextResponse.json({
        ...data,
        senhaTemporaria: tempPassword,
        userId: authData.user.id,
      });
    }

    if (status === "rejeitado") {
      const { data, error } = await supabaseAdmin
        .from("access_requests")
        .update({
          status: "rejeitado",
          motivo_rejeicao: motivoRejeicao || null,
          data_resposta: new Date().toISOString(),
        } as any)
        .eq("id", params.id)
        .select()
        .single() as any;

      if (error) {
        console.error("[access-requests PATCH] Erro ao rejeitar:", error);
        throw error;
      }
      return NextResponse.json(data);
    }

    if (status === "bloqueado") {
      const { data: accessReq } = await supabaseAdmin
        .from("access_requests")
        .select("email")
        .eq("id", params.id)
        .single();

      if (accessReq) {
        await supabaseAdmin
          .from("user_profiles")
          .update({ active: false } as any)
          .eq("email", (accessReq as any).email);
      }

      const { data, error } = await supabaseAdmin
        .from("access_requests")
        .update({
          status: "bloqueado",
          data_resposta: new Date().toISOString(),
        } as any)
        .eq("id", params.id)
        .select()
        .single() as any;

      if (error) {
        console.error("[access-requests PATCH] Erro ao bloquear:", error);
        throw error;
      }
      return NextResponse.json(data);
    }

    if (status === "desbloqueado") {
      const { data: accessReq } = await supabaseAdmin
        .from("access_requests")
        .select("email")
        .eq("id", params.id)
        .single();

      if (accessReq) {
        await supabaseAdmin
          .from("user_profiles")
          .update({ active: true } as any)
          .eq("email", (accessReq as any).email);
      }

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
        console.error("[access-requests PATCH] Erro ao desbloquear:", error);
        throw error;
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Status invalido" }, { status: 400 });
  } catch (error: any) {
    console.error("[access-requests PATCH] Erro inesperado:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("access_requests")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
