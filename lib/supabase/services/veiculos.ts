import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getVeiculos(companyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createVeiculo(companyId: string, veiculo: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(veiculo);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("veiculos")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateVeiculo(companyId: string, id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.company_id;
  const { data, error } = await supabase
    .from("veiculos")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteVeiculo(companyId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("veiculos").delete().eq("id", id);
  if (error) throw error;
}
