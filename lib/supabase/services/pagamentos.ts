import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getPagamentos(companyId: string, colaboradorId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("pagamentos_colaborador")
    .select("*")
    .eq("company_id", companyId)
    .order("data", { ascending: false });
  if (colaboradorId) query = query.eq("colaborador_id", colaboradorId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createPagamento(companyId: string, pagamento: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(pagamento);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("pagamentos_colaborador")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updatePagamento(companyId: string, id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  delete dbData.company_id;
  const { data, error } = await supabase
    .from("pagamentos_colaborador")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
