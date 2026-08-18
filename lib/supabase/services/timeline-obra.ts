import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getTimelineObra(obraId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("timeline_obra")
    .select("*")
    .eq("obra_id", obraId)
    .order("data", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function addTimelineObra(entry: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(entry);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("timeline_obra")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}
