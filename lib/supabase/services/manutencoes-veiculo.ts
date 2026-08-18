import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getManutencoesVeiculo(veiculoId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("manutencoes_veiculo")
    .select("*")
    .order("data", { ascending: false });
  if (veiculoId) query = query.eq("veiculo_id", veiculoId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createManutencaoVeiculo(manutencao: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(manutencao);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("manutencoes_veiculo")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
