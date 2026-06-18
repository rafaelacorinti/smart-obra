"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart3, AlertTriangle, CheckCircle2, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Legend,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useObras } from "@/hooks/use-storage-data";
import { formatCurrency } from "@/lib/utils";

interface OrcadoRealizadoItem {
  obraId: string;
  categoria: string;
  planejado: number;
  realizado: number;
}

const CATEGORIAS = ["Materiais", "Mao de Obra", "Equipamentos", "Terceiros", "Administracao", "Outros"];

const STORAGE_KEY = "smart-obra-orcado-realizado";

function getInitialData(): OrcadoRealizadoItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  const mockData: OrcadoRealizadoItem[] = [
    { obraId: "obra-1", categoria: "Materiais", planejado: 135000, realizado: 148500 },
    { obraId: "obra-1", categoria: "Mao de Obra", planejado: 112500, realizado: 108000 },
    { obraId: "obra-1", categoria: "Equipamentos", planejado: 45000, realizado: 38000 },
    { obraId: "obra-1", categoria: "Terceiros", planejado: 67500, realizado: 72000 },
    { obraId: "obra-1", categoria: "Administracao", planejado: 22500, realizado: 25800 },
    { obraId: "obra-1", categoria: "Outros", planejado: 67500, realizado: 55200 },
    { obraId: "obra-2", categoria: "Materiais", planejado: 360000, realizado: 385000 },
    { obraId: "obra-2", categoria: "Mao de Obra", planejado: 300000, realizado: 275000 },
    { obraId: "obra-2", categoria: "Equipamentos", planejado: 180000, realizado: 195000 },
    { obraId: "obra-2", categoria: "Terceiros", planejado: 120000, realizado: 132000 },
    { obraId: "obra-2", categoria: "Administracao", planejado: 60000, realizado: 58000 },
    { obraId: "obra-2", categoria: "Outros", planejado: 180000, realizado: 165000 },
    { obraId: "obra-3", categoria: "Materiais", planejado: 25500, realizado: 28000 },
    { obraId: "obra-3", categoria: "Mao de Obra", planejado: 21250, realizado: 35000 },
    { obraId: "obra-3", categoria: "Equipamentos", planejado: 8500, realizado: 6500 },
    { obraId: "obra-3", categoria: "Terceiros", planejado: 12750, realizado: 11000 },
    { obraId: "obra-3", categoria: "Administracao", planejado: 4250, realizado: 4800 },
    { obraId: "obra-3", categoria: "Outros", planejado: 12750, realizado: 9700 },
    { obraId: "obra-4", categoria: "Materiais", planejado: 1050000, realizado: 320000 },
    { obraId: "obra-4", categoria: "Mao de Obra", planejado: 875000, realizado: 185000 },
    { obraId: "obra-4", categoria: "Equipamentos", planejado: 525000, realizado: 115000 },
    { obraId: "obra-4", categoria: "Terceiros", planejado: 350000, realizado: 85000 },
    { obraId: "obra-4", categoria: "Administracao", planejado: 175000, realizado: 48000 },
    { obraId: "obra-4", categoria: "Outros", planejado: 525000, realizado: 95000 },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
  return mockData;
}

function getStatus(planejado: number, realizado: number): { label: string; color: string; bgColor: string } {
  if (planejado === 0) return { label: "N/A", color: "text-gray-500", bgColor: "bg-gray-100" };
  const diff = ((realizado - planejado) / planejado) * 100;
  if (diff <= 5) return { label: "Dentro", color: "text-green-700", bgColor: "bg-green-100 dark:bg-green-900/30" };
  if (diff <= 15) return { label: "Atencao", color: "text-amber-700", bgColor: "bg-amber-100 dark:bg-amber-900/30" };
  return { label: "Critico", color: "text-red-700", bgColor: "bg-red-100 dark:bg-red-900/30" };
}

