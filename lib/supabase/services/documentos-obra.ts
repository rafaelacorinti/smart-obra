import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getDocumentosObra(obraId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documentos_obra")
    .select("*")
    .eq("obra_id", obraId);
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function addDocumentoObra(doc: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(doc);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("documentos_obra")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
