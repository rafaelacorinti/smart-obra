"use client";
import { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Users,
  Tag,
  Link2,
  Database,
  Palette,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Mail,
  MessageSquare,
  Moon,
  Sun,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { categoriasFinanceiras } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "ADMIN" | "FINANCEIRO" | "GESTOR" | "TECNICO" | "VISUALIZADOR";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
}

interface EmpresaData {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  uf: string;
}

interface IntegracoesData {
  whatsappTelefone: string;
  smtpServidor: string;
  smtpPorta: string;
  smtpEmail: string;
  smtpSenha: string;
}

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_USUARIOS: Usuario[] = [
  { id: "usr-1", nome: "Admin", email: "admin@smartobra.com", role: "ADMIN", ativo: true },
  { id: "usr-2", nome: "Gerente", email: "gerente@smartobra.com", role: "GESTOR", ativo: true },
  { id: "usr-3", nome: "Tecnico", email: "tecnico@smartobra.com", role: "TECNICO", ativo: true },
];

const DEFAULT_EMPRESA: EmpresaData = {
  nome: "",
  cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  cidade: "",
  uf: "",
};

const DEFAULT_INTEGRACOES: IntegracoesData = {
  whatsappTelefone: "",
  smtpServidor: "",
  smtpPorta: "",
  smtpEmail: "",
  smtpSenha: "",
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  FINANCEIRO: "Financeiro",
  GESTOR: "Gestor",
  TECNICO: "Técnico",
  VISUALIZADOR: "Visualizador",
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  FINANCEIRO: "bg-blue-100 text-blue-700 border-blue-200",
  GESTOR: "bg-purple-100 text-purple-700 border-purple-200",
  TECNICO: "bg-amber-100 text-amber-700 border-amber-200",
  VISUALIZADOR: "bg-gray-100 text-gray-600 border-gray-200",
};

