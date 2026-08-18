import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getOrcamentos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function getOrcamentoById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function createOrcamento(orcamento: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(orcamento);
  if (!dbData.id) delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("orcamentos")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateOrcamento(id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  const { data, error } = await supabase
    .from("orcamentos")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteOrcamento(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("orcamentos").delete().eq("id", id);
  if (error) throw error;
}
