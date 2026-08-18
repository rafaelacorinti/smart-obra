import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getCompras() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("compras")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createCompra(compra: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(compra);
  delete dbData.id;
  delete dbData.created_at;
  const { data, error } = await supabase
    .from("compras")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateCompra(id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  const { data, error } = await supabase
    .from("compras")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteCompra(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("compras").delete().eq("id", id);
  if (error) throw error;
}
