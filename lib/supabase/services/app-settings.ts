import { createClient } from "@/lib/supabase/client";

export async function getSetting(companyId: string, chave: string): Promise<any> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("valor")
    .eq("company_id", companyId)
    .eq("chave", chave)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data?.valor ?? null;
}

export async function setSetting(companyId: string, chave: string, valor: any): Promise<void> {
  const supabase = createClient();

  // Try upsert first (works when the UNIQUE(chave, company_id) constraint exists)
  const { error } = await supabase
    .from("app_settings")
    .upsert(
      { chave, valor, company_id: companyId, updated_at: new Date().toISOString() },
      { onConflict: "chave,company_id" }
    );

  if (!error) return;

  // Fallback: manual SELECT then UPDATE or INSERT
  const { data: existing } = await supabase
    .from("app_settings")
    .select("id")
    .eq("company_id", companyId)
    .eq("chave", chave)
    .maybeSingle();

  if (existing) {
    const { error: updateErr } = await supabase
      .from("app_settings")
      .update({ valor, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (updateErr) throw updateErr;
  } else {
    const { error: insertErr } = await supabase
      .from("app_settings")
      .insert({ chave, valor, company_id: companyId, updated_at: new Date().toISOString() });
    if (insertErr) throw insertErr;
  }
}
