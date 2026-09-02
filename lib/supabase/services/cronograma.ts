import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getEtapasCronograma(companyId: string, obraId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cronograma_etapas")
    .select("*")
    .eq("company_id", companyId)
    .eq("obra_id", obraId)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createEtapaCronograma(companyId: string, etapa: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(etapa);
  delete dbData.id;
  delete dbData.created_at;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("cronograma_etapas")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateEtapaCronograma(companyId: string, id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.company_id;
  const { data, error } = await supabase
    .from("cronograma_etapas")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteEtapaCronograma(companyId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("cronograma_etapas").delete().eq("id", id);
  if (error) throw error;
}
