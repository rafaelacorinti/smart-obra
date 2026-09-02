import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isPlatformAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { data: members, error: membersError } = await supabase
      .from("user_companies")
      .select("*")
      .eq("company_id", params.id)
      .order("created_at", { ascending: false });
    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return NextResponse.json([]);
    }

    const userIds = members.map((m: any) => m.user_id);
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, name, email")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.id, p])
    );

    const result = members.map((d: any) => {
      const profile = profileMap.get(d.user_id);
      return {
        ...d,
        user_name: profile?.name || null,
        user_email: profile?.email || null,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isPlatformAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const supabase = createAdminClient();

    let userId = body.userId;

    if (body.email && !userId) {
      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", body.email)
        .single();

      if (profileError || !userProfile) {
        return NextResponse.json(
          { error: "Usuario nao encontrado com este email" },
          { status: 404 }
        );
      }
      userId = userProfile.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Informe o email ou ID do usuario" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("user_companies")
      .select("id")
      .eq("company_id", params.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Este usuario ja e membro desta empresa" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("user_companies")
      .insert({
        company_id: params.id,
        user_id: userId,
        role: body.role || "member",
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isPlatformAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("user_companies")
      .update({ role: body.role })
      .eq("id", body.membershipId)
      .eq("company_id", params.id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isPlatformAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const membershipId = searchParams.get("membershipId");
    if (!membershipId) return NextResponse.json({ error: "membershipId obrigatorio" }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("user_companies")
      .delete()
      .eq("id", membershipId)
      .eq("company_id", params.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
