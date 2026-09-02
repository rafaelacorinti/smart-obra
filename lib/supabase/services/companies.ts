import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toSnakeCase } from "@/lib/supabase/utils";

// ============================================================
// Companies CRUD
// ============================================================

export async function getCompanies() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function getCompanyById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function createCompany(company: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(company);
  delete dbData.id;
  delete dbData.created_at;
  const { data, error } = await supabase
    .from("companies")
    .insert(dbData)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateCompany(id: string, updates: any) {
  const supabase = createClient();
  const dbData = toSnakeCase(updates);
  delete dbData.id;
  delete dbData.created_at;
  const { data, error } = await supabase
    .from("companies")
    .update(dbData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function deleteCompany(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Company Members
// ============================================================

export async function getCompanyMembers(companyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_companies")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => toCamelCase(d));
}

export async function addCompanyMember(companyId: string, userId: string, role: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_companies")
    .insert({
      company_id: companyId,
      user_id: userId,
      role,
    })
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function updateCompanyMemberRole(id: string, role: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_companies")
    .update({ role })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toCamelCase(data as any);
}

export async function removeCompanyMember(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_companies")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Role Hierarchy
// ============================================================

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  member: 1,
};

export function canManageRole(actorRole: string, targetRole: string): boolean {
  return (ROLE_HIERARCHY[actorRole] || 0) > (ROLE_HIERARCHY[targetRole] || 0);
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "Proprietario",
    admin: "Administrador",
    manager: "Gerente",
    member: "Membro",
  };
  return labels[role] || role;
}
