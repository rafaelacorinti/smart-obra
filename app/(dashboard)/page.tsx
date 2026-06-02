"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Building2, DollarSign, ClipboardList, Users, TrendingUp,
  TrendingDown, CheckCircle2, AlertTriangle, Clock, Calendar as CalendarIcon,
  Activity, Banknote, ArrowUpRight, ArrowDownRight, Settings2, X, GripVertical,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Sector,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useObras, useLancamentos, useOrdensServico, useColaboradores, useEventosCalendario } from "@/hooks/use-storage-data";
import { formatCurrency } from "@/lib/utils";
import DashboardInsights from "@/components/dashboard-insights";

const COLORS = ["#1e40af", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

type PeriodKey = "7d" | "30d" | "90d" | "12m";

interface WidgetConfig {
  id: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "kpis", label: "KPIs Resumo", enabled: true },
  { id: "receita-despesa", label: "Grafico Receita vs Despesa", enabled: true },
  { id: "despesas-categoria", label: "Despesas por Categoria", enabled: true },
  { id: "lucro-mensal", label: "Grafico Lucro Mensal", enabled: true },
  { id: "alertas", label: "Alertas", enabled: true },
  { id: "atividades", label: "Atividades Recentes", enabled: true },
  { id: "eventos", label: "Proximos Eventos", enabled: true },
  { id: "insights", label: "Insights IA", enabled: true },
];

const PREFS_KEY = "smart-obra-dashboard-prefs";

function loadPrefs(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as WidgetConfig[];
      // Merge with defaults in case new widgets were added
      const ids = new Set(saved.map(w => w.id));
      const merged = [...saved];
      DEFAULT_WIDGETS.forEach(w => { if (!ids.has(w.id)) merged.push(w); });
      return merged;
    }
  } catch {}
  return DEFAULT_WIDGETS;
}

function savePrefs(widgets: WidgetConfig[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(widgets));
}

