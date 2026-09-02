import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getColaboradores(companyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("colaboradores")
    .select("*")
    .eq("company_id", companyId)
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createColaborador(companyId: string, colab: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(colab);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("colaboradores")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateColaborador(companyId: string, id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.company_id;
  const { data, error } = await supabase
    .from("colaboradores")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteColaborador(companyId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("colaboradores").delete().eq("id", id);
  if (error) throw error;
}
