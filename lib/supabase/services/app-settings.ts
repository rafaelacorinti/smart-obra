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
  const { error } = await supabase
    .from("app_settings")
    .upsert({ chave, valor, company_id: companyId }, { onConflict: "chave,company_id" });
  if (error) throw error;
}
