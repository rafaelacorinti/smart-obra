"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, Plus, Pencil, Trash2, Eye, UserCheck, UserX, DollarSign,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";

import { useColaboradores } from "@/hooks/use-storage-data";
import { Colaborador } from "@/lib/mock-data";

const colaboradorSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().min(11, "CPF invalido"),
  cargo: z.string().min(2, "Informe o cargo"),
  telefone: z.string().min(8, "Telefone invalido"),
  endereco: z.string().min(5, "Informe o endereco"),
  salario: z.coerce.number().positive("Salario deve ser positivo"),
  dataAdmissao: z.string().min(1, "Informe a data de admissao"),
  status: z.enum(["ATIVO", "INATIVO", "FERIAS"]),
});

type ColaboradorForm = z.infer<typeof colaboradorSchema>;

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const STATUS_COLORS: Record<string, string> = {
  ATIVO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INATIVO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  FERIAS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo", INATIVO: "Inativo", FERIAS: "Ferias",
};

export default function ColaboradoresPage() {
  const router = useRouter();
  const { colaboradores, loading, createColaborador, updateColaborador, deleteColaborador } = useColaboradores();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterCargo, setFilterCargo] = useState("TODOS");

  const form = useForm<ColaboradorForm>({
    resolver: zodResolver(colaboradorSchema),
    defaultValues: {
      nome: "", cpf: "", cargo: "", telefone: "", endereco: "",
      salario: 0, dataAdmissao: "", status: "ATIVO",
    },
  });

  const kpis = useMemo(() => ({
    total: colaboradores.length,
    ativos: colaboradores.filter((c) => c.status === "ATIVO").length,
    ferias: colaboradores.filter((c) => c.status === "FERIAS").length,
    folha: colaboradores.filter((c) => c.status === "ATIVO").reduce((s, c) => s + c.salario, 0),
  }), [colaboradores]);

  const cargos = useMemo(() => {
    return Array.from(new Set(colaboradores.map((c) => c.cargo))).sort();
  }, [colaboradores]);

  const filtrados = useMemo(() => {
    return colaboradores.filter((c) => {
      if (filterStatus !== "TODOS" && c.status !== filterStatus) return false;
      if (filterCargo !== "TODOS" && c.cargo !== filterCargo) return false;
      return true;
    });
  }, [colaboradores, filterStatus, filterCargo]);

  function openNew() {
    setEditingId(null);
    form.reset({ nome: "", cpf: "", cargo: "", telefone: "", endereco: "", salario: 0, dataAdmissao: new Date().toISOString().split("T")[0], status: "ATIVO" });
    setDialogOpen(true);
  }

  function openEdit(c: Colaborador) {
    setEditingId(c.id);
    form.reset({ nome: c.nome, cpf: c.cpf, cargo: c.cargo, telefone: c.telefone, endereco: c.endereco, salario: c.salario, dataAdmissao: c.dataAdmissao, status: c.status });
    setDialogOpen(true);
  }

  function onSubmit(values: ColaboradorForm) {
    if (editingId) {
      updateColaborador(editingId, values);
    } else {
      createColaborador(values);
    }
    setDialogOpen(false);
  }

  function confirmDelete() {
    if (deleteId) { deleteColaborador(deleteId); setDeleteId(null); }
  }

  const columns = [
    { key: "nome", label: "Nome", sortable: true },
    { key: "cargo", label: "Funcao", sortable: true },
    { key: "telefone", label: "Telefone" },
    {
      key: "status", label: "Status",
      render: (c: Colaborador) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
          {STATUS_LABELS[c.status]}
        </span>
      ),
    },
    {
      key: "salario", label: "Salario",
      render: (c: Colaborador) => <span className="font-medium">{fmt(c.salario)}</span>,
    },
    {
      key: "acoes", label: "Acoes",
      render: (c: Colaborador) => (
        <div className="flex items-center gap-1">
          <button onClick={() => router.push(`/colaboradores/${c.id}`)} className="rounded p-1 hover:bg-muted" title="Detalhes">
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => openEdit(c)} className="rounded p-1 hover:bg-muted" title="Editar">
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setDeleteId(c.id)} className="rounded p-1 hover:bg-muted" title="Excluir">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        breadcrumbs={[{ label: "Colaboradores" }]}
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Colaborador
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={kpis.total} icon={Users} />
        <StatCard title="Ativos" value={kpis.ativos} icon={UserCheck} />
        <StatCard title="Em Ferias" value={kpis.ferias} icon={UserX} />
        <StatCard title="Folha Mensal" value={fmt(kpis.folha)} icon={DollarSign} />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="ATIVO">Ativo</SelectItem>
            <SelectItem value="INATIVO">Inativo</SelectItem>
            <SelectItem value="FERIAS">Ferias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCargo} onValueChange={setFilterCargo}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Funcao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas</SelectItem>
            {cargos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => { setFilterStatus("TODOS"); setFilterCargo("TODOS"); }}>
          Limpar filtros
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <DataTable data={filtrados} columns={columns} searchPlaceholder="Buscar colaboradores..." pageSize={10} />
      </div>

      {/* New/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
            <DialogDescription>{editingId ? "Atualize os dados." : "Preencha os dados do novo colaborador."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input {...form.register("nome")} placeholder="Nome completo" />
                {form.formState.errors.nome && <p className="text-xs text-red-500">{form.formState.errors.nome.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>CPF *</Label>
                <Input {...form.register("cpf")} placeholder="000.000.000-00" />
                {form.formState.errors.cpf && <p className="text-xs text-red-500">{form.formState.errors.cpf.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Cargo *</Label>
                <Input {...form.register("cargo")} placeholder="Ex: Pedreiro" />
                {form.formState.errors.cargo && <p className="text-xs text-red-500">{form.formState.errors.cargo.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Telefone *</Label>
                <Input {...form.register("telefone")} placeholder="(11) 99999-0000" />
                {form.formState.errors.telefone && <p className="text-xs text-red-500">{form.formState.errors.telefone.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Endereco *</Label>
              <Input {...form.register("endereco")} placeholder="Endereco completo" />
              {form.formState.errors.endereco && <p className="text-xs text-red-500">{form.formState.errors.endereco.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Salario (R$) *</Label>
                <Input type="number" step="0.01" min="0" {...form.register("salario")} />
                {form.formState.errors.salario && <p className="text-xs text-red-500">{form.formState.errors.salario.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Data Admissao *</Label>
                <Input type="date" {...form.register("dataAdmissao")} />
              </div>
              <div className="space-y-1">
                <Label>Status *</Label>
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="FERIAS">Ferias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingId ? "Salvar" : "Criar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir colaborador</DialogTitle>
            <DialogDescription>Tem certeza? Esta acao nao pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
