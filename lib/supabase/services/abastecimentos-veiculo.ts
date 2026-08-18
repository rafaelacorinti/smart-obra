import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getAbastecimentosVeiculo(veiculoId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("abastecimentos_veiculo")
    .select("*")
    .order("data", { ascending: false });
  if (veiculoId) query = query.eq("veiculo_id", veiculoId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createAbastecimentoVeiculo(abastecimento: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(abastecimento);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("abastecimentos_veiculo")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
