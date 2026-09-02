import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getObras(companyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("obras")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function getObraById(companyId: string, id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("obras")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", id)
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function createObra(companyId: string, obra: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(obra);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("obras")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateObra(companyId: string, id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.company_id;
  const { data, error } = await supabase
    .from("obras")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteObra(companyId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("obras").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteObraCascade(companyId: string, id: string) {
  const supabase = createClient();
  const cascadeTables = [
    "colaboradores_obra", "materiais_obra", "diario_obra",
    "timeline_obra", "documentos_obra", "fotos_obra"
  ];
  for (const table of cascadeTables) {
    await supabase.from(table).delete().eq("obra_id", id);
  }
  const { error } = await supabase.from("obras").delete().eq("id", id);
  if (error) throw error;
}
