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

    const body = await request.json();
    const { status, allowedModules, motivoRejeicao, senha } = body;

    if (status === "aprovado") {
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

      const password = senha || "smart123";
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: accessReq.email,
          password: password,
          email_confirm: true,
        });

      if (authError) {
        return NextResponse.json(
          { error: "Erro ao criar usuario: " + authError.message },
          { status: 500 }
        );
      }

      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .insert({
          id: authData.user.id,
          name: accessReq.nome,
          email: accessReq.email,
          role: "GESTOR",
          company_name: accessReq.empresa,
          phone: accessReq.telefone,
          active: true,
          allowed_modules: allowedModules || [],
        } as any);

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Erro ao criar perfil: " + profileError.message },
          { status: 500 }
        );
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

      if (error) throw error;
      return NextResponse.json(data);
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

      if (error) throw error;
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
          .eq("email", accessReq.email);
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

      if (error) throw error;
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
          .eq("email", accessReq.email);
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

      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Status invalido" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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