import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getColaboradores() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("colaboradores")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createColaborador(colab: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(colab);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("colaboradores")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateColaborador(id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  const { data, error } = await supabase
    .from("colaboradores")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteColaborador(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("colaboradores").delete().eq("id", id);
  if (error) throw error;
}
