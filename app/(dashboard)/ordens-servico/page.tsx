"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ClipboardList, Plus, Pencil, Trash2, Eye, Play, CheckCircle2,
  XCircle, Clock, AlertTriangle, CircleDot, Square, CheckSquare, Share2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";

import { useOrdensServico, useColaboradores, useObras } from "@/hooks/use-storage-data";
import { OrdemServico, ChecklistItem } from "@/lib/mock-data";
import { generateId } from "@/lib/storage";

// ─── Zod schema ─────────────────────────────────────────────────────────────

const osSchema = z.object({
  cliente: z.string().min(2, "Informe o cliente"),
  local: z.string().min(2, "Informe o local"),
  tecnicoId: z.string().min(1, "Selecione um tecnico"),
  tecnico: z.string(),
  tipoServico: z.string().min(2, "Informe o tipo de servico"),
  descricao: z.string().min(3, "Informe a descricao"),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]),
  dataAgendada: z.string().optional(),
  valorEstimado: z.coerce.number().min(0, "Valor invalido"),
  observacoes: z.string().optional(),
});

type OSForm = z.infer<typeof osSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(dateStr: string) {
  try { return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR }); }
  catch { return dateStr; }
}

const STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_MATERIAL: "Aguardando material",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  ABERTA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EM_ANDAMENTO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  AGUARDANDO_MATERIAL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  FINALIZADA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELADA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const PRIORIDADE_COLORS: Record<string, string> = {
  BAIXA: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  MEDIA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ALTA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  URGENTE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const PRIORIDADE_LABELS: Record<string, string> = {
  BAIXA: "Baixa", MEDIA: "Media", ALTA: "Alta", URGENTE: "Urgente",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OrdensServicoPage() {
  const { ordens, loading, createOrdem, updateOrdem, deleteOrdem } = useOrdensServico();
  const { colaboradores } = useColaboradores();
  const { obras } = useObras();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [formObraId, setFormObraId] = useState<string | undefined>(undefined);

  // Filters
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterPrioridade, setFilterPrioridade] = useState("TODOS");
  const [filterTecnico, setFilterTecnico] = useState("TODOS");
  const [filtroObra, setFiltroObra] = useState<string>("TODOS");

  const form = useForm<OSForm>({
    resolver: zodResolver(osSchema),
    defaultValues: {
      cliente: "", local: "", tecnicoId: "", tecnico: "",
      tipoServico: "", descricao: "", prioridade: "MEDIA",
      dataAgendada: "", valorEstimado: 0, observacoes: "",
    },
  });

  // ─── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    total: ordens.length,
    emAndamento: ordens.filter((o) => o.status === "EM_ANDAMENTO").length,
    aguardando: ordens.filter((o) => o.status === "AGUARDANDO_MATERIAL").length,
    finalizadas: ordens.filter((o) => o.status === "FINALIZADA").length,
  }), [ordens]);

  // ─── Filtered ──────────────────────────────────────────────────────────────

  const ordensFiltradas = useMemo(() => {
    return ordens.filter((o) => {
      if (filterStatus !== "TODOS" && o.status !== filterStatus) return false;
      if (filterPrioridade !== "TODOS" && o.prioridade !== filterPrioridade) return false;
      if (filterTecnico !== "TODOS" && o.tecnico !== filterTecnico) return false;
      const matchObra = filtroObra === "TODOS" || o.obraId === filtroObra;
      if (!matchObra) return false;
      return true;
    });
  }, [ordens, filterStatus, filterPrioridade, filterTecnico, filtroObra]);

  const tecnicos = useMemo(() => {
    return Array.from(new Set(ordens.map((o) => o.tecnico))).sort();
  }, [ordens]);

  // ─── Form handlers ─────────────────────────────────────────────────────────

  function openNew() {
    setEditingId(null);
    setFormObraId(undefined);
    form.reset({
      cliente: "", local: "", tecnicoId: "", tecnico: "",
      tipoServico: "", descricao: "", prioridade: "MEDIA",
      dataAgendada: new Date().toISOString().split("T")[0], valorEstimado: 0, observacoes: "",
    });
    setDialogOpen(true);
  }

  function openEdit(os: OrdemServico) {
    setEditingId(os.id);
    setFormObraId(os.obraId);
    form.reset({
      cliente: os.cliente, local: os.local, tecnicoId: os.tecnicoId,
      tecnico: os.tecnico, tipoServico: os.tipoServico,
      descricao: os.descricao, prioridade: os.prioridade,
      dataAgendada: os.dataAgendada ?? "", valorEstimado: os.valorEstimado,
      observacoes: os.observacoes ?? "",
    });
    setDialogOpen(true);
  }

  function onSubmit(values: OSForm) {
    const tecnicoObj = colaboradores.find((c) => c.id === values.tecnicoId);
    const data = {
      ...values,
      tecnico: tecnicoObj?.nome ?? values.tecnico,
    };

    if (editingId) {
      updateOrdem(editingId, { ...data, obraId: formObraId });
    } else {
      const maxNumero = ordens.reduce((max, o) => Math.max(max, o.numero), 1000);
      createOrdem({
        ...data,
        numero: maxNumero + 1,
        obraId: formObraId,
        clienteId: undefined,
        status: "ABERTA",
        dataAbertura: new Date().toISOString().split("T")[0],
        checklist: [],
        materiais: [],
        fotos: [],
      });
    }
    setDialogOpen(false);
  }

  function confirmDelete() {
    if (deleteId) { deleteOrdem(deleteId); setDeleteId(null); setDetailId(null); }
  }

  // ─── Detail handlers ───────────────────────────────────────────────────────

  const detailOS = ordens.find((o) => o.id === detailId);

  function changeStatus(status: OrdemServico["status"]) {
    if (!detailId) return;
    const updates: Partial<OrdemServico> = { status };
    if (status === "EM_ANDAMENTO") {
      updates.horaInicio = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    if (status === "FINALIZADA") {
      updates.horaFim = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      updates.dataConclusao = new Date().toISOString().split("T")[0];
    }
    updateOrdem(detailId, updates);
  }

  function toggleChecklist(checkId: string) {
    if (!detailOS) return;
    const updated = detailOS.checklist.map((item) =>
      item.id === checkId ? { ...item, concluido: !item.concluido } : item
    );
    updateOrdem(detailOS.id, { checklist: updated });
  }

  function addChecklistItem() {
    if (!detailOS || !newChecklistItem.trim()) return;
    const newItem: ChecklistItem = { id: generateId(), descricao: newChecklistItem.trim(), concluido: false };
    updateOrdem(detailOS.id, { checklist: [...detailOS.checklist, newItem] });
    setNewChecklistItem("");
  }

  function shareWhatsApp(os: OrdemServico) {
    const text = encodeURIComponent(
      `*OS #${os.numero} - ${os.tipoServico}*\n\n` +
      `Cliente: ${os.cliente}\n` +
      `Local: ${os.local}\n` +
      `Tecnico: ${os.tecnico}\n` +
      `Status: ${STATUS_LABELS[os.status]}\n` +
      `Prioridade: ${PRIORIDADE_LABELS[os.prioridade]}\n` +
      `Valor: ${fmt(os.valorEstimado)}\n` +
      `Data: ${fmtDate(os.dataAbertura)}\n` +
      (os.descricao ? `\nDescricao: ${os.descricao}\n` : "") +
      `\n_Enviado via Smart Obra_`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  // ─── Columns ───────────────────────────────────────────────────────────────

  const columns = [
    { key: "numero", label: "N°", sortable: true, render: (o: OrdemServico) => <span className="font-mono font-medium">#{o.numero}</span> },
    { key: "cliente", label: "Cliente", sortable: true },
    { key: "tecnico", label: "Tecnico", sortable: true },
    { key: "tipoServico", label: "Tipo" },
    {
      key: "prioridade", label: "Prioridade",
      render: (o: OrdemServico) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORIDADE_COLORS[o.prioridade]}`}>
          {PRIORIDADE_LABELS[o.prioridade]}
        </span>
      ),
    },
    {
      key: "status", label: "Status",
      render: (o: OrdemServico) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status]}`}>
          {STATUS_LABELS[o.status]}
        </span>
      ),
    },
    {
      key: "dataAbertura", label: "Data", sortable: true,
      render: (o: OrdemServico) => fmtDate(o.dataAbertura),
    },
    {
      key: "valorEstimado", label: "Valor",
      render: (o: OrdemServico) => <span className="font-medium">{fmt(o.valorEstimado)}</span>,
    },
    {
      key: "acoes", label: "Acoes",
      render: (o: OrdemServico) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetailId(o.id)} className="rounded p-1 hover:bg-muted" title="Detalhes">
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => openEdit(o)} className="rounded p-1 hover:bg-muted" title="Editar">
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setDeleteId(o.id)} className="rounded p-1 hover:bg-muted" title="Excluir">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

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
        title="Ordens de Servico"
        breadcrumbs={[{ label: "Ordens de Servico" }]}
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova OS
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de OS" value={kpis.total} icon={ClipboardList} />
        <StatCard title="Em Andamento" value={kpis.emAndamento} icon={Play} />
        <StatCard title="Aguardando Material" value={kpis.aguardando} icon={Clock} />
        <StatCard title="Finalizadas" value={kpis.finalizadas} icon={CheckCircle2} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os status</SelectItem>
            <SelectItem value="ABERTA">Aberta</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
            <SelectItem value="AGUARDANDO_MATERIAL">Aguardando material</SelectItem>
            <SelectItem value="FINALIZADA">Finalizada</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas</SelectItem>
            <SelectItem value="BAIXA">Baixa</SelectItem>
            <SelectItem value="MEDIA">Media</SelectItem>
            <SelectItem value="ALTA">Alta</SelectItem>
            <SelectItem value="URGENTE">Urgente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTecnico} onValueChange={setFilterTecnico}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tecnico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            {tecnicos.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="TODOS">Todas as Obras</option>
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>{obra.nome}</option>
            ))}
          </select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => { setFilterStatus("TODOS"); setFilterPrioridade("TODOS"); setFilterTecnico("TODOS"); setFiltroObra("TODOS"); }}
        >
          Limpar filtros
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <DataTable
          data={ordensFiltradas}
          columns={columns}
          searchPlaceholder="Buscar por numero ou cliente..."
          pageSize={10}
        />
      </div>

      {/* ── New/Edit Dialog ────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar OS" : "Nova Ordem de Servico"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Atualize os dados da OS." : "Preencha os dados para criar uma nova OS."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Cliente *</Label>
                <Input {...form.register("cliente")} placeholder="Nome do cliente" />
                {form.formState.errors.cliente && <p className="text-xs text-red-500">{form.formState.errors.cliente.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Prioridade *</Label>
                <Select value={form.watch("prioridade")} onValueChange={(v) => form.setValue("prioridade", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="MEDIA">Media</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Local / Endereco *</Label>
              <Input {...form.register("local")} placeholder="Endereco completo" />
              {form.formState.errors.local && <p className="text-xs text-red-500">{form.formState.errors.local.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Tecnico Responsavel *</Label>
              <Select value={form.watch("tecnicoId")} onValueChange={(v) => { form.setValue("tecnicoId", v); const c = colaboradores.find(x => x.id === v); if (c) form.setValue("tecnico", c.nome); }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {colaboradores.filter(c => c.status === "ATIVO").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome} - {c.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.tecnicoId && <p className="text-xs text-red-500">{form.formState.errors.tecnicoId.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Tipo de Servico *</Label>
              <Input {...form.register("tipoServico")} placeholder="Ex: Instalacao Eletrica" />
              {form.formState.errors.tipoServico && <p className="text-xs text-red-500">{form.formState.errors.tipoServico.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Descricao *</Label>
              <Textarea {...form.register("descricao")} rows={3} placeholder="Descreva o servico..." />
              {form.formState.errors.descricao && <p className="text-xs text-red-500">{form.formState.errors.descricao.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Data Agendada</Label>
                <Input type="date" {...form.register("dataAgendada")} />
              </div>
              <div className="space-y-1">
                <Label>Valor Estimado (R$)</Label>
                <Input type="number" step="0.01" min="0" {...form.register("valorEstimado")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Observacoes</Label>
              <Textarea {...form.register("observacoes")} rows={2} placeholder="Observacoes adicionais..." />
            </div>

            <div>
              <label className="text-sm font-medium">Obra</label>
              <select
                value={formObraId || ""}
                onChange={(e) => setFormObraId(e.target.value || undefined)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Geral (sem obra)</option>
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>{obra.nome}</option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingId ? "Salvar" : "Criar OS"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!detailId} onOpenChange={(o) => { if (!o) setDetailId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailOS && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono">OS #{detailOS.numero}</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[detailOS.status]}`}>
                    {STATUS_LABELS[detailOS.status]}
                  </span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORIDADE_COLORS[detailOS.prioridade]}`}>
                    {PRIORIDADE_LABELS[detailOS.prioridade]}
                  </span>
                </DialogTitle>
                <DialogDescription>{detailOS.descricao}</DialogDescription>
              </DialogHeader>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="text-sm font-medium">{detailOS.cliente}</p></div>
                <div><p className="text-xs text-muted-foreground">Tecnico</p><p className="text-sm font-medium">{detailOS.tecnico}</p></div>
                <div><p className="text-xs text-muted-foreground">Local</p><p className="text-sm font-medium">{detailOS.local}</p></div>
                <div><p className="text-xs text-muted-foreground">Tipo</p><p className="text-sm font-medium">{detailOS.tipoServico}</p></div>
                <div><p className="text-xs text-muted-foreground">Data Abertura</p><p className="text-sm font-medium">{fmtDate(detailOS.dataAbertura)}</p></div>
                <div><p className="text-xs text-muted-foreground">Data Agendada</p><p className="text-sm font-medium">{detailOS.dataAgendada ? fmtDate(detailOS.dataAgendada) : "-"}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor Estimado</p><p className="text-sm font-medium">{fmt(detailOS.valorEstimado)}</p></div>
                <div><p className="text-xs text-muted-foreground">Horario</p><p className="text-sm font-medium">{detailOS.horaInicio ?? "-"} {detailOS.horaFim ? `ate ${detailOS.horaFim}` : ""}</p></div>
              </div>

              {/* Action buttons */}
              {detailOS.status !== "FINALIZADA" && detailOS.status !== "CANCELADA" && (
                <div className="flex flex-wrap gap-2">
                  {detailOS.status === "ABERTA" && (
                    <Button size="sm" onClick={() => changeStatus("EM_ANDAMENTO")}>
                      <Play className="mr-1 h-3 w-3" /> Iniciar
                    </Button>
                  )}
                  {(detailOS.status === "EM_ANDAMENTO" || detailOS.status === "AGUARDANDO_MATERIAL") && (
                    <Button size="sm" variant="default" onClick={() => changeStatus("FINALIZADA")}>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Finalizar
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => changeStatus("CANCELADA")}>
                    <XCircle className="mr-1 h-3 w-3" /> Cancelar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareWhatsApp(detailOS)} className="ml-auto">
                    <Share2 className="mr-1 h-3 w-3" /> WhatsApp
                  </Button>
                </div>
              )}

              {/* Checklist */}
              <div className="space-y-3">
                <h4 className="font-semibold">Checklist</h4>
                <div className="space-y-2">
                  {detailOS.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border p-2">
                      <button onClick={() => toggleChecklist(item.id)} className="shrink-0">
                        {item.concluido ? (
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <span className={item.concluido ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                        {item.descricao}
                      </span>
                    </div>
                  ))}
                  {detailOS.checklist.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum item no checklist</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Novo item..."
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChecklistItem(); } }}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={addChecklistItem} disabled={!newChecklistItem.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {detailOS.checklist.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {detailOS.checklist.filter(i => i.concluido).length}/{detailOS.checklist.length} concluidos
                  </p>
                )}
              </div>

              {/* Observacoes */}
              {detailOS.observacoes && (
                <div className="space-y-1">
                  <h4 className="font-semibold">Observacoes</h4>
                  <p className="text-sm text-muted-foreground">{detailOS.observacoes}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => shareWhatsApp(detailOS)}>
                  <Share2 className="mr-1 h-3 w-3" /> Compartilhar WhatsApp
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteId(detailOS.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Excluir
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir OS</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir esta ordem de servico? Esta acao nao pode ser desfeita.</DialogDescription>
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
