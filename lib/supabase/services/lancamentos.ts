import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getLancamentos(companyId: string, obraId?: string) {
  const supabase = createClient();
  let query = supabase.from("lancamentos").select("*").eq("company_id", companyId).order("data", { ascending: false });
  if (obraId) {
    query = query.eq("obra_id", obraId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createLancamento(companyId: string, lancamento: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(lancamento);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("lancamentos")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateLancamento(companyId: string, id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.company_id;
  const { data, error } = await supabase
    .from("lancamentos")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteLancamento(companyId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("lancamentos").delete().eq("id", id);
  if (error) throw error;
}
