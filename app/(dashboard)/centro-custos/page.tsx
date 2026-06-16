"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Layers, ArrowLeft, ChevronRight,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, Treemap,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useObras } from "@/hooks/use-storage-data";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#1e40af", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const CENTROS_CUSTO = [
  "Fundacao", "Estrutura", "Alvenaria", "Cobertura", "Hidraulica",
  "Eletrica", "Acabamentos", "Paisagismo", "Administracao",
];

interface CentroCustoItem {
  obraId: string;
  centro: string;
  orcado: number;
  realizado: number;
}

interface DespesaDetalhe {
  id: string;
  obraId: string;
  centro: string;
  descricao: string;
  valor: number;
  data: string;
  fornecedor: string;
}

const STORAGE_KEY = "smart-obra-centro-custos";

function getInitialData(): { centros: CentroCustoItem[]; despesas: DespesaDetalhe[] } {
  if (typeof window === "undefined") return { centros: [], despesas: [] };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }

  const centros: CentroCustoItem[] = [
    { obraId: "obra-1", centro: "Fundacao", orcado: 67500, realizado: 65000 },
    { obraId: "obra-1", centro: "Estrutura", orcado: 112500, realizado: 118000 },
    { obraId: "obra-1", centro: "Alvenaria", orcado: 56250, realizado: 52000 },
    { obraId: "obra-1", centro: "Cobertura", orcado: 45000, realizado: 28000 },
    { obraId: "obra-1", centro: "Hidraulica", orcado: 33750, realizado: 31500 },
    { obraId: "obra-1", centro: "Eletrica", orcado: 33750, realizado: 38000 },
    { obraId: "obra-1", centro: "Acabamentos", orcado: 56250, realizado: 22000 },
    { obraId: "obra-1", centro: "Paisagismo", orcado: 22500, realizado: 0 },
    { obraId: "obra-1", centro: "Administracao", orcado: 22500, realizado: 18500 },
    { obraId: "obra-2", centro: "Fundacao", orcado: 180000, realizado: 175000 },
    { obraId: "obra-2", centro: "Estrutura", orcado: 360000, realizado: 380000 },
    { obraId: "obra-2", centro: "Alvenaria", orcado: 120000, realizado: 45000 },
    { obraId: "obra-2", centro: "Cobertura", orcado: 96000, realizado: 0 },
    { obraId: "obra-2", centro: "Hidraulica", orcado: 84000, realizado: 25000 },
    { obraId: "obra-2", centro: "Eletrica", orcado: 84000, realizado: 30000 },
    { obraId: "obra-2", centro: "Acabamentos", orcado: 144000, realizado: 0 },
    { obraId: "obra-2", centro: "Paisagismo", orcado: 48000, realizado: 0 },
    { obraId: "obra-2", centro: "Administracao", orcado: 84000, realizado: 58000 },
    { obraId: "obra-3", centro: "Fundacao", orcado: 0, realizado: 0 },
    { obraId: "obra-3", centro: "Estrutura", orcado: 8500, realizado: 8500 },
    { obraId: "obra-3", centro: "Alvenaria", orcado: 12750, realizado: 12000 },
    { obraId: "obra-3", centro: "Cobertura", orcado: 0, realizado: 0 },
    { obraId: "obra-3", centro: "Hidraulica", orcado: 8500, realizado: 9200 },
    { obraId: "obra-3", centro: "Eletrica", orcado: 12750, realizado: 14000 },
    { obraId: "obra-3", centro: "Acabamentos", orcado: 25500, realizado: 28000 },
    { obraId: "obra-3", centro: "Paisagismo", orcado: 0, realizado: 0 },
    { obraId: "obra-3", centro: "Administracao", orcado: 17000, realizado: 15300 },
    { obraId: "obra-4", centro: "Fundacao", orcado: 525000, realizado: 320000 },
    { obraId: "obra-4", centro: "Estrutura", orcado: 875000, realizado: 85000 },
    { obraId: "obra-4", centro: "Alvenaria", orcado: 350000, realizado: 0 },
    { obraId: "obra-4", centro: "Cobertura", orcado: 280000, realizado: 0 },
    { obraId: "obra-4", centro: "Hidraulica", orcado: 245000, realizado: 0 },
    { obraId: "obra-4", centro: "Eletrica", orcado: 245000, realizado: 0 },
    { obraId: "obra-4", centro: "Acabamentos", orcado: 420000, realizado: 0 },
    { obraId: "obra-4", centro: "Paisagismo", orcado: 175000, realizado: 0 },
    { obraId: "obra-4", centro: "Administracao", orcado: 385000, realizado: 48000 },
  ];

  const despesas: DespesaDetalhe[] = [
    { id: "dc-1", obraId: "obra-1", centro: "Fundacao", descricao: "Concreto para fundacao radier", valor: 28000, data: "2024-03-20", fornecedor: "Concretex Ltda" },
    { id: "dc-2", obraId: "obra-1", centro: "Fundacao", descricao: "Aco para armacao", valor: 22000, data: "2024-03-25", fornecedor: "AcoFlex Distribuidora" },
    { id: "dc-3", obraId: "obra-1", centro: "Fundacao", descricao: "Mao de obra fundacao", valor: 15000, data: "2024-04-01", fornecedor: "Equipe Joao Silva" },
    { id: "dc-4", obraId: "obra-1", centro: "Estrutura", descricao: "Concreto pilares e vigas", valor: 45000, data: "2024-04-15", fornecedor: "Concretex Ltda" },
    { id: "dc-5", obraId: "obra-1", centro: "Estrutura", descricao: "Aco CA-50 estrutural", valor: 38000, data: "2024-04-20", fornecedor: "AcoFlex Distribuidora" },
    { id: "dc-6", obraId: "obra-1", centro: "Estrutura", descricao: "Mao de obra estrutura", valor: 35000, data: "2024-05-01", fornecedor: "Construtora Estrutural ME" },
    { id: "dc-7", obraId: "obra-1", centro: "Alvenaria", descricao: "Tijolos e blocos", valor: 22000, data: "2024-06-01", fornecedor: "Materiais Paulista Ltda" },
    { id: "dc-8", obraId: "obra-1", centro: "Alvenaria", descricao: "Argamassa e cimento", valor: 12000, data: "2024-06-05", fornecedor: "Materiais Paulista Ltda" },
    { id: "dc-9", obraId: "obra-1", centro: "Alvenaria", descricao: "Mao de obra alvenaria", valor: 18000, data: "2024-06-10", fornecedor: "Equipe Joao Silva" },
    { id: "dc-10", obraId: "obra-1", centro: "Hidraulica", descricao: "Tubos e conexoes PVC", valor: 12500, data: "2024-07-01", fornecedor: "Materiais Paulista Ltda" },
    { id: "dc-11", obraId: "obra-1", centro: "Hidraulica", descricao: "Mao de obra hidraulica", valor: 19000, data: "2024-07-05", fornecedor: "Carlos Santos" },
    { id: "dc-12", obraId: "obra-1", centro: "Eletrica", descricao: "Fios e cabos eletricos", valor: 18000, data: "2024-07-15", fornecedor: "EletroMais Distribuidora" },
    { id: "dc-13", obraId: "obra-1", centro: "Eletrica", descricao: "Disjuntores e quadros", valor: 8000, data: "2024-07-18", fornecedor: "EletroMais Distribuidora" },
    { id: "dc-14", obraId: "obra-1", centro: "Eletrica", descricao: "Mao de obra eletrica", valor: 12000, data: "2024-07-20", fornecedor: "Lucas Ferreira" },
    { id: "dc-15", obraId: "obra-1", centro: "Cobertura", descricao: "Telhas e madeiramento", valor: 28000, data: "2024-08-01", fornecedor: "Madeireira Central" },
    { id: "dc-16", obraId: "obra-1", centro: "Acabamentos", descricao: "Pisos ceramicos", valor: 12000, data: "2024-08-10", fornecedor: "Materiais Paulista Ltda" },
    { id: "dc-17", obraId: "obra-1", centro: "Acabamentos", descricao: "Tintas e massas", valor: 10000, data: "2024-08-12", fornecedor: "Materiais Paulista Ltda" },
    { id: "dc-18", obraId: "obra-1", centro: "Administracao", descricao: "Escritorio e administrativo", valor: 18500, data: "2024-03-01", fornecedor: "Diversos" },
    { id: "dc-19", obraId: "obra-2", centro: "Fundacao", descricao: "Estacas e blocos fundacao", valor: 98000, data: "2024-01-20", fornecedor: "Concretex Ltda" },
    { id: "dc-20", obraId: "obra-2", centro: "Fundacao", descricao: "Servico de estaqueamento", valor: 77000, data: "2024-01-25", fornecedor: "GeoFund Engenharia" },
    { id: "dc-21", obraId: "obra-2", centro: "Estrutura", descricao: "Concreto estrutural andares", valor: 185000, data: "2024-03-01", fornecedor: "Concretex Ltda" },
    { id: "dc-22", obraId: "obra-2", centro: "Estrutura", descricao: "Estrutura metalica perfis", valor: 130000, data: "2024-05-15", fornecedor: "MetalPro Distribuidora" },
    { id: "dc-23", obraId: "obra-2", centro: "Estrutura", descricao: "Mao de obra estrutural", valor: 65000, data: "2024-04-01", fornecedor: "Construtora Estrutural ME" },
    { id: "dc-24", obraId: "obra-2", centro: "Administracao", descricao: "Custos administrativos", valor: 58000, data: "2024-01-01", fornecedor: "Diversos" },
  ];

  const mockData = { centros, despesas };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
  return mockData;
}

