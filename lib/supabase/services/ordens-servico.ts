import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getOrdensServico(companyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ordens_servico")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createOrdemServico(companyId: string, os: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(os);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  delete dbData.numero;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("ordens_servico")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateOrdemServico(companyId: string, id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.numero;
  delete dbData.company_id;
  const { data, error } = await supabase
    .from("ordens_servico")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteOrdemServico(companyId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
  if (error) throw error;
}