export default function OrcadoRealizadoPage() {
  const { obras, loading: loadingObras } = useObras();
  const [mounted, setMounted] = useState(false);
  const [selectedObra, setSelectedObra] = useState<string>("");
  const [data, setData] = useState<OrcadoRealizadoItem[]>([]);

  useEffect(() => {
    setMounted(true);
    setData(getInitialData());
  }, []);

  useEffect(() => {
    if (obras.length > 0 && !selectedObra) {
      setSelectedObra(obras[0].id);
    }
  }, [obras, selectedObra]);

  const loading = !mounted || loadingObras;

  const filteredData = useMemo(() => {
    return data.filter((d) => d.obraId === selectedObra);
  }, [data, selectedObra]);

  const totalPlanejado = filteredData.reduce((s, d) => s + d.planejado, 0);
  const totalRealizado = filteredData.reduce((s, d) => s + d.realizado, 0);
  const totalDiff = totalRealizado - totalPlanejado;
  const totalDiffPct = totalPlanejado > 0 ? ((totalDiff / totalPlanejado) * 100) : 0;

  const chartData = filteredData.map((d) => ({
    categoria: d.categoria,
    Planejado: d.planejado,
    Realizado: d.realizado,
  }));

  const radarData = filteredData.map((d) => ({
    categoria: d.categoria,
    Planejado: totalPlanejado > 0 ? (d.planejado / totalPlanejado) * 100 : 0,
    Realizado: totalRealizado > 0 ? (d.realizado / totalRealizado) * 100 : 0,
  }));

  const desvios = filteredData.filter((d) => {
    if (d.planejado === 0) return false;
    return ((d.realizado - d.planejado) / d.planejado) * 100 > 5;
  });

  if (loading) {
    return (
      <div>
        <PageHeader title="Orcado x Realizado" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Orcado x Realizado" />

      {/* Selector */}
      <div className="mb-6">
        <label className="text-sm font-medium text-muted-foreground mr-3">Obra:</label>
        <select
          value={selectedObra}
          onChange={(e) => setSelectedObra(e.target.value)}
          className="rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {obras.map((o) => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                <th className="px-4 py-3 text-right font-semibold">Planejado</th>
                <th className="px-4 py-3 text-right font-semibold">Realizado</th>
                <th className="px-4 py-3 text-right font-semibold">Diferenca (R$)</th>
                <th className="px-4 py-3 text-right font-semibold">Diferenca (%)</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const diff = item.realizado - item.planejado;
                const diffPct = item.planejado > 0 ? ((diff / item.planejado) * 100) : 0;
                const status = getStatus(item.planejado, item.realizado);
                return (
                  <tr key={item.categoria} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{item.categoria}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.planejado)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.realizado)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${diff > 0 ? "text-red-600" : "text-green-600"}`}>
                      {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${diffPct > 5 ? "text-red-600" : diffPct > 0 ? "text-amber-600" : "text-green-600"}`}>
                      {diffPct > 0 ? "+" : ""}{diffPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-semibold">
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-right">{formatCurrency(totalPlanejado)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(totalRealizado)}</td>
                <td className={`px-4 py-3 text-right ${totalDiff > 0 ? "text-red-600" : "text-green-600"}`}>
                  {totalDiff > 0 ? "+" : ""}{formatCurrency(totalDiff)}
                </td>
                <td className={`px-4 py-3 text-right ${totalDiffPct > 5 ? "text-red-600" : "text-green-600"}`}>
                  {totalDiffPct > 0 ? "+" : ""}{totalDiffPct.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatus(totalPlanejado, totalRealizado).bgColor} ${getStatus(totalPlanejado, totalRealizado).color}`}>
                    {getStatus(totalPlanejado, totalRealizado).label}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Grouped Bar Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Planejado vs Realizado</h2>
          <p className="mb-4 text-sm text-muted-foreground">Comparativo por categoria</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="categoria" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Planejado" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Realizado" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Radar Comparativo</h2>
          <p className="mb-4 text-sm text-muted-foreground">Distribuicao proporcional</p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="categoria" className="text-xs" />
              <PolarRadiusAxis className="text-xs" />
              <Radar name="Planejado" dataKey="Planejado" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              <Radar name="Realizado" dataKey="Realizado" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Desvios */}
      {desvios.length > 0 && (
        <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Alertas de Desvio</h2>
          </div>
          <div className="space-y-3">
            {desvios.map((d) => {
              const diffPct = ((d.realizado - d.planejado) / d.planejado) * 100;
              const isCritical = diffPct > 15;
              return (
                <div key={d.categoria} className={`flex items-center gap-3 rounded-lg p-4 ${isCritical ? "bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50" : "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"}`}>
                  {isCritical ? <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /> : <TrendingUp className="h-5 w-5 text-amber-500 shrink-0" />}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCritical ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
                      {d.categoria}: +{diffPct.toFixed(1)}% acima do planejado
                    </p>
                    <p className={`text-xs ${isCritical ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                      Planejado: {formatCurrency(d.planejado)} | Realizado: {formatCurrency(d.realizado)} | Excedente: {formatCurrency(d.realizado - d.planejado)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}