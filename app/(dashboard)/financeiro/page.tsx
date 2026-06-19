"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Plus, Pencil, Trash2, Check, Clock,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { format, parseISO, differenceInDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";

import { useLancamentos } from "@/hooks/use-storage-data";
import { useObras } from "@/hooks/use-storage-data";
import { categoriasFinanceiras, LancamentoFinanceiro } from "@/lib/mock-data";
import { generateId } from "@/lib/storage";

// ─── Zod schema ─────────────────────────────────────────────────────────────

const lancamentoSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoria: z.string().min(1, "Selecione uma categoria"),
  descricao: z.string().min(2, "Informe uma descrição"),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  data: z.string().min(1, "Informe a data"),
  dataPagamento: z.string().optional(),
  status: z.enum(["PENDENTE", "PAGO", "VENCIDO", "CANCELADO"]),
  obraId: z.string().optional(),
  fornecedorCliente: z.string().optional(),
  observacoes: z.string().optional(),
  parcelas: z.coerce.number().min(1).max(60).default(1),
});

type LancamentoForm = z.infer<typeof lancamentoSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(dateStr: string) {
  try { return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR }); }
  catch { return dateStr; }
}

function addMonths(dateStr: string, months: number): string {
  const d = parseISO(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente", PAGO: "Pago", VENCIDO: "Vencido", CANCELADO: "Cancelado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDENTE: "secondary",
  PAGO: "default",
  VENCIDO: "destructive",
  CANCELADO: "outline",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const { lancamentos, loading, createLancamento, updateLancamento, deleteLancamento } = useLancamentos();
  const { obras } = useObras();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters – Lançamentos tab
  const [filterTipo, setFilterTipo] = useState("TODOS");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [filterCategoria, setFilterCategoria] = useState("TODOS");
  const [filterMes, setFilterMes] = useState("TODOS");

  // Fluxo filter
  const [fluxoAno, setFluxoAno] = useState(String(new Date().getFullYear()));

  // Global obra filter (Lançamentos tab)
  const [filtroObraGlobal, setFiltroObraGlobal] = useState<string>("TODOS");

  // DRE filters
  const [dreAno, setDreAno] = useState(String(new Date().getFullYear()));
  const [dreMes, setDreMes] = useState("TODOS");
  const [dreObraId, setDreObraId] = useState("TODOS");

  // Form
  const form = useForm<LancamentoForm>({
    resolver: zodResolver(lancamentoSchema),
    defaultValues: {
      tipo: "DESPESA", categoria: "", descricao: "", valor: 0,
      data: new Date().toISOString().split("T")[0], status: "PENDENTE",
      parcelas: 1,
    },
  });
  const tipoWatch = form.watch("tipo");
  const parcelasWatch = form.watch("parcelas") ?? 1;

  // ─── KPI calculations ────────────────────────────────────────────────────

  const hoje = new Date().toISOString().split("T")[0];
  const mesAtual = hoje.slice(0, 7);

  const kpis = useMemo(() => {
    const aReceber = lancamentos
      .filter((l) => l.tipo === "RECEITA" && (l.status === "PENDENTE" || l.status === "VENCIDO"))
      .reduce((s, l) => s + l.valor, 0);
    const aPagar = lancamentos
      .filter((l) => l.tipo === "DESPESA" && (l.status === "PENDENTE" || l.status === "VENCIDO"))
      .reduce((s, l) => s + l.valor, 0);
    const recebidoMes = lancamentos
      .filter((l) => l.tipo === "RECEITA" && l.status === "PAGO" && l.dataPagamento?.startsWith(mesAtual))
      .reduce((s, l) => s + l.valor, 0);
    const pagoMes = lancamentos
      .filter((l) => l.tipo === "DESPESA" && l.status === "PAGO" && l.dataPagamento?.startsWith(mesAtual))
      .reduce((s, l) => s + l.valor, 0);
    const saldo = recebidoMes - pagoMes;
    const vencidas = lancamentos.filter(
      (l) => l.status === "PENDENTE" && l.data < hoje,
    ).length;
    return { aReceber, aPagar, recebidoMes, pagoMes, saldo, vencidas };
  }, [lancamentos, hoje, mesAtual]);

  // ─── Filtered lancamentos ────────────────────────────────────────────────

  const lancamentosFiltradosPorObra = useMemo(() => {
    if (filtroObraGlobal === "TODOS") return lancamentos;
    return lancamentos.filter((l) => l.obraId === filtroObraGlobal);
  }, [lancamentos, filtroObraGlobal]);

  const lancamentosFiltrados = useMemo(() => {
    return lancamentosFiltradosPorObra.filter((l) => {
      if (filterTipo !== "TODOS" && l.tipo !== filterTipo) return false;
      if (filterStatus !== "TODOS" && l.status !== filterStatus) return false;
      if (filterCategoria !== "TODOS" && l.categoria !== filterCategoria) return false;
      if (filterMes !== "TODOS" && !l.data.startsWith(filterMes)) return false;
      return true;
    });
  }, [lancamentosFiltradosPorObra, filterTipo, filterStatus, filterCategoria, filterMes]);

  // ─── Form open/close ─────────────────────────────────────────────────────

  function openNew() {
    setEditingId(null);
    form.reset({
      tipo: "DESPESA", categoria: "", descricao: "", valor: 0,
      data: hoje, status: "PENDENTE", parcelas: 1,
    });
    setDialogOpen(true);
  }

  function openEdit(l: LancamentoFinanceiro) {
    setEditingId(l.id);
    form.reset({
      tipo: l.tipo, categoria: l.categoria, descricao: l.descricao,
      valor: l.valor, data: l.data, dataPagamento: l.dataPagamento ?? "",
      status: l.status, obraId: l.obraId ?? "", fornecedorCliente: l.fornecedorCliente ?? "",
      observacoes: l.observacoes ?? "", parcelas: 1,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: LancamentoForm) {
    const { parcelas, ...rest } = values;
    const base = {
      ...rest,
      obraId: rest.obraId || undefined,
      dataPagamento: rest.dataPagamento || undefined,
      fornecedorCliente: rest.fornecedorCliente || undefined,
      observacoes: rest.observacoes || undefined,
    };

    if (editingId) {
      updateLancamento(editingId, base);
    } else {
      const numParcelas = Math.max(1, parcelas ?? 1);
      if (numParcelas === 1) {
        createLancamento({ ...base, parcela: undefined, totalParcelas: undefined });
      } else {
        const valorParcela = base.valor / numParcelas;
        for (let i = 1; i <= numParcelas; i++) {
          createLancamento({
            ...base,
            descricao: `${base.descricao} (${i}/${numParcelas})`,
            valor: Math.round(valorParcela * 100) / 100,
            data: addMonths(base.data, i - 1),
            parcela: i,
            totalParcelas: numParcelas,
          });
        }
      }
    }
    setDialogOpen(false);
  }

  function confirmDelete() {
    if (deleteId) { deleteLancamento(deleteId); setDeleteId(null); }
  }

  function marcarPago(l: LancamentoFinanceiro) {
    updateLancamento(l.id, { status: "PAGO", dataPagamento: hoje });
  }

  // ─── Months list for filter ──────────────────────────────────────────────

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(lancamentos.map((l) => l.data.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [lancamentos]);

  const todasCategorias = useMemo(() => {
    return Array.from(new Set(lancamentos.map((l) => l.categoria))).sort();
  }, [lancamentos]);

  // ─── Fluxo de caixa data ──────────────────────────────────────────────────

  const fluxoData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const mm = String(i + 1).padStart(2, "0");
      return `${fluxoAno}-${mm}`;
    });
    let saldoAcum = 0;
    return months.map((ym) => {
      const entradas = lancamentos
        .filter((l) => l.tipo === "RECEITA" && l.data.startsWith(ym) && l.status === "PAGO")
        .reduce((s, l) => s + l.valor, 0);
      const saidas = lancamentos
        .filter((l) => l.tipo === "DESPESA" && l.data.startsWith(ym) && l.status === "PAGO")
        .reduce((s, l) => s + l.valor, 0);
      saldoAcum += entradas - saidas;
      const label = format(parseISO(`${ym}-01`), "MMM", { locale: ptBR });
      return { mes: label, entradas, saidas, saldo: saldoAcum };
    });
  }, [lancamentos, fluxoAno]);

  const fluxoTableRows = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const mm = String(i + 1).padStart(2, "0");
      return `${fluxoAno}-${mm}`;
    });
    return months.map((ym) => {
      const entradas = lancamentos
        .filter((l) => l.tipo === "RECEITA" && l.data.startsWith(ym))
        .reduce((s, l) => s + l.valor, 0);
      const saidas = lancamentos
        .filter((l) => l.tipo === "DESPESA" && l.data.startsWith(ym))
        .reduce((s, l) => s + l.valor, 0);
      const saldo = entradas - saidas;
      const label = format(parseISO(`${ym}-01`), "MMMM/yyyy", { locale: ptBR });
      return { ym, label, entradas, saidas, saldo };
    });
  }, [lancamentos, fluxoAno]);

  // ─── DRE data ─────────────────────────────────────────────────────────────

  const dreData = useMemo(() => {
    const filtrar = (l: LancamentoFinanceiro) => {
      if (!l.data.startsWith(dreAno)) return false;
      if (dreMes !== "TODOS" && !l.data.startsWith(`${dreAno}-${dreMes}`)) return false;
      if (dreObraId !== "TODOS" && l.obraId !== dreObraId) return false;
      return true;
    };
    const filtered = lancamentos.filter(filtrar);

    const receitas = filtered.filter((l) => l.tipo === "RECEITA");
    const despesas = filtered.filter((l) => l.tipo === "DESPESA");

    const receitaTotal = receitas.reduce((s, l) => s + l.valor, 0);
    const despesaTotal = despesas.reduce((s, l) => s + l.valor, 0);
    const lucro = receitaTotal - despesaTotal;

    const byCategoria = (items: LancamentoFinanceiro[]) => {
      const map: Record<string, number> = {};
      items.forEach((l) => { map[l.categoria] = (map[l.categoria] ?? 0) + l.valor; });
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    return {
      receitas: byCategoria(receitas),
      despesas: byCategoria(despesas),
      receitaTotal,
      despesaTotal,
      lucro,
    };
  }, [lancamentos, dreAno, dreMes, dreObraId]);

  const anosDisponiveis = useMemo(() => {
    const set = new Set(lancamentos.map((l) => l.data.slice(0, 4)));
    return Array.from(set).sort().reverse();
  }, [lancamentos]);

  // ─── Columns ──────────────────────────────────────────────────────────────

  const colsLancamentos = [
    {
      key: "data", label: "Data", sortable: true,
      render: (l: LancamentoFinanceiro) => fmtDate(l.data),
    },
    {
      key: "tipo", label: "Tipo",
      render: (l: LancamentoFinanceiro) => (
        <Badge variant={l.tipo === "RECEITA" ? "default" : "destructive"}>
          {l.tipo === "RECEITA" ? "Receita" : "Despesa"}
        </Badge>
      ),
    },
    { key: "categoria", label: "Categoria", sortable: true },
    { key: "descricao", label: "Descrição", sortable: true },
    {
      key: "valor", label: "Valor", sortable: true,
      render: (l: LancamentoFinanceiro) => (
        <span className={l.tipo === "RECEITA" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {l.tipo === "RECEITA" ? "+" : "-"}{fmt(l.valor)}
        </span>
      ),
    },
    {
      key: "status", label: "Status",
      render: (l: LancamentoFinanceiro) => (
        <Badge variant={STATUS_VARIANT[l.status]}>{STATUS_LABELS[l.status]}</Badge>
      ),
    },
    { key: "fornecedorCliente", label: "Fornecedor/Cliente" },
    {
      key: "acoes", label: "Ações",
      render: (l: LancamentoFinanceiro) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(l)} className="rounded p-1 hover:bg-muted" title="Editar">
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setDeleteId(l.id)} className="rounded p-1 hover:bg-muted" title="Excluir">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  const colsAPagar = [
    {
      key: "data", label: "Vencimento", sortable: true,
      render: (l: LancamentoFinanceiro) => {
        const vencida = l.status !== "PAGO" && l.data < hoje;
        return <span className={vencida ? "text-red-600 font-medium" : ""}>{fmtDate(l.data)}</span>;
      },
    },
    { key: "categoria", label: "Categoria", sortable: true },
    { key: "descricao", label: "Descrição", sortable: true },
    {
      key: "valor", label: "Valor",
      render: (l: LancamentoFinanceiro) => <span className="text-red-600 font-medium">{fmt(l.valor)}</span>,
    },
    { key: "fornecedorCliente", label: "Fornecedor" },
    {
      key: "status", label: "Status",
      render: (l: LancamentoFinanceiro) => (
        <Badge variant={STATUS_VARIANT[l.status]}>{STATUS_LABELS[l.status]}</Badge>
      ),
    },
    {
      key: "pagar", label: "",
      render: (l: LancamentoFinanceiro) => (
        l.status !== "PAGO" ? (
          <Button size="sm" variant="outline" onClick={() => marcarPago(l)}>
            <Check className="mr-1 h-3 w-3" /> Pagar
          </Button>
        ) : null
      ),
    },
  ];

  const colsAReceber = [
    {
      key: "data", label: "Vencimento", sortable: true,
      render: (l: LancamentoFinanceiro) => fmtDate(l.data),
    },
    { key: "categoria", label: "Categoria", sortable: true },
    { key: "descricao", label: "Descrição", sortable: true },
    {
      key: "valor", label: "Valor",
      render: (l: LancamentoFinanceiro) => <span className="text-green-600 font-medium">{fmt(l.valor)}</span>,
    },
    { key: "fornecedorCliente", label: "Cliente" },
    {
      key: "atraso", label: "Situação",
      render: (l: LancamentoFinanceiro) => {
        const dias = differenceInDays(new Date(), parseISO(l.data));
        if (dias > 0) {
          return (
            <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
              <AlertCircle className="h-3 w-3" />{dias}d atraso
            </span>
          );
        }
        return (
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="h-3 w-3" />Aguardando
          </span>
        );
      },
    },
    {
      key: "receber", label: "",
      render: (l: LancamentoFinanceiro) => (
        <Button size="sm" variant="outline" onClick={() => marcarPago(l)}>
          <CheckCircle2 className="mr-1 h-3 w-3" /> Receber
        </Button>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  const despesasPendentes = lancamentos.filter(
    (l) => l.tipo === "DESPESA" && (l.status === "PENDENTE" || l.status === "VENCIDO"),
  );
  const despesasVencidas = despesasPendentes.filter((l) => l.data < hoje);
  const receitasPendentes = lancamentos.filter(
    (l) => l.tipo === "RECEITA" && l.status === "PENDENTE",
  );

  return (
    <div>
      <PageHeader
        title="Financeiro"
        breadcrumbs={[{ label: "Financeiro" }]}
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lançamento
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="A Receber" value={fmt(kpis.aReceber)} icon={TrendingUp} className="xl:col-span-1" />
        <StatCard title="A Pagar" value={fmt(kpis.aPagar)} icon={TrendingDown} className="xl:col-span-1" />
        <StatCard title="Recebido este mês" value={fmt(kpis.recebidoMes)} icon={TrendingUp} className="xl:col-span-1" />
        <StatCard title="Pago este mês" value={fmt(kpis.pagoMes)} icon={TrendingDown} className="xl:col-span-1" />
        <StatCard
          title="Saldo do mês"
          value={fmt(kpis.saldo)}
          icon={DollarSign}
          className={kpis.saldo >= 0 ? "xl:col-span-1" : "xl:col-span-1 border-red-200 dark:border-red-800"}
        />
        <StatCard
          title="Contas vencidas"
          value={kpis.vencidas}
          icon={AlertCircle}
          className={kpis.vencidas > 0 ? "xl:col-span-1 border-red-200 dark:border-red-800" : "xl:col-span-1"}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lancamentos">
        <TabsList className="mb-6">
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="apagar">
            Contas a Pagar
            {despesasVencidas.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                {despesasVencidas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="areceber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
        </TabsList>

        {/* ── Tab Lançamentos ─────────────────────────────────────────── */}
        <TabsContent value="lancamentos">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-3">
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os tipos</SelectItem>
                <SelectItem value="RECEITA">Receita</SelectItem>
                <SelectItem value="DESPESA">Despesa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os status</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
                <SelectItem value="VENCIDO">Vencido</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas as categorias</SelectItem>
                {todasCategorias.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMes} onValueChange={setFilterMes}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os períodos</SelectItem>
                {mesesDisponiveis.map((m) => (
                  <SelectItem key={m} value={m}>
                    {format(parseISO(`${m}-01`), "MMMM/yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <select
              value={filtroObraGlobal}
              onChange={(e) => setFiltroObraGlobal(e.target.value)}
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
              onClick={() => { setFilterTipo("TODOS"); setFilterStatus("TODOS"); setFilterCategoria("TODOS"); setFilterMes("TODOS"); }}
            >
              Limpar filtros
            </Button>
          </div>

          <DataTable
            data={lancamentosFiltrados}
            columns={colsLancamentos}
            searchPlaceholder="Buscar lançamentos..."
            pageSize={15}
          />
        </TabsContent>

        {/* ── Tab Contas a Pagar ──────────────────────────────────────── */}
        <TabsContent value="apagar">
          {despesasVencidas.length > 0 && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  {despesasVencidas.length} conta{despesasVencidas.length > 1 ? "s" : ""} vencida{despesasVencidas.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">
                  Total vencido: {fmt(despesasVencidas.reduce((s, l) => s + l.valor, 0))}
                </p>
              </div>
            </div>
          )}
          <DataTable
            data={despesasPendentes}
            columns={colsAPagar}
            searchPlaceholder="Buscar contas a pagar..."
            pageSize={15}
          />
        </TabsContent>

        {/* ── Tab Contas a Receber ────────────────────────────────────── */}
        <TabsContent value="areceber">
          <DataTable
            data={receitasPendentes}
            columns={colsAReceber}
            searchPlaceholder="Buscar contas a receber..."
            pageSize={15}
          />
        </TabsContent>

        {/* ── Tab Fluxo de Caixa ──────────────────────────────────────── */}
        <TabsContent value="fluxo">
          <div className="mb-4 flex items-center gap-3">
            <Label>Ano:</Label>
            <Select value={fluxoAno} onValueChange={setFluxoAno}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monthly table */}
          <div className="mb-6 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mês</th>
                  <th className="px-4 py-3 text-right font-medium text-green-600">Entradas</th>
                  <th className="px-4 py-3 text-right font-medium text-red-600">Saídas</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {fluxoTableRows.map((row) => (
                  <tr key={row.ym} className="border-b transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 capitalize">{row.label}</td>
                    <td className="px-4 py-3 text-right text-green-600">{fmt(row.entradas)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{fmt(row.saidas)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${row.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {fmt(row.saldo)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {fmt(fluxoTableRows.reduce((s, r) => s + r.entradas, 0))}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {fmt(fluxoTableRows.reduce((s, r) => s + r.saidas, 0))}
                  </td>
                  <td className={`px-4 py-3 text-right ${fluxoTableRows.reduce((s, r) => s + r.saldo, 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {fmt(fluxoTableRows.reduce((s, r) => s + r.saldo, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bar Chart – Entradas x Saídas */}
          <div className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Entradas vs Saídas</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fluxoData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart – Saldo acumulado */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Saldo Acumulado</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={fluxoData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo acumulado"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* ── Tab DRE ─────────────────────────────────────────────────── */}
        <TabsContent value="dre">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label>Ano:</Label>
              <Select value={dreAno} onValueChange={setDreAno}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Mês:</Label>
              <Select value={dreMes} onValueChange={setDreMes}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Ano inteiro</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => {
                    const mm = String(i + 1).padStart(2, "0");
                    return (
                      <SelectItem key={mm} value={mm}>
                        {format(parseISO(`${dreAno}-${mm}-01`), "MMMM", { locale: ptBR })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Obra:</Label>
              <Select value={dreObraId} onValueChange={setDreObraId}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas as obras</SelectItem>
                  {obras.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* Receitas section */}
            <div className="border-b">
              <div className="flex items-center justify-between bg-green-50 px-6 py-3 dark:bg-green-950/20">
                <span className="font-semibold text-green-700 dark:text-green-400">RECEITAS BRUTAS</span>
                <span className="font-bold text-green-700 dark:text-green-400">{fmt(dreData.receitaTotal)}</span>
              </div>
              {dreData.receitas.map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between border-b px-8 py-2.5 last:border-b-0 hover:bg-muted/20">
                  <span className="text-sm text-muted-foreground">{cat}</span>
                  <span className="text-sm text-green-600">{fmt(val)}</span>
                </div>
              ))}
              {dreData.receitas.length === 0 && (
                <div className="px-8 py-3 text-sm text-muted-foreground">Sem receitas no período</div>
              )}
            </div>

            {/* Despesas section */}
            <div className="border-b">
              <div className="flex items-center justify-between bg-red-50 px-6 py-3 dark:bg-red-950/20">
                <span className="font-semibold text-red-700 dark:text-red-400">CUSTOS E DESPESAS</span>
                <span className="font-bold text-red-700 dark:text-red-400">({fmt(dreData.despesaTotal)})</span>
              </div>
              {dreData.despesas.map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between border-b px-8 py-2.5 last:border-b-0 hover:bg-muted/20">
                  <span className="text-sm text-muted-foreground">{cat}</span>
                  <span className="text-sm text-red-600">({fmt(val)})</span>
                </div>
              ))}
              {dreData.despesas.length === 0 && (
                <div className="px-8 py-3 text-sm text-muted-foreground">Sem despesas no período</div>
              )}
            </div>

            {/* Resultado */}
            <div className={`flex items-center justify-between px-6 py-4 ${dreData.lucro >= 0 ? "bg-green-100 dark:bg-green-950/40" : "bg-red-100 dark:bg-red-950/40"}`}>
              <span className={`text-base font-bold ${dreData.lucro >= 0 ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
                {dreData.lucro >= 0 ? "LUCRO LÍQUIDO" : "PREJUÍZO LÍQUIDO"}
              </span>
              <span className={`text-xl font-bold ${dreData.lucro >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {fmt(dreData.lucro)}
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── New/Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Atualize os dados do lançamento." : "Preencha os dados para criar um novo lançamento financeiro."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo *</Label>
                <Select
                  value={form.watch("tipo")}
                  onValueChange={(v) => { form.setValue("tipo", v as "RECEITA" | "DESPESA"); form.setValue("categoria", ""); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEITA">Receita</SelectItem>
                    <SelectItem value="DESPESA">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Status *</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="PAGO">Pago</SelectItem>
                    <SelectItem value="VENCIDO">Vencido</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <Label>Categoria *</Label>
              <Select
                value={form.watch("categoria")}
                onValueChange={(v) => form.setValue("categoria", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {(tipoWatch === "RECEITA" ? categoriasFinanceiras.receita : categoriasFinanceiras.despesa).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoria && (
                <p className="text-xs text-red-500">{form.formState.errors.categoria.message}</p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <Label>Descrição *</Label>
              <Input {...form.register("descricao")} placeholder="Ex: Pagamento material elétrico" />
              {form.formState.errors.descricao && (
                <p className="text-xs text-red-500">{form.formState.errors.descricao.message}</p>
              )}
            </div>

            {/* Valor + Data */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" {...form.register("valor")} />
                {form.formState.errors.valor && (
                  <p className="text-xs text-red-500">{form.formState.errors.valor.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Data de vencimento *</Label>
                <Input type="date" {...form.register("data")} />
              </div>
            </div>

            {/* Parcelas (only on create) */}
            {!editingId && (
              <div className="space-y-1">
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  {...form.register("parcelas")}
                />
                {parcelasWatch > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {parcelasWatch}x de {fmt((form.watch("valor") ?? 0) / parcelasWatch)} — vencimentos mensais a partir de {fmtDate(form.watch("data") ?? hoje)}
                  </p>
                )}
              </div>
            )}

            {/* Data pagamento */}
            <div className="space-y-1">
              <Label>Data de pagamento</Label>
              <Input type="date" {...form.register("dataPagamento")} />
            </div>

            {/* Obra */}
            <div className="space-y-1">
              <Label>Obra</Label>
              <Select
                value={form.watch("obraId") ?? ""}
                onValueChange={(v) => form.setValue("obraId", v === "NENHUMA" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NENHUMA">Nenhuma</SelectItem>
                  {obras.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fornecedor/Cliente */}
            <div className="space-y-1">
              <Label>{tipoWatch === "RECEITA" ? "Cliente" : "Fornecedor"}</Label>
              <Input {...form.register("fornecedorCliente")} placeholder="Nome do fornecedor ou cliente" />
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea {...form.register("observacoes")} rows={2} placeholder="Anotações adicionais..." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Salvar alterações" : "Criar lançamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir lançamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </DialogDescription>
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
