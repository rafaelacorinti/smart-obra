import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getTimelineObra(companyId: string, obraId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("timeline_obra")
    .select("*")
    .eq("company_id", companyId)
    .eq("obra_id", obraId)
    .order("data", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function addTimelineObra(companyId: string, entry: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(entry);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  dbData.company_id = companyId;
  const { data, error } = await supabase
    .from("timeline_obra")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
