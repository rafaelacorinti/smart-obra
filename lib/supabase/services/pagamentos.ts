import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getPagamentos(colaboradorId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("pagamentos_colaborador")
    .select("*")
    .order("data", { ascending: false });
  if (colaboradorId) query = query.eq("colaborador_id", colaboradorId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createPagamento(pagamento: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(pagamento);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("pagamentos_colaborador")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updatePagamento(id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("pagamentos_colaborador")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
