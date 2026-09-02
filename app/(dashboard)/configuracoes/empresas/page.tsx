"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  Shield,
  ArrowLeft,
  Search,
  Crown,
  ShieldCheck,
  UserCog,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useCompany } from "@/contexts/company-context";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  createdAt: string;
}

interface Member {
  id: string;
  companyId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  role: string;
  createdAt: string;
}

interface UserResult {
  id: string;
  name: string;
  email: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  suspended: "Suspenso",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  starter: "Starter",
  professional: "Profissional",
  enterprise: "Enterprise",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietario",
  admin: "Administrador",
  manager: "Gerente",
  member: "Membro",
};

const ROLE_ICONS: Record<string, any> = {
  owner: Crown,
  admin: ShieldCheck,
  manager: UserCog,
  member: User,
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  member: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function EmpresasPage() {
  const { isPlatformAdmin } = useCompany();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Company dialog
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: "", slug: "", status: "active", plan: "free" });

  // Members
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState("member");

  // User search for add member
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [addMemberError, setAddMemberError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [saving, setSaving] = useState(false);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/companies");
      if (!res.ok) throw new Error("Erro ao carregar empresas");
      const data = await res.json();
      setCompanies(data.map((d: any) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        status: d.status || "active",
        plan: d.plan || "free",
        createdAt: d.created_at,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPlatformAdmin) {
      router.push("/");
      return;
    }
    loadCompanies();
  }, [isPlatformAdmin, router, loadCompanies]);

  const loadMembers = useCallback(async (companyId: string) => {
    try {
      setLoadingMembers(true);
      const res = await fetch(`/api/admin/companies/${companyId}/users`);
      if (!res.ok) throw new Error("Erro ao carregar membros");
      const data = await res.json();
      setMembers(data.map((d: any) => ({
        id: d.id,
        companyId: d.company_id,
        userId: d.user_id,
        userName: d.user_name || null,
        userEmail: d.user_email || null,
        role: d.role || "member",
        createdAt: d.created_at,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const handleSaveCompany = async () => {
    try {
      setSaving(true);
      const method = editingCompany ? "PUT" : "POST";
      const body = editingCompany
        ? { id: editingCompany.id, ...companyForm }
        : companyForm;

      const res = await fetch("/api/admin/companies", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao salvar empresa");
      setShowCompanyDialog(false);
      setEditingCompany(null);
      setCompanyForm({ name: "", slug: "", status: "active", plan: "free" });
      await loadCompanies();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa? Esta acao e irreversivel.")) return;
    try {
      const res = await fetch(`/api/admin/companies?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir empresa");
      await loadCompanies();
      if (selectedCompany?.id === id) setSelectedCompany(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMemberRole = async (membershipId: string, role: string) => {
    if (!selectedCompany) return;
    try {
      const res = await fetch(`/api/admin/companies/${selectedCompany.id}/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, role }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar papel");
      await loadMembers(selectedCompany.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!selectedCompany) return;
    if (!confirm("Remover este membro da empresa?")) return;
    try {
      const res = await fetch(
        `/api/admin/companies/${selectedCompany.id}/users?membershipId=${membershipId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erro ao remover membro");
      await loadMembers(selectedCompany.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchUsers = async () => {
    const q = userSearchQuery.trim();
    if (q.length < 2) return;
    try {
      setSearchingUsers(true);
      setAddMemberError("");
      setSelectedUser(null);
      setHasSearched(false);
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Erro ao buscar usuarios");
      const data: UserResult[] = await res.json();
      setUserSearchResults(data);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      setAddMemberError("Erro ao buscar usuarios");
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedCompany || !selectedUser) return;
    try {
      setSaving(true);
      setAddMemberError("");
      const res = await fetch(`/api/admin/companies/${selectedCompany.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, role: newMemberRole }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao adicionar membro");
      }
      setShowAddMember(false);
      resetAddMemberForm();
      await loadMembers(selectedCompany.id);
    } catch (err: any) {
      setAddMemberError(err.message || "Erro ao adicionar membro");
    } finally {
      setSaving(false);
    }
  };

  const resetAddMemberForm = () => {
    setUserSearchQuery("");
    setUserSearchResults([]);
    setSelectedUser(null);
    setNewMemberRole("member");
    setAddMemberError("");
    setHasSearched(false);
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (!isPlatformAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/configuracoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Gerenciamento de Empresas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administre as empresas da plataforma
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setEditingCompany(null);
          setCompanyForm({ name: "", slug: "", status: "active", plan: "free" });
          setShowCompanyDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Carregando empresas...</p>
              </CardContent>
            </Card>
          ) : filteredCompanies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredCompanies.map((company) => (
                <Card
                  key={company.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCompany?.id === company.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => {
                    setSelectedCompany(company);
                    loadMembers(company.id);
                  }}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">/{company.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[company.status] || ""}>
                        {STATUS_LABELS[company.status] || company.status}
                      </Badge>
                      <Badge variant="outline">
                        {PLAN_LABELS[company.plan] || company.plan}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCompany(company);
                          setCompanyForm({
                            name: company.name,
                            slug: company.slug,
                            status: company.status,
                            plan: company.plan,
                          });
                          setShowCompanyDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompany(company.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Members Panel */}
        <div>
          {selectedCompany ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Membros
                  </span>
                  <Button size="sm" onClick={() => { resetAddMemberForm(); setShowAddMember(true); }}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{selectedCompany.name}</p>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum membro</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => {
                      const RoleIcon = ROLE_ICONS[member.role] || User;
                      return (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <RoleIcon className="h-4 w-4 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.userName || member.userId}
                              </p>
                              {member.userEmail && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.userEmail}
                                </p>
                              )}
                              <Badge className={`text-xs ${ROLE_COLORS[member.role] || ""}`}>
                                {ROLE_LABELS[member.role] || member.role}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Select
                              value={member.role}
                              onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                            >
                              <SelectTrigger className="h-7 w-[110px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Proprietario</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="manager">Gerente</SelectItem>
                                <SelectItem value="member">Membro</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  Selecione uma empresa para gerenciar seus membros
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Company Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Editar Empresa" : "Nova Empresa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={companyForm.slug}
                onChange={(e) => setCompanyForm({ ...companyForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                placeholder="slug-da-empresa"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={companyForm.status} onValueChange={(v) => setCompanyForm({ ...companyForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plano</Label>
              <Select value={companyForm.plan} onValueChange={(v) => setCompanyForm({ ...companyForm, plan: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompanyDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCompany} disabled={saving || !companyForm.name || !companyForm.slug}>
              {saving ? "Salvando..." : editingCompany ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog - Improved UX */}
      <Dialog open={showAddMember} onOpenChange={(open) => { setShowAddMember(open); if (!open) resetAddMemberForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Adicionar Membro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search field */}
            <div>
              <Label>Buscar usuario por nome ou email</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Digite o nome ou email..."
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchUsers(); }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSearchUsers}
                  disabled={searchingUsers || userSearchQuery.trim().length < 2}
                  className="shrink-0"
                >
                  {searchingUsers ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Buscar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Digite o email ou nome e clique em Buscar (ou pressione Enter)
              </p>
            </div>

            {/* Loading state */}
            {searchingUsers && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Buscando usuarios...</p>
              </div>
            )}

            {/* No results message */}
            {hasSearched && !searchingUsers && userSearchResults.length === 0 && !addMemberError && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Nenhum usuario encontrado. Verifique se o email esta correto.
                </p>
              </div>
            )}

            {/* Search results */}
            {userSearchResults.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  {userSearchResults.length} usuario(s) encontrado(s) — clique para selecionar
                </Label>
                <div className="mt-1.5 max-h-48 overflow-y-auto space-y-1 border rounded-md p-1">
                  {userSearchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedUser?.id === user.id
                          ? "bg-blue-50 border border-blue-200 dark:bg-blue-950/50 dark:border-blue-800"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => { setSelectedUser(user); setAddMemberError(""); }}
                    >
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt to select user */}
            {userSearchResults.length > 0 && !selectedUser && (
              <p className="text-xs text-muted-foreground text-center">
                Selecione um usuario acima para adicionar como membro
              </p>
            )}

            {/* Selected user confirmation */}
            {selectedUser && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Usuario selecionado:</p>
                  <p className="text-sm truncate">{selectedUser.name} ({selectedUser.email})</p>
                </div>
              </div>
            )}

            {/* Error message */}
            {addMemberError && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{addMemberError}</p>
              </div>
            )}

            {/* Role selection */}
            <div>
              <Label>Papel</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Proprietario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            {!selectedUser && (
              <p className="text-xs text-muted-foreground text-center w-full">
                {!hasSearched
                  ? "Busque e selecione um usuario para habilitar o botao Adicionar"
                  : userSearchResults.length > 0
                    ? "Selecione um usuario da lista para habilitar o botao Adicionar"
                    : "Busque um usuario para continuar"}
              </p>
            )}
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setShowAddMember(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMember} disabled={saving || !selectedUser}>
                {saving ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
