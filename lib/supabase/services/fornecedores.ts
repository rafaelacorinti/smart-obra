import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getFornecedores(companyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("company_id", companyId)
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createFornecedor(companyId: string, fornecedor: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(fornecedor);
  delete dbData.id;
  delete dbData.created_at;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("fornecedores")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateFornecedor(companyId: string, id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.company_id;
  const { data, error } = await supabase
    .from("fornecedores")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteFornecedor(companyId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("fornecedores").delete().eq("id", id);
  if (error) throw error;
}
