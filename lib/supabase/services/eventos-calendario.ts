import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getEventosCalendario(companyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eventos_calendario")
    .select("*")
    .eq("company_id", companyId)
    .order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}
