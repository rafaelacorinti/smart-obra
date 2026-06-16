"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { obrasStorage } from "@/lib/storage";
import type { Obra } from "@/types";

interface OrcadoItem {
  obraId: string;
  categoria: string;
  planejado: number;
  realizado: number;
}

const CATEGORIAS = [
  "Materiais",
  "Mão de Obra",
  "Equipamentos",
  "Terceiros",
  "Administrativo",
  "Outros",
];

function getOrcadoRealizado(): OrcadoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("smart-obra-orcado-realizado");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setOrcadoRealizado(items: OrcadoItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("smart-obra-orcado-realizado", JSON.stringify(items));
}

function initMockData(obras: Obra[]): OrcadoItem[] {
  const existing = getOrcadoRealizado();
  if (existing.length > 0) return existing;

  const items: OrcadoItem[] = [];
  obras.forEach((obra) => {
    const baseOrcamento = obra.orcamento / CATEGORIAS.length;
    CATEGORIAS.forEach((cat) => {
      const factor = cat === "Mão de Obra" ? 1.5 : cat === "Materiais" ? 1.3 : cat === "Outros" ? 0.3 : 1;
      const planejado = Math.round(baseOrcamento * factor);
      const variation = 0.7 + Math.random() * 0.6;
      items.push({
        obraId: obra.id,
        categoria: cat,
        planejado,
        realizado: Math.round(planejado * variation),
      });
    });
  });

  if (items.length === 0) {
    const mockObraId = "mock-001";
    CATEGORIAS.forEach((cat) => {
      const planejado =
        cat === "Materiais" ? 45000 :
        cat === "Mão de Obra" ? 55000 :
        cat === "Equipamentos" ? 18000 :
        cat === "Terceiros" ? 25000 :
        cat === "Administrativo" ? 12000 : 8000;
      const variation = 0.75 + Math.random() * 0.5;
      items.push({
        obraId: mockObraId,
        categoria: cat,
        planejado,
        realizado: Math.round(planejado * variation),
      });
    });
  }

  setOrcadoRealizado(items);
  return items;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getStatusColor(percentual: number): { bg: string; text: string; label: string } {
  if (percentual <= 100) return { bg: "bg-green-100", text: "text-green-700", label: "No orçamento" };
  if (percentual <= 115) return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Atenção" };
  return { bg: "bg-red-100", text: "text-red-700", label: "Acima" };
}

export default function OrcadoRealizadoPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [data, setData] = useState<OrcadoItem[]>([]);
  const [selectedObra, setSelectedObra] = useState<string>("");

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

  const totals = useMemo(() => {
    const planejado = filteredData.reduce((acc, d) => acc + d.planejado, 0);
    const realizado = filteredData.reduce((acc, d) => acc + d.realizado, 0);
    return { planejado, realizado, diferenca: realizado - planejado };
  }, [filteredData]);

  const chartData = filteredData.map((d) => ({
    categoria: d.categoria,
    Planejado: d.planejado,
    Realizado: d.realizado,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">Orçado x Realizado</h1>
          </div>
          <p className="text-gray-500 mt-1">Comparativo entre valores planejados e realizados por categoria</p>
        </div>
      </div>

      {/* Obra selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Obra</label>
        <select
          value={selectedObra}
          onChange={(e) => setSelectedObra(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {obraOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Planejado</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.planejado)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Realizado</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.realizado)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Diferença</p>
          <p className={`text-xl font-bold ${totals.diferenca > 0 ? "text-red-600" : "text-green-600"}`}>
            {totals.diferenca > 0 ? "+" : ""}{formatCurrency(totals.diferenca)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Planejado</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Realizado</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Diferença R$</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item, idx) => {
                const diff = item.realizado - item.planejado;
                const pct = item.planejado > 0 ? (item.realizado / item.planejado) * 100 : 0;
                const status = getStatusColor(pct);
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.categoria}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.planejado)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(item.realizado)}</td>
                    <td className={`px-6 py-4 text-sm text-right font-medium ${diff > 0 ? "text-red-600" : "text-green-600"}`}>
                      {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">{pct.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(totals.planejado)}</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(totals.realizado)}</td>
                <td className={`px-6 py-4 text-sm text-right ${totals.diferenca > 0 ? "text-red-600" : "text-green-600"}`}>
                  {totals.diferenca > 0 ? "+" : ""}{formatCurrency(totals.diferenca)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  {totals.planejado > 0 ? ((totals.realizado / totals.planejado) * 100).toFixed(1) : "0"}%
                </td>
                <td className="px-6 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativo por Categoria</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="Planejado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Realizado" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}