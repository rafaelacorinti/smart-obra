import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getColaboradoresObra(companyId: string, obraId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("colaboradores_obra")
    .select("*")
    .eq("company_id", companyId)
    .eq("obra_id", obraId);
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function addColaboradorObra(companyId: string, colab: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(colab);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("colaboradores_obra")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function removeColaboradorObra(companyId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("colaboradores_obra")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
