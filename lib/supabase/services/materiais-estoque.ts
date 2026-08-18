import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getMateriaisEstoque() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("materiais_estoque")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createMaterialEstoque(mat: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(mat);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("materiais_estoque")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateMaterialEstoque(id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("materiais_estoque")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteMaterialEstoque(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("materiais_estoque")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
