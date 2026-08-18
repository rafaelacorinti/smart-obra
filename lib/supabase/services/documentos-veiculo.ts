import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getDocumentosVeiculo(veiculoId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("documentos_veiculo")
    .select("*");
  if (veiculoId) query = query.eq("veiculo_id", veiculoId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createDocumentoVeiculo(doc: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(doc);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("documentos_veiculo")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
