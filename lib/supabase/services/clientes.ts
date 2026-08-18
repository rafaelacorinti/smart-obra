import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

export async function getClientes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function createCliente(cliente: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(cliente);
  delete dbData.id;
  delete dbData.created_at;
  delete dbData.criado_em;
  const { data, error } = await supabase
    .from("clientes")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateCliente(id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  const { data, error } = await supabase
    .from("clientes")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteCliente(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw error;
}
