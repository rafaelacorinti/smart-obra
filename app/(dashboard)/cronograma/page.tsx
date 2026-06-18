"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Edit2, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useObras } from "@/hooks/use-storage-data";
import { generateId } from "@/lib/storage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface EtapaCronograma {
  id: string;
  obraId: string;
  nome: string;
  dataPrevista: string;
  dataRealizada: string;
  percentualConcluido: number;
  valorPlanejado: number;
  valorRealizado: number;
  status: "NAO_INICIADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA";
  ordem: number;
  dependeDe?: string;
}

const STORAGE_KEY = "smart-obra-cronograma";
const ETAPAS_PADRAO = ["Fundacao", "Estrutura", "Cobertura", "Instalacoes", "Acabamentos"];

function getStorage(): EtapaCronograma[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function setStorageData(etapas: EtapaCronograma[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(etapas));
}

function seedEtapas(obraId: string): EtapaCronograma[] {
  const existing = getStorage();
  const obraEtapas = existing.filter((e) => e.obraId === obraId);
  if (obraEtapas.length > 0) return existing;

  const baseDate = new Date();
  const newEtapas: EtapaCronograma[] = ETAPAS_PADRAO.map((nome, idx) => {
    const dataPrevista = new Date(baseDate);
    dataPrevista.setDate(dataPrevista.getDate() + idx * 30);
    const dataRealizada = idx < 2 ? new Date(dataPrevista) : new Date(0);
    if (idx < 2) dataRealizada.setDate(dataRealizada.getDate() + Math.floor(Math.random() * 7));
    return {
      id: generateId(),
      obraId,
      nome,
      dataPrevista: dataPrevista.toISOString().split("T")[0],
      dataRealizada: idx < 2 ? dataRealizada.toISOString().split("T")[0] : "",
      percentualConcluido: idx === 0 ? 100 : idx === 1 ? 65 : idx === 2 ? 20 : 0,
      valorPlanejado: [80000, 150000, 60000, 90000, 120000][idx],
      valorRealizado: idx === 0 ? 82000 : idx === 1 ? 98000 : idx === 2 ? 12000 : 0,
      status: (idx === 0 ? "CONCLUIDA" : idx === 1 ? "EM_ANDAMENTO" : idx === 2 ? "EM_ANDAMENTO" : "NAO_INICIADA") as EtapaCronograma["status"],
      ordem: idx,
    };
  });
  for (let i = 1; i < newEtapas.length; i++) {
    newEtapas[i].dependeDe = newEtapas[i - 1].id;
  }
  const allEtapas = [...existing, ...newEtapas];
  setStorageData(allEtapas);
  return allEtapas;
}

function GanttChart({ etapas, obraInicio }: { etapas: EtapaCronograma[]; obraInicio: string }) {
  const today = new Date();
  const [hoveredEtapa, setHoveredEtapa] = useState<string | null>(null);

  const { minDate, totalDays } = useMemo(() => {
    const dates = etapas.flatMap((e) => {
      const d = [new Date(e.dataPrevista)];
      if (e.dataRealizada) d.push(new Date(e.dataRealizada));
      return d;
    });
    if (obraInicio) dates.push(new Date(obraInicio));
    dates.push(today);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    min.setDate(1);
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    max.setMonth(max.getMonth() + 2);
    max.setDate(0);
    const total = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
    return { minDate: min, maxDate: max, totalDays: total || 1 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapas, obraInicio]);

  const months = useMemo(() => {
    const result: { label: string; startPct: number; widthPct: number }[] = [];
    const current = new Date(minDate);
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const end = new Date(minDate);
    end.setDate(end.getDate() + totalDays);
    while (current <= end) {
      const monthStart = Math.max(0, Math.ceil((current.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
      const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const monthEnd = Math.min(totalDays, Math.ceil((endOfMonth.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
      result.push({
        label: `${monthNames[current.getMonth()]} ${current.getFullYear()}`,
        startPct: (monthStart / totalDays) * 100,
        widthPct: ((monthEnd - monthStart) / totalDays) * 100,
      });
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }
    return result;
  }, [minDate, totalDays]);

  const criticalPath = useMemo(() => {
    const ids = new Set<string>();
    for (const etapa of etapas) {
      if (etapa.status !== "CONCLUIDA") {
        ids.add(etapa.id);
        let pred = etapa.dependeDe;
        while (pred) {
          const p = etapas.find((e) => e.id === pred);
          if (p && p.status !== "CONCLUIDA") ids.add(p.id);
          pred = p?.dependeDe;
        }
      }
    }
    return ids;
  }, [etapas]);

  const todayPct = ((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;

  function isAtrasada(etapa: EtapaCronograma): boolean {
    return etapa.status !== "CONCLUIDA" && new Date(etapa.dataPrevista) < today && etapa.percentualConcluido < 100;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="relative h-8 border-b border-border mb-2">
          {months.map((m, idx) => (
            <div key={idx} className="absolute top-0 h-full flex items-center justify-center text-xs text-muted-foreground border-r border-border" style={{ left: `${m.startPct}%`, width: `${m.widthPct}%` }}>
              {m.label}
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-70" style={{ left: `${todayPct}%` }}>
            <span className="absolute -top-5 -left-3 text-[10px] text-red-500 font-medium">Hoje</span>
          </div>
          <div className="space-y-3 py-2">
            {etapas.map((etapa, idx) => {
              const startDay = (new Date(etapa.dataPrevista).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
              const leftPct = (startDay / totalDays) * 100;
              const widthPct = (30 / totalDays) * 100;
              const isCritical = criticalPath.has(etapa.id);
              const atrasada = isAtrasada(etapa);
              return (
                <div key={etapa.id} className="relative flex items-center gap-3">
                  <div className="w-28 shrink-0 text-xs font-medium truncate">{etapa.nome}</div>
                  <div className="relative flex-1 h-8" onMouseEnter={() => setHoveredEtapa(etapa.id)} onMouseLeave={() => setHoveredEtapa(null)}>
                    <div className={`absolute top-1 h-6 rounded ${isCritical ? "bg-red-200 border border-red-400" : "bg-blue-200 border border-blue-400"} ${atrasada ? "!bg-red-100 !border-red-500" : ""}`} style={{ left: `${Math.max(0, leftPct)}%`, width: `${Math.min(widthPct, 100 - Math.max(0, leftPct))}%` }}>
                      <div className={`h-full rounded-l ${atrasada ? "bg-red-500" : isCritical ? "bg-red-400" : "bg-green-500"} transition-all`} style={{ width: `${etapa.percentualConcluido}%` }} />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-800">{etapa.percentualConcluido}%</span>
                    </div>
                    {etapa.dependeDe && idx > 0 && (
                      <div className="absolute top-4 w-3 h-0.5 bg-gray-400" style={{ left: `${Math.max(0, leftPct - 2)}%` }}>
                        <div className="absolute right-0 -top-1 w-0 h-0 border-t-[3px] border-b-[3px] border-l-[5px] border-transparent border-l-gray-400" />
                      </div>
                    )}
                    {hoveredEtapa === etapa.id && (
                      <div className="absolute z-20 bottom-full left-1/4 mb-1 bg-popover border border-border rounded-md shadow-lg p-3 text-xs min-w-[200px]">
                        <p className="font-bold mb-1">{etapa.nome}</p>
                        <p>Previsto: {etapa.dataPrevista}</p>
                        {etapa.dataRealizada && <p>Realizado: {etapa.dataRealizada}</p>}
                        <p>Progresso: {etapa.percentualConcluido}%</p>
                        <p>Valor Plan.: R$ {etapa.valorPlanejado.toLocaleString("pt-BR")}</p>
                        <p>Valor Real.: R$ {etapa.valorRealizado.toLocaleString("pt-BR")}</p>
                        <p className={`font-medium mt-1 ${atrasada ? "text-red-500" : isCritical ? "text-orange-500" : "text-green-600"}`}>
                          {atrasada ? "ATRASADA" : isCritical ? "Caminho Critico" : etapa.status.replace(/_/g, " ")}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="w-6 shrink-0">
                    {atrasada && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {etapa.status === "CONCLUIDA" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400" /> Planejado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Executado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Caminho Critico</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Atrasado</span>
          <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-red-500" /> Hoje</span>
        </div>
      </div>
    </div>
  );
}

export default function CronogramaPage() {
  const { obras, loading: obrasLoading } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string>("");
  const [etapas, setEtapas] = useState<EtapaCronograma[]>([]);
  const [activeTab, setActiveTab] = useState<"fisico-financeiro" | "gantt">("fisico-financeiro");
  const [editingEtapa, setEditingEtapa] = useState<EtapaCronograma | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (obras.length > 0 && !selectedObraId) setSelectedObraId(obras[0].id);
  }, [obras, selectedObraId]);

  useEffect(() => {
    if (selectedObraId) {
      const allEtapas = seedEtapas(selectedObraId);
      setEtapas(allEtapas.filter((e) => e.obraId === selectedObraId).sort((a, b) => a.ordem - b.ordem));
    }
  }, [selectedObraId]);

  const curvaSData = useMemo(() => {
    if (etapas.length === 0) return [];
    const totalPlanejado = etapas.reduce((sum, e) => sum + e.valorPlanejado, 0);
    let acumPlan = 0;
    let acumReal = 0;
    return etapas.map((etapa) => {
      acumPlan += etapa.valorPlanejado;
      acumReal += etapa.valorRealizado;
      return { name: etapa.nome, planejado: Math.round((acumPlan / totalPlanejado) * 100), realizado: Math.round((acumReal / totalPlanejado) * 100) };
    });
  }, [etapas]);

  const resumo = useMemo(() => {
    const totalPlanejado = etapas.reduce((s, e) => s + e.valorPlanejado, 0);
    const totalRealizado = etapas.reduce((s, e) => s + e.valorRealizado, 0);
    const desvio = totalRealizado - totalPlanejado;
    const progressoGeral = etapas.length > 0 && totalPlanejado > 0
      ? Math.round(etapas.reduce((s, e) => s + e.percentualConcluido * e.valorPlanejado, 0) / totalPlanejado)
      : 0;
    return { totalPlanejado, totalRealizado, desvio, progressoGeral };
  }, [etapas]);

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; cls: string }> = {
      NAO_INICIADA: { label: "Nao Iniciada", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
      EM_ANDAMENTO: { label: "Em Andamento", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
      CONCLUIDA: { label: "Concluida", cls: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
      ATRASADA: { label: "Atrasada", cls: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
    };
    const s = map[status] || map.NAO_INICIADA;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
  }

  function handleEditSave() {
    if (!editingEtapa) return;
    const all = getStorage();
    const idx = all.findIndex((e) => e.id === editingEtapa.id);
    if (idx !== -1) {
      all[idx] = { ...editingEtapa };
      if (editingEtapa.percentualConcluido >= 100) all[idx].status = "CONCLUIDA";
      else if (editingEtapa.percentualConcluido > 0) all[idx].status = "EM_ANDAMENTO";
      if (editingEtapa.percentualConcluido < 100 && new Date(editingEtapa.dataPrevista) < new Date()) all[idx].status = "ATRASADA";
      setStorageData(all);
      setEtapas(all.filter((e) => e.obraId === selectedObraId).sort((a, b) => a.ordem - b.ordem));
    }
    setShowEditModal(false);
    setEditingEtapa(null);
  }

  const selectedObra = obras.find((o) => o.id === selectedObraId);

  if (obrasLoading) {
    return <div className="space-y-4"><div className="h-8 w-64 bg-muted animate-pulse rounded" /><div className="h-64 bg-muted animate-pulse rounded" /></div>;
  }

  return (
    <div>
      <PageHeader title="Cronograma Fisico-Financeiro" breadcrumbs={[{ label: "Cronograma" }]} />
      <div className="mb-6">
        <select value={selectedObraId} onChange={(e) => setSelectedObraId(e.target.value)} className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Selecione uma obra</option>
          {obras.map((obra) => (<option key={obra.id} value={obra.id}>{obra.nome}</option>))}
        </select>
      </div>
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button onClick={() => setActiveTab("fisico-financeiro")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "fisico-financeiro" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Calendar className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />Fisico-Financeiro
        </button>
        <button onClick={() => setActiveTab("gantt")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "gantt" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <TrendingUp className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />Gantt
        </button>
      </div>

      {selectedObraId && etapas.length > 0 && (
        <>
          {activeTab === "fisico-financeiro" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso Geral da Obra</span>
                  <span className="text-sm font-bold text-blue-600">{resumo.progressoGeral}%</span>
                </div>
                <div className="h-4 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500" style={{ width: `${resumo.progressoGeral}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Total Planejado</p><p className="text-lg font-bold">R$ {resumo.totalPlanejado.toLocaleString("pt-BR")}</p></div>
                <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Total Realizado</p><p className="text-lg font-bold">R$ {resumo.totalRealizado.toLocaleString("pt-BR")}</p></div>
                <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Desvio</p><p className={`text-lg font-bold ${resumo.desvio > 0 ? "text-red-500" : "text-green-500"}`}>{resumo.desvio > 0 ? "+" : ""}R$ {resumo.desvio.toLocaleString("pt-BR")}</p></div>
                <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Prazo Original</p><p className="text-lg font-bold">{selectedObra?.previsaoTermino || "-"}</p></div>
                <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Prazo Atual</p><p className="text-lg font-bold">{etapas[etapas.length - 1]?.dataPrevista || "-"}</p></div>
              </div>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Etapa</th>
                      <th className="px-4 py-3 text-left font-medium">Data Prevista</th>
                      <th className="px-4 py-3 text-left font-medium">Data Realizada</th>
                      <th className="px-4 py-3 text-left font-medium">% Concluido</th>
                      <th className="px-4 py-3 text-right font-medium">Valor Planejado</th>
                      <th className="px-4 py-3 text-right font-medium">Valor Realizado</th>
                      <th className="px-4 py-3 text-center font-medium">Status</th>
                      <th className="px-4 py-3 text-center font-medium">Acoes</th>
                    </tr></thead>
                    <tbody>
                      {etapas.map((etapa) => (
                        <tr key={etapa.id} className="border-b border-border hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{etapa.nome}</td>
                          <td className="px-4 py-3">{etapa.dataPrevista}</td>
                          <td className="px-4 py-3">{etapa.dataRealizada || "-"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[100px]">
                                <div className={`h-full rounded-full transition-all ${etapa.percentualConcluido >= 100 ? "bg-green-500" : etapa.percentualConcluido > 50 ? "bg-blue-500" : "bg-orange-500"}`} style={{ width: `${etapa.percentualConcluido}%` }} />
                              </div>
                              <span className="text-xs font-medium w-8">{etapa.percentualConcluido}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">R$ {etapa.valorPlanejado.toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 text-right">R$ {etapa.valorRealizado.toLocaleString("pt-BR")}</td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(etapa.status)}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => { setEditingEtapa({ ...etapa }); setShowEditModal(true); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><Edit2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-medium mb-4">Curva S - Avanco Planejado vs Realizado</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curvaSData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis unit="%" fontSize={12} />
                      <Tooltip formatter={(value: any) => `${value}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="planejado" stroke="#3b82f6" strokeWidth={2} name="Planejado" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="realizado" stroke="#22c55e" strokeWidth={2} name="Realizado" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {activeTab === "gantt" && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-4">Cronograma Gantt</h3>
              <GanttChart etapas={etapas} obraInicio={selectedObra?.dataInicio || ""} />
            </div>
          )}
        </>
      )}

      {showEditModal && editingEtapa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-md bg-background border border-border rounded-lg shadow-xl p-6 mx-4">
            <h2 className="text-lg font-semibold mb-4">Editar Etapa: {editingEtapa.nome}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">% Concluido</label>
                <input type="number" min={0} max={100} value={editingEtapa.percentualConcluido} onChange={(e) => setEditingEtapa({ ...editingEtapa, percentualConcluido: Math.min(100, Math.max(0, Number(e.target.value))) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${editingEtapa.percentualConcluido}%` }} /></div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Data Prevista</label>
                <input type="date" value={editingEtapa.dataPrevista} onChange={(e) => setEditingEtapa({ ...editingEtapa, dataPrevista: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Data Realizada</label>
                <input type="date" value={editingEtapa.dataRealizada} onChange={(e) => setEditingEtapa({ ...editingEtapa, dataRealizada: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Valor Realizado (R$)</label>
                <input type="number" min={0} value={editingEtapa.valorRealizado} onChange={(e) => setEditingEtapa({ ...editingEtapa, valorRealizado: Number(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-md text-sm font-medium border border-input hover:bg-muted">Cancelar</button>
              <button onClick={handleEditSave} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}