// Custom tooltip for bar chart
function BarChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="font-medium text-sm mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
      {payload.length >= 2 && (
        <div className="mt-2 border-t pt-2 text-sm">
          <span className="text-muted-foreground">Saldo: </span>
          <span className={`font-bold ${payload[0].value - payload[1].value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(payload[0].value - payload[1].value)}
          </span>
        </div>
      )}
    </div>
  );
}

// Active shape for pie chart interaction
function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} dy={0} textAnchor="middle" className="fill-foreground text-sm font-medium">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground text-xs">
        {formatCurrency(value)} ({(percent * 100).toFixed(0)}%)
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

export default function DashboardPage() {
  const { obras, loading: loadingObras } = useObras();
  const { lancamentos, loading: loadingFin } = useLancamentos();
  const { ordens, loading: loadingOS } = useOrdensServico();
  const { colaboradores, loading: loadingCol } = useColaboradores();
  const { eventos, loading: loadingEv } = useEventosCalendario();
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("12m");
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [showCustomize, setShowCustomize] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [barDetail, setBarDetail] = useState<{ mes: string; faturamento: number; despesas: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    setWidgets(loadPrefs());
  }, []);

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

  // Chart data adapted by period
  const faturamentoMensal = useMemo(() => {
    const allData = [
      { mes: "Jan", faturamento: 180000, despesas: 95000 },
      { mes: "Fev", faturamento: 210000, despesas: 110000 },
      { mes: "Mar", faturamento: 240000, despesas: 120000 },
      { mes: "Abr", faturamento: 112500, despesas: 113000 },
      { mes: "Mai", faturamento: 0, despesas: 147000 },
      { mes: "Jun", faturamento: 352500, despesas: 75500 },
      { mes: "Jul", faturamento: 57500, despesas: 135000 },
      { mes: "Ago", faturamento: 392500, despesas: 138000 },
      { mes: "Set", faturamento: 285000, despesas: 125000 },
      { mes: "Out", faturamento: 310000, despesas: 142000 },
      { mes: "Nov", faturamento: 275000, despesas: 118000 },
      { mes: "Dez", faturamento: 420000, despesas: 155000 },
    ];
    if (period === "7d") return allData.slice(-1);
    if (period === "30d") return allData.slice(-2);
    if (period === "90d") return allData.slice(-3);
    return allData.slice(-6);
  }, [period]);

  const despesasPorCategoria = [
    { name: "Material", value: 340000 },
    { name: "Mao de obra", value: 288000 },
    { name: "Equipamentos", value: 37500 },
    { name: "Projeto", value: 85000 },
    { name: "Administrativa", value: 8500 },
    { name: "Topografia", value: 15000 },
  ];

  const lucroMensal = useMemo(() => {
    const allData = [
      { mes: "Jan", lucro: 85000 },
      { mes: "Fev", lucro: 100000 },
      { mes: "Mar", lucro: 120000 },
      { mes: "Abr", lucro: -500 },
      { mes: "Mai", lucro: -147000 },
      { mes: "Jun", lucro: 277000 },
      { mes: "Jul", lucro: -77500 },
      { mes: "Ago", lucro: 254500 },
      { mes: "Set", lucro: 160000 },
      { mes: "Out", lucro: 168000 },
      { mes: "Nov", lucro: 157000 },
      { mes: "Dez", lucro: 265000 },
    ];
    if (period === "7d") return allData.slice(-1);
    if (period === "30d") return allData.slice(-2);
    if (period === "90d") return allData.slice(-3);
    return allData.slice(-6);
  }, [period]);

  // Alerts
  const contasVencidas = lancamentos.filter((l) => l.status === "VENCIDO").length;
  const osAtrasadas = ordens.filter((o) => o.status === "AGUARDANDO_MATERIAL").length;
  const alerts = [
    ...(contasVencidas > 0 ? [{ type: "error" as const, message: `${contasVencidas} conta(s) vencida(s) pendente(s) de pagamento` }] : []),
    ...(osAtrasadas > 0 ? [{ type: "warning" as const, message: `${osAtrasadas} OS aguardando material` }] : []),
    { type: "warning" as const, message: "3 materiais com estoque abaixo do minimo" },
    { type: "info" as const, message: "Reuniao de equipe agendada para segunda-feira" },
  ];

  const atividadesHoje = [
    { hora: "08:00", descricao: "Equipe iniciou concretagem - Residencial Aurora", tipo: "activity" },
    { hora: "09:30", descricao: "Recebimento material - Comercial Plaza", tipo: "delivery" },
    { hora: "11:00", descricao: "Pagamento recebido - 2a Medicao Aurora", tipo: "payment" },
    { hora: "14:00", descricao: "Visita tecnica - Reforma Escritorio", tipo: "activity" },
    { hora: "16:30", descricao: "Pagamento fornecedor cimento", tipo: "expense" },
  ];

  // Widget helpers
  function isWidgetEnabled(id: string) {
    return widgets.find(w => w.id === id)?.enabled !== false;
  }

  function toggleWidget(id: string) {
    const next = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    setWidgets(next);
    savePrefs(next);
  }

  function handleBarClick(data: any) {
    if (data && data.activePayload) {
      setBarDetail(data.activePayload[0]?.payload ?? null);
    }
  }

  const onPieEnter = useCallback((_: any, index: number) => {
    setActivePieIndex(index);
  }, []);

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
      <PageHeader
        title="Dashboard"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowCustomize(true)} className="gap-2">
            <Settings2 className="h-4 w-4" />
            Personalizar
          </Button>
        }
      />

      {/* Period Selector */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Periodo:</span>
        {(["7d", "30d", "90d", "12m"] as PeriodKey[]).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p)}
            className="h-7 px-3 text-xs"
          >
            {p}
          </Button>
        ))}
      </div>

      {/* KPIs */}
      {isWidgetEnabled("kpis") && (
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
      )}

      {/* Charts Row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - Receita vs Despesa */}
        {isWidgetEnabled("receita-despesa") && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold">Faturamento x Despesas</h2>
            <p className="mb-4 text-sm text-muted-foreground">Clique em uma barra para ver detalhes</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={faturamentoMensal} onClick={handleBarClick} className="cursor-pointer">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip content={<BarChartTooltip />} />
                <Legend />
                <Bar dataKey="faturamento" name="Faturamento" fill="#1e40af" radius={[4, 4, 0, 0]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                <Bar dataKey="despesas" name="Despesas" fill="#f59e0b" radius={[4, 4, 0, 0]} className="cursor-pointer hover:opacity-80 transition-opacity" />
              </BarChart>
            </ResponsiveContainer>
            {barDetail && (
              <div className="mt-4 rounded-lg border bg-muted/50 p-4 animate-in fade-in-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">Detalhamento - {barDetail.mes}</h3>
                  <button onClick={() => setBarDetail(null)} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Faturamento</p>
                    <p className="font-semibold text-blue-700">{formatCurrency(barDetail.faturamento)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Despesas</p>
                    <p className="font-semibold text-amber-600">{formatCurrency(barDetail.despesas)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saldo</p>
                    <p className={`font-semibold ${barDetail.faturamento - barDetail.despesas >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(barDetail.faturamento - barDetail.despesas)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pie Chart - Despesas por Categoria */}
        {isWidgetEnabled("despesas-categoria") && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold">Despesas por Categoria</h2>
            <p className="mb-4 text-sm text-muted-foreground">Passe o mouse ou clique nos segmentos</p>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  activeIndex={activePieIndex}
                  activeShape={renderActiveShape}
                  data={despesasPorCategoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  className="cursor-pointer"
                >
                  {despesasPorCategoria.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="transition-all hover:opacity-80" />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Line Chart - Lucro Mensal */}
      {isWidgetEnabled("lucro-mensal") && (
        <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Evolucao do Lucro Mensal</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lucroMensal}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0].value as number;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="font-medium text-sm">{label}</p>
                      <p className={`text-sm font-bold ${val >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(val)}
                      </p>
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 5, className: "cursor-pointer" }} activeDot={{ r: 8, className: "cursor-pointer" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Events & Alerts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Events */}
        {isWidgetEnabled("eventos") && (
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
        )}

        {/* Alerts */}
        {isWidgetEnabled("alertas") && (
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
        )}
      </div>

      {/* Daily Summary */}
      {isWidgetEnabled("atividades") && (
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
      )}

      {/* AI Insights */}
      {isWidgetEnabled("insights") && (
        <div className="mt-8">
          <DashboardInsights />
        </div>
      )}

      {/* Customize Modal */}
      {showCustomize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCustomize(false)} />
          <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Personalizar Dashboard</h2>
              <button onClick={() => setShowCustomize(false)} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Ative ou desative os widgets para personalizar seu painel.</p>
            <div className="space-y-2">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    <span className="text-sm font-medium">{widget.label}</span>
                  </div>
                  <button
                    onClick={() => toggleWidget(widget.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      widget.enabled ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      widget.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setWidgets(DEFAULT_WIDGETS); savePrefs(DEFAULT_WIDGETS); }}>
                Restaurar padrao
              </Button>
              <Button size="sm" onClick={() => setShowCustomize(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}