const ACCENT_COLORS = [
  { label: "Azul", value: "blue", class: "bg-blue-500" },
  { label: "Índigo", value: "indigo", class: "bg-indigo-500" },
  { label: "Violeta", value: "violet", class: "bg-violet-500" },
  { label: "Esmeralda", value: "emerald", class: "bg-emerald-500" },
  { label: "Âmbar", value: "amber", class: "bg-amber-500" },
  { label: "Rosa", value: "rose", class: "bg-rose-500" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ls<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Toast helper ─────────────────────────────────────────────────────────────

function showToast(message: string, type: "success" | "error" = "success") {
  const el = document.createElement("div");
  el.className = `fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
    type === "success"
      ? "bg-emerald-600 text-white"
      : "bg-red-600 text-white"
  }`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
    </div>
  );
}

// ─── Tab: Empresa ─────────────────────────────────────────────────────────────

function TabEmpresa() {
  const [form, setForm] = useState<EmpresaData>(DEFAULT_EMPRESA);

  useEffect(() => {
    setForm(ls<EmpresaData>("smart-obra-empresa", DEFAULT_EMPRESA));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    lsSet("smart-obra-empresa", form);
    showToast("Dados da empresa salvos com sucesso!");
  }

  return (
    <SectionCard>
      <SectionTitle icon={Building2} title="Dados da Empresa" />
      <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="nome">Nome da Empresa</Label>
          <Input
            id="nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Smart Obra Construtora Ltda"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            name="cnpj"
            value={form.cnpj}
            onChange={handleChange}
            placeholder="00.000.000/0001-00"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            value={form.telefone}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="contato@empresa.com.br"
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            name="endereco"
            value={form.endereco}
            onChange={handleChange}
            placeholder="Rua das Obras, 100 - Bairro"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            placeholder="São Paulo"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="uf">UF</Label>
          <Input
            id="uf"
            name="uf"
            value={form.uf}
            onChange={handleChange}
            placeholder="SP"
            maxLength={2}
          />
        </div>
        <div className="sm:col-span-2 flex justify-end pt-2">
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Empresa
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

// ─── Tab: Usuarios ────────────────────────────────────────────────────────────

function TabUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", role: "TECNICO" as UserRole });

  useEffect(() => {
    setUsuarios(ls<Usuario[]>("smart-obra-usuarios", DEFAULT_USUARIOS));
  }, []);

  function persist(list: Usuario[]) {
    setUsuarios(list);
    lsSet("smart-obra-usuarios", list);
  }

  function toggleAtivo(id: string) {
    persist(usuarios.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u)));
  }

  function openAdd() {
    setEditing(null);
    setForm({ nome: "", email: "", role: "TECNICO" });
    setShowModal(true);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setForm({ nome: u.nome, email: u.email, role: u.role });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) {
      showToast("Preencha nome e e-mail.", "error");
      return;
    }
    if (editing) {
      persist(usuarios.map((u) => (u.id === editing.id ? { ...u, ...form } : u)));
      showToast("Usuário atualizado!");
    } else {
      const novo: Usuario = {
        id: `usr-${Date.now()}`,
        ...form,
        ativo: true,
      };
      persist([...usuarios, novo]);
      showToast("Usuário adicionado!");
    }
    setShowModal(false);
  }

  function handleRemove(id: string) {
    if (!window.confirm("Remover este usuário?")) return;
    persist(usuarios.filter((u) => u.id !== id));
    showToast("Usuário removido.");
  }

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle icon={Users} title="Usuários do Sistema" />
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>

        <div className="divide-y">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3 gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{u.nome}</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[u.role]}`}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>
                  {!u.ativo && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 text-[11px]">
                      Inativo
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleAtivo(u.id)}
                  title={u.ativo ? "Desativar" : "Ativar"}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    u.ativo ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      u.ativo ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemove(u.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {usuarios.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
          )}
        </div>
      </SectionCard>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card border shadow-xl p-6 space-y-4">
            <h3 className="font-semibold text-base">{editing ? "Editar Usuário" : "Novo Usuário"}</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Categorias ──────────────────────────────────────────────────────────

function TabCategorias() {
  const [receitas, setReceitas] = useState<string[]>([]);
  const [despesas, setDespesas] = useState<string[]>([]);
  const [newReceita, setNewReceita] = useState("");
  const [newDespesa, setNewDespesa] = useState("");

  useEffect(() => {
    const saved = ls<{ receita: string[]; despesa: string[] } | null>(
      "smart-obra-categorias",
      null
    );
    if (saved) {
      setReceitas(saved.receita);
      setDespesas(saved.despesa);
    } else {
      setReceitas(categoriasFinanceiras.receita);
      setDespesas(categoriasFinanceiras.despesa);
    }
  }, []);

  function persist(r: string[], d: string[]) {
    lsSet("smart-obra-categorias", { receita: r, despesa: d });
    showToast("Categorias salvas!");
  }

  function addReceita() {
    const v = newReceita.trim();
    if (!v) return;
    const next = [...receitas, v];
    setReceitas(next);
    setNewReceita("");
    persist(next, despesas);
  }

  function addDespesa() {
    const v = newDespesa.trim();
    if (!v) return;
    const next = [...despesas, v];
    setDespesas(next);
    setNewDespesa("");
    persist(receitas, next);
  }

  function removeReceita(i: number) {
    const next = receitas.filter((_, idx) => idx !== i);
    setReceitas(next);
    persist(next, despesas);
  }

  function removeDespesa(i: number) {
    const next = despesas.filter((_, idx) => idx !== i);
    setDespesas(next);
    persist(receitas, next);
  }

  function CategoryList({
    items,
    onRemove,
    newVal,
    setNewVal,
    onAdd,
    color,
  }: {
    items: string[];
    onRemove: (i: number) => void;
    newVal: string;
    setNewVal: (v: string) => void;
    onAdd: () => void;
    color: string;
  }) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder="Nova categoria..."
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
          />
          <Button size="sm" variant="outline" onClick={onAdd} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="space-y-1.5 mt-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm bg-background">
              <span className={`flex items-center gap-1.5 font-medium ${color}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {item}
              </span>
              <button
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-center py-4 text-sm text-muted-foreground">Nenhuma categoria.</li>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SectionCard>
        <SectionTitle icon={Tag} title="Receitas" />
        <CategoryList
          items={receitas}
          onRemove={removeReceita}
          newVal={newReceita}
          setNewVal={setNewReceita}
          onAdd={addReceita}
          color="text-emerald-600"
        />
      </SectionCard>
      <SectionCard>
        <SectionTitle icon={Tag} title="Despesas" />
        <CategoryList
          items={despesas}
          onRemove={removeDespesa}
          newVal={newDespesa}
          setNewVal={setNewDespesa}
          onAdd={addDespesa}
          color="text-red-600"
        />
      </SectionCard>
    </div>
  );
}