function getProgressColor(pct: number): string {
  if (pct <= 60) return "bg-green-500";
  if (pct <= 85) return "bg-amber-500";
  return "bg-red-500";
}

interface CustomTreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  index?: number;
}

function CustomTreemapContent({ x = 0, y = 0, width = 0, height = 0, name = "", index = 0 }: CustomTreemapContentProps) {
  if (width < 50 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} rx={4} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">
        {name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#fff" fontSize={10} opacity={0.8}>
        {((width * height) > 3000) ? formatCurrency(0) : ""}
      </text>
    </g>
  );
}

export default function CentroCustosPage() {
  const { obras, loading: loadingObras } = useObras();
  const [mounted, setMounted] = useState(false);
  const [selectedObra, setSelectedObra] = useState<string>("all");
  const [data, setData] = useState<{ centros: CentroCustoItem[]; despesas: DespesaDetalhe[] }>({ centros: [], despesas: [] });
  const [drillDown, setDrillDown] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setData(getInitialData());
  }, []);

  const loading = !mounted || loadingObras;

  const filteredCentros = useMemo(() => {
    if (selectedObra === "all") {
      const grouped: Record<string, { orcado: number; realizado: number }> = {};
      data.centros.forEach((c) => {
        if (!grouped[c.centro]) grouped[c.centro] = { orcado: 0, realizado: 0 };
        grouped[c.centro].orcado += c.orcado;
        grouped[c.centro].realizado += c.realizado;
      });
      return CENTROS_CUSTO.map((centro) => ({
        centro,
        orcado: grouped[centro]?.orcado || 0,
        realizado: grouped[centro]?.realizado || 0,
      })).filter((c) => c.orcado > 0 || c.realizado > 0);
    }
    return data.centros
      .filter((c) => c.obraId === selectedObra)
      .map((c) => ({ centro: c.centro, orcado: c.orcado, realizado: c.realizado }))
      .filter((c) => c.orcado > 0 || c.realizado > 0);
  }, [data, selectedObra]);

  const filteredDespesas = useMemo(() => {
    if (!drillDown) return [];
    return data.despesas.filter((d) => {
      const centroMatch = d.centro === drillDown;
      const obraMatch = selectedObra === "all" || d.obraId === selectedObra;
      return centroMatch && obraMatch;
    });
  }, [data, drillDown, selectedObra]);

  const pieData = filteredCentros.map((c) => ({ name: c.centro, value: c.realizado })).filter((d) => d.value > 0);

  const treemapData = filteredCentros.filter((c) => c.orcado > 0).map((c) => ({ name: c.centro, size: c.orcado }));

  if (loading) {
    return (
      <div>
        <PageHeader title="Centro de Custos" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (drillDown) {
    return (
      <div>
        <PageHeader title={`Centro de Custos: ${drillDown}`} />
        <Button variant="outline" size="sm" onClick={() => setDrillDown(null)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">Descricao</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor</th>
                  <th className="px-4 py-3 text-center font-semibold">Data</th>
                  <th className="px-4 py-3 text-left font-semibold">Fornecedor</th>
                </tr>
              </thead>
              <tbody>
                {filteredDespesas.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhuma despesa encontrada para este centro.</td></tr>
                ) : (
                  filteredDespesas.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{d.descricao}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(d.valor)}</td>
                      <td className="px-4 py-3 text-center">{new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">{d.fornecedor}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredDespesas.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/50 font-semibold">
                    <td className="px-4 py-3">TOTAL</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(filteredDespesas.reduce((s, d) => s + d.valor, 0))}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Centro de Custos" />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mr-3">Obra:</label>
          <select
            value={selectedObra}
            onChange={(e) => setSelectedObra(e.target.value)}
            className="rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas as Obras</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Centro de Custo</th>
                <th className="px-4 py-3 text-right font-semibold">Orcado</th>
                <th className="px-4 py-3 text-right font-semibold">Realizado</th>
                <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                <th className="px-4 py-3 text-center font-semibold">% Consumido</th>
                <th className="px-4 py-3 text-center font-semibold">Progresso</th>
                <th className="px-4 py-3 text-center font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCentros.map((item) => {
                const saldo = item.orcado - item.realizado;
                const pctConsumido = item.orcado > 0 ? (item.realizado / item.orcado) * 100 : 0;
                return (
                  <tr key={item.centro} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{item.centro}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.orcado)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.realizado)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(saldo)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{pctConsumido.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <div className="mx-auto w-32 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${getProgressColor(pctConsumido)}`} style={{ width: `${Math.min(pctConsumido, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setDrillDown(item.centro)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors">
                        Detalhes <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Pie/Donut */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Distribuicao de Despesas</h2>
          <p className="mb-4 text-sm text-muted-foreground">Realizado por centro de custo</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {pieData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Treemap */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Proporcao Orcamentaria</h2>
          <p className="mb-4 text-sm text-muted-foreground">Treemap por centro de custo (orcado)</p>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomTreemapContent />}
            />
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}