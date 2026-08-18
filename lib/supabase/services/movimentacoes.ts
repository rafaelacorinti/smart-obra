import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getMovimentacoes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("movimentacoes_estoque")
    .select("*")
    .order("data", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createMovimentacao(mov: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(mov);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("movimentacoes_estoque")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
