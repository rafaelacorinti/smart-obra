import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getMateriaisObra(companyId: string, obraId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("materiais_obra")
    .select("*")
    .eq("company_id", companyId)
    .eq("obra_id", obraId);
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function addMaterialObra(companyId: string, mat: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(mat);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("materiais_obra")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
