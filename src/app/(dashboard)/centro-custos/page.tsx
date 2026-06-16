"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Layers, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { obrasStorage } from "@/lib/storage";
import type { Obra } from "@/types";

interface CentroCustoItem {
  obraId: string;
  centro: string;
  orcado: number;
  realizado: number;
  itens: CentroCustoDetalhe[];
}

interface CentroCustoDetalhe {
  descricao: string;
  valor: number;
  data: string;
}

const CENTROS = [
  "Fundação",
  "Estrutura",
  "Alvenaria",
  "Cobertura",
  "Hidráulica",
  "Elétrica",
  "Acabamentos",
  "Paisagismo",
  "Administração",
];

const COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444",
  "#ec4899", "#14b8a6", "#f59e0b", "#6366f1",
];

function getCentroCustos(): CentroCustoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("smart-obra-centro-custos");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setCentroCustos(items: CentroCustoItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("smart-obra-centro-custos", JSON.stringify(items));
}

function initMockData(obras: Obra[]): CentroCustoItem[] {
  const existing = getCentroCustos();
  if (existing.length > 0) return existing;

  const items: CentroCustoItem[] = [];

  const generateItens = (centro: string, realizado: number): CentroCustoDetalhe[] => {
    const qtd = 3 + Math.floor(Math.random() * 4);
    const result: CentroCustoDetalhe[] = [];
    let remaining = realizado;
    for (let i = 0; i < qtd; i++) {
      const isLast = i === qtd - 1;
      const valor = isLast ? remaining : Math.round(remaining * (0.15 + Math.random() * 0.35));
      remaining -= valor;
      result.push({
        descricao: `${centro} - Item ${i + 1}`,
        valor: Math.max(valor, 0),
        data: new Date(2024, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)).toISOString(),
      });
    }
    return result;
  };

  const orcados: Record<string, number> = {
    "Fundação": 35000,
    "Estrutura": 65000,
    "Alvenaria": 45000,
    "Cobertura": 28000,
    "Hidráulica": 18000,
    "Elétrica": 22000,
    "Acabamentos": 50000,
    "Paisagismo": 12000,
    "Administração": 15000,
  };

  if (obras.length > 0) {
    obras.forEach((obra) => {
      const scale = obra.orcamento / 290000;
      CENTROS.forEach((centro) => {
        const orcado = Math.round((orcados[centro] || 20000) * scale);
        const realizado = Math.round(orcado * (0.4 + Math.random() * 0.8));
        items.push({
          obraId: obra.id,
          centro,
          orcado,
          realizado,
          itens: generateItens(centro, realizado),
        });
      });
    });
  } else {
    const mockObraId = "mock-001";
    CENTROS.forEach((centro) => {
      const orcado = orcados[centro] || 20000;
      const realizado = Math.round(orcado * (0.4 + Math.random() * 0.8));
      items.push({
        obraId: mockObraId,
        centro,
        orcado,
        realizado,
        itens: generateItens(centro, realizado),
      });
    });
  }

  setCentroCustos(items);
  return items;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CentroCustosPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [data, setData] = useState<CentroCustoItem[]>([]);
  const [selectedObra, setSelectedObra] = useState<string>("");
  const [expandedCentro, setExpandedCentro] = useState<string | null>(null);
  const [drillDownCentro, setDrillDownCentro] = useState<string | null>(null);

  useEffect(() => {
    const obrasData = obrasStorage.getAll();
    setObras(obrasData);
    const items = initMockData(obrasData);
    setData(items);

    const obraIds = Array.from(new Set(items.map((i) => i.obraId)));
    if (obraIds.length > 0) {
      setSelectedObra(obraIds[0]);
    }
  }, []);

  const filteredData = useMemo(() => {
    if (!selectedObra) return data;
    return data.filter((d) => d.obraId === selectedObra);
  }, [data, selectedObra]);

  const obraOptions = useMemo(() => {
    const ids = Array.from(new Set(data.map((d) => d.obraId)));
    return ids.map((id) => {
      const obra = obras.find((o) => o.id === id);
      return { id, nome: obra ? obra.nome : `Obra ${id}` };
    });
  }, [data, obras]);

  const totalOrcado = filteredData.reduce((acc, d) => acc + d.orcado, 0);
  const totalRealizado = filteredData.reduce((acc, d) => acc + d.realizado, 0);

  const pieData = filteredData.map((d) => ({
    name: d.centro,
    value: d.realizado,
  }));

  const drillDownData = drillDownCentro
    ? filteredData.find((d) => d.centro === drillDownCentro)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Layers className="w-8 h-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">Centro de Custos</h1>
          </div>
          <p className="text-gray-500 mt-1">Acompanhamento de custos por centro e detalhamento</p>
        </div>
      </div>

      {/* Obra selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Obra</label>
        <select
          value={selectedObra}
          onChange={(e) => {
            setSelectedObra(e.target.value);
            setDrillDownCentro(null);
          }}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {obraOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Orçado</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalOrcado)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Realizado</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRealizado)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">% Consumido</p>
          <p className={`text-xl font-bold ${totalOrcado > 0 && (totalRealizado / totalOrcado) > 1 ? "text-red-600" : "text-green-600"}`}>
            {totalOrcado > 0 ? ((totalRealizado / totalOrcado) * 100).toFixed(1) : "0"}%
          </p>
        </div>
      </div>

      {drillDownCentro && drillDownData ? (
        /* Drill-down view */
        <div className="space-y-4">
          <button
            onClick={() => setDrillDownCentro(null)}
            className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para visão geral
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{drillDownCentro}</h3>
            <div className="flex gap-6 mb-4 text-sm text-gray-600">
              <span>Orçado: <strong>{formatCurrency(drillDownData.orcado)}</strong></span>
              <span>Realizado: <strong>{formatCurrency(drillDownData.realizado)}</strong></span>
              <span>
                Consumido:{" "}
                <strong className={drillDownData.realizado > drillDownData.orcado ? "text-red-600" : "text-green-600"}>
                  {((drillDownData.realizado / drillDownData.orcado) * 100).toFixed(1)}%
                </strong>
              </span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {drillDownData.itens.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.descricao}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.valor)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {new Date(item.data).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail bar chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição - {drillDownCentro}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={drillDownData.itens.map((item) => ({ descricao: item.descricao.replace(`${drillDownCentro} - `, ""), valor: item.valor }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="descricao" />
                <YAxis tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="valor" fill="#f97316" radius={[4, 4, 0, 0]} name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Main view */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Centros de Custo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Centro</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Orçado</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Realizado</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase w-40">% Consumido</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((item) => {
                    const pct = item.orcado > 0 ? (item.realizado / item.orcado) * 100 : 0;
                    const barColor = pct > 100 ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-green-500";
                    const isExpanded = expandedCentro === item.centro;
                    return (
                      <React.Fragment key={item.centro}>
                        <tr
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setDrillDownCentro(item.centro)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.centro}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.orcado)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.realizado)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${barColor}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-600 w-12 text-right">
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCentro(isExpanded ? null : item.centro);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-gray-50 px-4 py-3">
                              <div className="space-y-1">
                                {item.itens.map((detalhe, idx) => (
                                  <div key={idx} className="flex justify-between text-xs text-gray-600 py-1">
                                    <span>{detalhe.descricao}</span>
                                    <span>{formatCurrency(detalhe.valor)}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Donut chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Centro</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}