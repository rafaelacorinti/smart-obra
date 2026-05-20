"use client";

import { useEffect, useState } from "react";
import {
  Building2, DollarSign, ClipboardList, Users, TrendingUp,
  TrendingDown, CheckCircle2, AlertTriangle, Clock, Calendar as CalendarIcon,
  Activity, Banknote, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useObras, useLancamentos, useOrdensServico, useColaboradores, useEventosCalendario } from "@/hooks/use-storage-data";
import { formatCurrency } from "@/lib/utils";
import DashboardInsights from "@/components/dashboard-insights";

const COLORS = ["#1e40af", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const { obras, loading: loadingObras } = useObras();
  const { lancamentos, loading: loadingFin } = useLancamentos();
  const { ordens, loading: loadingOS } = useOrdensServico();
  const { colaboradores, loading: loadingCol } = useColaboradores();
  const { eventos, loading: loadingEv } = useEventosCalendario();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const loading = !mounted || loadingObras || loadingFin || loadingOS || loadingCol;

  // KPI calculations
  const totalFaturado = lancamentos.filter((l) => l.tipo === "RECEITA" && l.status === "PAGO").reduce((sum, l) => sum + l.valor, 0);
  const totalGasto = lancamentos.filter((l) => l.tipo === "DESPESA" && l.status === "PAGO").reduce((sum, l) => sum + l.valor, 0);
  const lucroLiquido = totalFaturado - totalGasto;
  const obrasAndamento = obras.filter((o) => o.status === "EM_ANDAMENTO").length;
  const obrasConcluidas = obras.filter((o) => o.status === "CONCLUIDA").length;
  const funcionariosAtivos = colaboradores.filter((c) => c.status === "ATIVO").length;
  const osAbertas = ordens.filter((o) => o.status === "ABERTA" || o.status === "EM_ANDAMENTO" || o.status === "AGUARDANDO_MATERIAL").length;
  const osConcluidas = ordens.filter((o) => o.status === "FINALIZADA").length;

  // Chart data: Last 6 months
  const meses = ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago"];
  const faturamentoMensal = [
    { mes: "Mar", faturamento: 240000, despesas: 120000 },
    { mes: "Abr", faturamento: 112500, despesas: 113000 },
    { mes: "Mai", faturamento: 0, despesas: 147000 },
    { mes: "Jun", faturamento: 352500, despesas: 75500 },
    { mes: "Jul", faturamento: 57500, despesas: 135000 },
    { mes: "Ago", faturamento: 392500, despesas: 138000 },
  ];

  const despesasPorCategoria = [
    { name: "Material", value: 340000 },
    { name: "Mao de obra", value: 288000 },
    { name: "Equipamentos", value: 37500 },
    { name: "Projeto", value: 85000 },
    { name: "Administrativa", value: 8500 },
    { name: "Topografia", value: 15000 },
  ];

  const lucroMensal = [
    { mes: "Mar", lucro: 120000 },
    { mes: "Abr", lucro: -500 },
    { mes: "Mai", lucro: -147000 },
    { mes: "Jun", lucro: 277000 },
    { mes: "Jul", lucro: -77500 },
    { mes: "Ago", lucro: 254500 },
  ];

  // Alerts
  const contasVencidas = lancamentos.filter((l) => l.status === "VENCIDO").length;
  const osAtrasadas = ordens.filter((o) => o.status === "AGUARDANDO_MATERIAL").length;

  const alerts = [
    ...(contasVencidas > 0 ? [{ type: "error" as const, message: `${contasVencidas} conta(s) vencida(s) pendente(s) de pagamento` }] : []),
    ...(osAtrasadas > 0 ? [{ type: "warning" as const, message: `${osAtrasadas} OS aguardando material` }] : []),
    { type: "warning" as const, message: "3 materiais com estoque abaixo do minimo" },
    { type: "info" as const, message: "Reuniao de equipe agendada para segunda-feira" },
  ];

  // Timeline today
  const atividadesHoje = [
    { hora: "08:00", descricao: "Equipe iniciou concretagem - Residencial Aurora", tipo: "activity" },
    { hora: "09:30", descricao: "Recebimento material - Comercial Plaza", tipo: "delivery" },
    { hora: "11:00", descricao: "Pagamento recebido - 2a Medicao Aurora", tipo: "payment" },
    { hora: "14:00", descricao: "Visita tecnica - Reforma Escritorio", tipo: "activity" },
    { hora: "16:30", descricao: "Pagamento fornecedor cimento", tipo: "expense" },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Faturado" value={formatCurrency(totalFaturado)} icon={TrendingUp} trend={{ value: 12, positive: true }} />
        <StatCard title="Total Gasto" value={formatCurrency(totalGasto)} icon={TrendingDown} trend={{ value: 8, positive: false }} />
        <StatCard title="Lucro Liquido" value={formatCurrency(lucroLiquido)} icon={DollarSign} trend={{ value: 15, positive: true }} />
        <StatCard title="Obras em Andamento" value={String(obrasAndamento)} icon={Building2} />
        <StatCard title="Obras Concluidas" value={String(obrasConcluidas)} icon={CheckCircle2} />
        <StatCard title="Funcionarios Ativos" value={String(funcionariosAtivos)} icon={Users} />
        <StatCard title="OS Abertas" value={String(osAbertas)} icon={ClipboardList} trend={{ value: 5, positive: false }} />
        <StatCard title="OS Concluidas" value={String(osConcluidas)} icon={CheckCircle2} trend={{ value: 10, positive: true }} />
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Faturamento x Despesas</h2>
          <p className="mb-4 text-sm text-muted-foreground">Ultimos 6 meses</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={faturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="faturamento" name="Faturamento" fill="#1e40af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Despesas por Categoria</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={despesasPorCategoria}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {despesasPorCategoria.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Evolucao do Lucro Mensal</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lucroMensal}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="mes" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Calendar & Alerts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Calendar / Events */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Proximos Eventos</h2>
          </div>
          <div className="space-y-3">
            {eventos.sort((a, b) => a.data.localeCompare(b.data)).slice(0, 6).map((evento) => (
              <div key={evento.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  evento.tipo === "VENCIMENTO" ? "bg-red-100 text-red-600 dark:bg-red-950/50" :
                  evento.tipo === "ENTREGA" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50" :
                  evento.tipo === "REUNIAO" ? "bg-blue-100 text-blue-600 dark:bg-blue-950/50" :
                  "bg-amber-100 text-amber-600 dark:bg-amber-950/50"
                }`}>
                  {evento.tipo === "VENCIMENTO" ? <Banknote className="h-4 w-4" /> :
                   evento.tipo === "ENTREGA" ? <CheckCircle2 className="h-4 w-4" /> :
                   evento.tipo === "REUNIAO" ? <Users className="h-4 w-4" /> :
                   <Activity className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{evento.titulo}</p>
                  <p className="text-xs text-muted-foreground">{new Date(evento.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  evento.tipo === "VENCIMENTO" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  evento.tipo === "ENTREGA" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  evento.tipo === "REUNIAO" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                  {evento.tipo === "VENCIMENTO" ? "Vencimento" :
                   evento.tipo === "ENTREGA" ? "Entrega" :
                   evento.tipo === "REUNIAO" ? "Reuniao" : "Manutencao"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Alertas Importantes</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-lg p-4 ${
                  alert.type === "error"
                    ? "bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50"
                    : alert.type === "warning"
                    ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"
                    : "bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50"
                }`}
              >
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  alert.type === "error" ? "bg-red-100 dark:bg-red-900/50" :
                  alert.type === "warning" ? "bg-amber-100 dark:bg-amber-900/50" :
                  "bg-blue-100 dark:bg-blue-900/50"
                }`}>
                  <AlertTriangle className={`h-3.5 w-3.5 ${
                    alert.type === "error" ? "text-red-600" :
                    alert.type === "warning" ? "text-amber-600" :
                    "text-blue-600"
                  }`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    alert.type === "error" ? "text-red-800 dark:text-red-300" :
                    alert.type === "warning" ? "text-amber-800 dark:text-amber-300" :
                    "text-blue-800 dark:text-blue-300"
                  }`}>
                    {alert.type === "error" ? "Urgente" : alert.type === "warning" ? "Atencao" : "Informativo"}
                  </p>
                  <p className={`mt-0.5 text-sm ${
                    alert.type === "error" ? "text-red-700 dark:text-red-400" :
                    alert.type === "warning" ? "text-amber-700 dark:text-amber-400" :
                    "text-blue-700 dark:text-blue-400"
                  }`}>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Resumo do Dia</h2>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              Recebido: {formatCurrency(112500)}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <ArrowDownRight className="h-4 w-4" />
              Pago: {formatCurrency(32000)}
            </span>
          </div>
        </div>
        <div className="relative ml-4 border-l-2 border-muted pl-6">
          {atividadesHoje.map((ativ, idx) => (
            <div key={idx} className="relative mb-4 last:mb-0">
              <div className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-primary" />
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-12">{ativ.hora}</span>
                <span className="text-sm">{ativ.descricao}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="mt-8">
        <DashboardInsights />
      </div>
    </div>
  );
}
