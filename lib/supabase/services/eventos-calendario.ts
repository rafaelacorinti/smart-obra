import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getEventosCalendario() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eventos_calendario")
    .select("*")
    .order("data", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}
