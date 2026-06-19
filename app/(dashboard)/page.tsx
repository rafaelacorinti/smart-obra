"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Building2, TrendingUp, TrendingDown, CheckCircle2,
  AlertTriangle, Clock, AlertCircle, FileWarning, FileText,
  Wallet, ArrowUpRight, ArrowDownRight, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useObras, useLancamentos, useOrdensServico, useEventosCalendario } from "@/hooks/use-storage-data";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#1e40af", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function DashboardPage() {
  const { obras, loading: loadingObras } = useObras();
  const { lancamentos, loading: loadingFin } = useLancamentos();
  const { ordens, loading: loadingOS } = useOrdensServico();
  const { eventos } = useEventosCalendario();
  const [mounted, setMounted] = useState(false);
  const [filtroObra, setFiltroObra] = useState<string>("TODOS");

  useEffect(() => {
    setMounted(true);
  }, []);

  const loading = !mounted || loadingObras || loadingFin || loadingOS;

  // === FILTERED DATA ===
  const lancamentosFiltrados = useMemo(() => {
    if (filtroObra === "TODOS") return lancamentos;
    return lancamentos.filter((l) => l.obraId === filtroObra);
  }, [lancamentos, filtroObra]);

  const ordensServicofiltrados = useMemo(() => {
    if (filtroObra === "TODOS") return ordens;
    return ordens.filter((o) => o.obraId === filtroObra);
  }, [ordens, filtroObra]);

  const obrasFiltradas = useMemo(() => {
    if (filtroObra === "TODOS") return obras;
    return obras.filter((o) => o.id === filtroObra);
  }, [obras, filtroObra]);

  // === KPI CALCULATIONS ===
  const obrasAtivas = obrasFiltradas.filter((o) => o.status === "EM_ANDAMENTO").length;
  const obrasConcluidas = obrasFiltradas.filter((o) => o.status === "CONCLUIDA").length;
  const obrasAtrasadas = obrasFiltradas.filter((o) => {
    if (o.status === "CONCLUIDA" || o.status === "CANCELADA") return false;
    return new Date(o.previsaoTermino) < new Date();
  }).length;

  const receitaPrevista = obrasFiltradas.reduce((sum, o) => sum + o.orcamento, 0);
  const receitaRealizada = lancamentosFiltrados
    .filter((l) => l.tipo === "RECEITA" && l.status === "PAGO")
    .reduce((sum, l) => sum + l.valor, 0);

  const despesasPrevistas = obrasFiltradas.reduce((sum, o) => sum + o.orcamento * 0.7, 0);
  const despesasRealizadas = lancamentosFiltrados
    .filter((l) => l.tipo === "DESPESA" && l.status === "PAGO")
    .reduce((sum, l) => sum + l.valor, 0);

  const lucroPrevisto = receitaPrevista - despesasPrevistas;
  const lucroRealizado = receitaRealizada - despesasRealizadas;

  // === CHARTS DATA ===
  const fluxoCaixa = useMemo(() => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return meses.map((mes, idx) => {
      const mesStr = String(idx + 1).padStart(2, "0");
      const entradas = lancamentosFiltrados
        .filter((l) => l.tipo === "RECEITA" && l.status === "PAGO" && l.data.startsWith(`2024-${mesStr}`))
        .reduce((sum, l) => sum + l.valor, 0);
      const saidas = lancamentosFiltrados
        .filter((l) => l.tipo === "DESPESA" && l.status === "PAGO" && l.data.startsWith(`2024-${mesStr}`))
        .reduce((sum, l) => sum + l.valor, 0);
      return { mes, entradas, saidas };
    }).filter((d) => d.entradas > 0 || d.saidas > 0);
  }, [lancamentosFiltrados]);

  const custosPorCategoria = useMemo(() => {
    const cats: Record<string, number> = {};
    lancamentosFiltrados
      .filter((l) => l.tipo === "DESPESA" && l.status === "PAGO")
      .forEach((l) => {
        cats[l.categoria] = (cats[l.categoria] || 0) + l.valor;
      });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [lancamentosFiltrados]);

  const despesasPorCentro = useMemo(() => {
    const centros: Record<string, number> = {
      "Material": 0, "Mao de obra": 0, "Equipamento": 0,
      "Administrativo": 0, "Projeto": 0, "Outros": 0,
    };
    lancamentosFiltrados
      .filter((l) => l.tipo === "DESPESA" && l.status === "PAGO")
      .forEach((l) => {
        if (centros[l.categoria] !== undefined) {
          centros[l.categoria] += l.valor;
        } else {
          centros["Outros"] += l.valor;
        }
      });
    return Object.entries(centros)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [lancamentosFiltrados]);

  const receitaPorObra = useMemo(() => {
    return obrasFiltradas.map((o) => {
      const receita = lancamentos
        .filter((l) => l.obraId === o.id && l.tipo === "RECEITA" && l.status === "PAGO")
        .reduce((sum, l) => sum + l.valor, 0);
      return { name: o.nome.length > 20 ? o.nome.slice(0, 20) + "..." : o.nome, value: receita };
    }).filter((d) => d.value > 0);
  }, [obrasFiltradas, lancamentos]);

  const lucroPorObra = useMemo(() => {
    return obrasFiltradas.map((o) => {
      const receita = lancamentos
        .filter((l) => l.obraId === o.id && l.tipo === "RECEITA" && l.status === "PAGO")
        .reduce((sum, l) => sum + l.valor, 0);
      const despesa = lancamentos
        .filter((l) => l.obraId === o.id && l.tipo === "DESPESA" && l.status === "PAGO")
        .reduce((sum, l) => sum + l.valor, 0);
      const lucro = receita - despesa;
      return { name: o.nome.length > 20 ? o.nome.slice(0, 20) + "..." : o.nome, lucro, positivo: lucro >= 0 ? lucro : 0, negativo: lucro < 0 ? lucro : 0 };
    });
  }, [obrasFiltradas, lancamentos]);

  // === ALERTS ===
  const alerts = useMemo(() => {
    const alertList: Array<{ type: "error" | "warning" | "info"; icon: typeof AlertCircle; message: string }> = [];

    obrasFiltradas.forEach((o) => {
      if (o.gastoReal > o.orcamento) {
        alertList.push({ type: "error", icon: AlertCircle, message: `${o.nome}: ultrapassou orcamento em ${formatCurrency(o.gastoReal - o.orcamento)}` });
      }
    });

    obrasFiltradas.forEach((o) => {
      if (o.status !== "CONCLUIDA" && o.status !== "CANCELADA" && new Date(o.previsaoTermino) < new Date()) {
        alertList.push({ type: "warning", icon: Clock, message: `${o.nome}: atrasada (previsao: ${new Date(o.previsaoTermino).toLocaleDateString("pt-BR")})` });
      }
    });

    const contasVencidas = lancamentosFiltrados.filter((l) => l.status === "VENCIDO");
    if (contasVencidas.length > 0) {
      alertList.push({ type: "error", icon: AlertTriangle, message: `${contasVencidas.length} conta(s) vencida(s) totalizando ${formatCurrency(contasVencidas.reduce((s, l) => s + l.valor, 0))}` });
    }

    const hoje = new Date();
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);
    const eventosVencendo = eventos.filter((e) => {
      const dataEvento = new Date(e.data);
      return e.tipo === "VENCIMENTO" && dataEvento >= hoje && dataEvento <= em30Dias;
    });
    if (eventosVencendo.length > 0) {
      alertList.push({ type: "warning", icon: FileWarning, message: `${eventosVencendo.length} vencimento(s) nos proximos 30 dias` });
    }

    const docsPendentes = lancamentosFiltrados.filter((l) => l.status === "PENDENTE").length;
    if (docsPendentes > 0) {
      alertList.push({ type: "info", icon: FileText, message: `${docsPendentes} lancamento(s) pendente(s) de confirmacao` });
    }

    return alertList;
  }, [obrasFiltradas, lancamentosFiltrados, eventos]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard Executivo" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Dashboard Executivo" />
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
      </div>

      {/* === INDICADORES GERAIS === */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Obras Ativas" value={String(obrasAtivas)} icon={Building2} className="border-l-4 border-l-blue-500" />
        <StatCard title="Obras Concluidas" value={String(obrasConcluidas)} icon={CheckCircle2} className="border-l-4 border-l-green-500" />
        <StatCard title="Obras Atrasadas" value={String(obrasAtrasadas)} icon={AlertTriangle} className={`border-l-4 ${obrasAtrasadas > 0 ? "border-l-red-500" : "border-l-green-500"}`} />
        <StatCard title="Total de Obras" value={String(obrasFiltradas.length)} icon={Activity} className="border-l-4 border-l-purple-500" />
      </div>

      {/* Financial KPIs */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/50">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita Prevista</p>
              <p className="text-sm font-bold">{formatCurrency(receitaPrevista)}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Realizada:</span>
            <span className="text-xs font-semibold text-green-600">{formatCurrency(receitaRealizada)}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/50">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas Previstas</p>
              <p className="text-sm font-bold">{formatCurrency(despesasPrevistas)}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Realizadas:</span>
            <span className="text-xs font-semibold text-red-600">{formatCurrency(despesasRealizadas)}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lucro Previsto</p>
              <p className="text-sm font-bold">{formatCurrency(lucroPrevisto)}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Realizado:</span>
            <span className={`text-xs font-semibold ${lucroRealizado >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(lucroRealizado)}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margem Real</p>
              <p className="text-sm font-bold">{receitaRealizada > 0 ? ((lucroRealizado / receitaRealizada) * 100).toFixed(1) : "0.0"}%</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Meta:</span>
            <span className="text-xs font-semibold text-amber-600">30%</span>
          </div>
        </div>
      </div>

      {/* === GRAFICOS FINANCEIROS === */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Fluxo de Caixa</h2>
          <p className="mb-4 text-sm text-muted-foreground">Entradas vs Saidas por mes</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={fluxoCaixa}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <RechartsTooltip content={({ active, payload, label }) => { if (!active || !payload?.length) return null; return (<div className="rounded-lg border bg-background p-3 shadow-lg"><p className="font-medium text-sm mb-2">{label}</p>{payload.map((p: any, i: number) => (<div key={i} className="flex items-center gap-2 text-sm"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-muted-foreground">{p.name}:</span><span className="font-medium">{formatCurrency(p.value)}</span></div>))}</div>); }} />
              <Legend />
              <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} />
              <Line type="monotone" dataKey="saidas" name="Saidas" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Custos por Categoria</h2>
          <p className="mb-4 text-sm text-muted-foreground">Distribuicao de despesas pagas</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={custosPorCategoria} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" className="text-xs" width={75} />
              <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="value" name="Valor" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Despesas por Centro de Custo</h2>
          <p className="mb-4 text-sm text-muted-foreground">Proporcao entre centros</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={despesasPorCentro} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {despesasPorCentro.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Receita por Obra</h2>
          <p className="mb-4 text-sm text-muted-foreground">Receitas realizadas por projeto</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={receitaPorObra}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="value" name="Receita" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Lucro por Obra</h2>
        <p className="mb-4 text-sm text-muted-foreground">Verde = lucro, Vermelho = prejuizo</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={lucroPorObra}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
            <Bar dataKey="positivo" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} stackId="stack" />
            <Bar dataKey="negativo" name="Prejuizo" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="stack" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* === ALERTAS INTELIGENTES === */}
      <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Alertas Inteligentes</h2>
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum alerta no momento. Tudo sob controle!</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`flex items-start gap-3 rounded-lg p-4 ${alert.type === "error" ? "bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50" : alert.type === "warning" ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50" : "bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50"}`}>
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${alert.type === "error" ? "bg-red-100 dark:bg-red-900/50" : alert.type === "warning" ? "bg-amber-100 dark:bg-amber-900/50" : "bg-blue-100 dark:bg-blue-900/50"}`}>
                  <alert.icon className={`h-4 w-4 ${alert.type === "error" ? "text-red-600" : alert.type === "warning" ? "text-amber-600" : "text-blue-600"}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase ${alert.type === "error" ? "text-red-700 dark:text-red-400" : alert.type === "warning" ? "text-amber-700 dark:text-amber-400" : "text-blue-700 dark:text-blue-400"}`}>
                    {alert.type === "error" ? "Critico" : alert.type === "warning" ? "Atencao" : "Informativo"}
                  </p>
                  <p className={`mt-0.5 text-sm ${alert.type === "error" ? "text-red-700 dark:text-red-300" : alert.type === "warning" ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"}`}>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
