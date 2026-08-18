import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getFornecedores() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createFornecedor(fornecedor: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(fornecedor);
  delete dbData.id;
  delete dbData.created_at;
  const { data, error } = await supabase
    .from("fornecedores")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateFornecedor(id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  const { data, error } = await supabase
    .from("fornecedores")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteFornecedor(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("fornecedores").delete().eq("id", id);
  if (error) throw error;
}
