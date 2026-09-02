import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getPresencas(companyId: string, colaboradorId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("presencas_colaborador")
    .select("*")
    .eq("company_id", companyId)
    .order("data", { ascending: false });
  if (colaboradorId) query = query.eq("colaborador_id", colaboradorId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createPresenca(companyId: string, presenca: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(presenca);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("presencas_colaborador")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
