import { createClient } from "@/lib/supabase/client";

export async function getSetting(chave: string): Promise<any> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("valor")
    .eq("chave", chave)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data?.valor ?? null;
}

export async function setSetting(chave: string, valor: any): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ chave, valor }, { onConflict: "chave" });
  if (error) throw error;
}
