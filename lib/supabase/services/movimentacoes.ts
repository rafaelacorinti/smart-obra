import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getMovimentacoes(companyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("movimentacoes_estoque")
    .select("*")
    .eq("company_id", companyId)
    .order("data", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createMovimentacao(companyId: string, mov: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(mov);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("movimentacoes_estoque")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