// ─── Tab: Integracoes ─────────────────────────────────────────────────────────

function TabIntegracoes() {
  const [data, setData] = useState<IntegracoesData>(DEFAULT_INTEGRACOES);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setData(ls<IntegracoesData>("smart-obra-integracoes", DEFAULT_INTEGRACOES));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSave() {
    lsSet("smart-obra-integracoes", data);
    showToast("Configurações de integração salvas!");
  }

  function handleTest() {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      showToast("Conexão testada com sucesso! Servidor respondeu em 142ms");
    }, 2000);
  }

  const whatsappAtivo = data.whatsappTelefone.trim().length > 0;
  const smtpAtivo =
    data.smtpServidor.trim().length > 0 && data.smtpEmail.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* WhatsApp */}
      <SectionCard>
        <div className="flex items-start justify-between mb-4">
          <SectionTitle icon={MessageSquare} title="WhatsApp" />
          <Badge
            className={
              whatsappAtivo
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }
          >
            {whatsappAtivo ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" />Ativo</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" />Inativo</>
            )}
          </Badge>
        </div>
        <div className="space-y-1.5 max-w-sm">
          <Label htmlFor="whatsappTelefone">Número padrão (com DDD)</Label>
          <Input
            id="whatsappTelefone"
            name="whatsappTelefone"
            value={data.whatsappTelefone}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
          />
          <p className="text-xs text-muted-foreground">
            Número usado para envio de notificações via WhatsApp.
          </p>
        </div>
      </SectionCard>

      {/* SMTP */}
      <SectionCard>
        <div className="flex items-start justify-between mb-4">
          <SectionTitle icon={Mail} title="E-mail / SMTP" />
          <Badge
            className={
              smtpAtivo
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }
          >
            {smtpAtivo ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" />Ativo</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" />Inativo</>
            )}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="smtpServidor">Servidor SMTP</Label>
            <Input
              id="smtpServidor"
              name="smtpServidor"
              value={data.smtpServidor}
              onChange={handleChange}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smtpPorta">Porta</Label>
            <Input
              id="smtpPorta"
              name="smtpPorta"
              value={data.smtpPorta}
              onChange={handleChange}
              placeholder="587"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smtpEmail">E-mail de envio</Label>
            <Input
              id="smtpEmail"
              name="smtpEmail"
              type="email"
              value={data.smtpEmail}
              onChange={handleChange}
              placeholder="noreply@empresa.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smtpSenha">Senha / App Password</Label>
            <Input
              id="smtpSenha"
              name="smtpSenha"
              type="password"
              value={data.smtpSenha}
              onChange={handleChange}
              placeholder="••••••••••••"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
            {testing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {testing ? "Testando..." : "Testar conexão"}
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Integrações
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Backup ──────────────────────────────────────────────────────────────

function TabBackup() {
  const [ultimoBackup, setUltimoBackup] = useState<string | null>(null);

  useEffect(() => {
    setUltimoBackup(ls<string | null>("smart-obra-ultimo-backup", null));
  }, []);

  function handleExport() {
    if (typeof window === "undefined") return;
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("smart-obra-")) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) ?? "null");
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    const now = new Date().toISOString();
    data["smart-obra-ultimo-backup"] = now;
    lsSet("smart-obra-ultimo-backup", now);
    setUltimoBackup(now);

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-obra-backup-${now.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup exportado com sucesso!");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Record<string, unknown>;
        let count = 0;
        for (const [key, value] of Object.entries(parsed)) {
          if (key.startsWith("smart-obra-")) {
            localStorage.setItem(key, JSON.stringify(value));
            count++;
          }
        }
        setUltimoBackup(ls<string | null>("smart-obra-ultimo-backup", null));
        showToast(`${count} chaves restauradas com sucesso!`);
      } catch {
        showToast("Arquivo inválido ou corrompido.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleClear() {
    const ok = window.confirm(
      "Tem certeza que deseja LIMPAR TODOS OS DADOS do Smart Obra? Esta ação não pode ser desfeita."
    );
    if (!ok) return;
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("smart-obra-")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    setUltimoBackup(null);
    showToast("Todos os dados foram removidos.");
  }

  return (
    <div className="space-y-4">
      {ultimoBackup && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Último backup:{" "}
            <strong>
              {new Date(ultimoBackup).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </span>
        </div>
      )}

      <SectionCard>
        <SectionTitle icon={Database} title="Exportar Dados" />
        <p className="text-sm text-muted-foreground mb-4">
          Gera um arquivo JSON com todos os dados armazenados no Smart Obra (obras, financeiro, colaboradores, etc.).
        </p>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar dados
        </Button>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Upload} title="Importar Dados" />
        <p className="text-sm text-muted-foreground mb-4">
          Restaura os dados a partir de um arquivo de backup JSON exportado anteriormente. Os dados existentes serão substituídos.
        </p>
        <label className="cursor-pointer">
          <Button asChild variant="outline" className="gap-2">
            <span>
              <Upload className="h-4 w-4" />
              Selecionar arquivo de backup
            </span>
          </Button>
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
      </SectionCard>

      <SectionCard className="border-destructive/30">
        <SectionTitle icon={Trash2} title="Limpar Dados" />
        <p className="text-sm text-muted-foreground mb-4">
          Remove permanentemente todos os dados armazenados pelo Smart Obra no navegador. Faça um backup antes de prosseguir.
        </p>
        <Button variant="destructive" onClick={handleClear} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Limpar todos os dados
        </Button>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Aparencia ───────────────────────────────────────────────────────────

function TabAparencia() {
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState("blue");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAccentColor(ls<string>("smart-obra-accent-color", "blue"));
  }, []);

  function handleAccent(value: string) {
    setAccentColor(value);
    lsSet("smart-obra-accent-color", value);
    showToast("Cor de destaque salva!");
  }

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <SectionCard>
        <SectionTitle icon={Palette} title="Tema" />
        <p className="text-sm text-muted-foreground mb-4">
          Escolha entre o tema claro e escuro para o painel.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              theme === "light"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Sun className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium">Claro</span>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              theme === "dark"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
              <Moon className="h-5 w-5 text-slate-200" />
            </div>
            <span className="text-sm font-medium">Escuro</span>
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              theme === "system"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-sm font-medium">Sistema</span>
          </button>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Palette} title="Cor de Destaque" />
        <p className="text-sm text-muted-foreground mb-4">
          Personalize a cor de destaque da interface. A alteração é salva automaticamente.
        </p>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => handleAccent(c.value)}
              title={c.label}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-3 border-2 transition-all ${
                accentColor === c.value
                  ? "border-primary bg-primary/5 scale-105"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <span className={`h-8 w-8 rounded-full shadow-sm ${c.class}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  return (
    <div>
      <PageHeader
        title="Configurações"
        breadcrumbs={[{ label: "Configurações" }]}
      />

      <Tabs defaultValue="empresa" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="empresa" className="gap-1.5 text-xs sm:text-sm">
            <Building2 className="h-3.5 w-3.5" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-1.5 text-xs sm:text-sm">
            <Tag className="h-3.5 w-3.5" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-1.5 text-xs sm:text-sm">
            <Link2 className="h-3.5 w-3.5" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-1.5 text-xs sm:text-sm">
            <Database className="h-3.5 w-3.5" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-1.5 text-xs sm:text-sm">
            <Palette className="h-3.5 w-3.5" />
            Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <TabEmpresa />
        </TabsContent>

        <TabsContent value="usuarios">
          <TabUsuarios />
        </TabsContent>

        <TabsContent value="categorias">
          <TabCategorias />
        </TabsContent>

        <TabsContent value="integracoes">
          <TabIntegracoes />
        </TabsContent>

        <TabsContent value="backup">
          <TabBackup />
        </TabsContent>

        <TabsContent value="aparencia">
          <TabAparencia />
        </TabsContent>
      </Tabs>
    </div>
  );
}
