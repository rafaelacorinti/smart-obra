import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getDocumentosColaborador(colaboradorId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("documentos_colaborador")
    .select("*");
  if (colaboradorId) query = query.eq("colaborador_id", colaboradorId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createDocumentoColaborador(doc: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(doc);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("documentos_colaborador")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
