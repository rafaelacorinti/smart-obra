"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Trash2, FileCode2 } from "lucide-react";
import { useOrcamentos, useObras } from "@/hooks/use-storage-data";
import { generateId } from "@/lib/storage";

export default function OrcamentosPage() {
  const { orcamentos, deleteOrcamento, createOrcamento } = useOrcamentos();
  const { obras } = useObras();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroObra, setFiltroObra] = useState<string>("TODOS");
  const [busca, setBusca] = useState("");

  const orcamentosFiltrados = orcamentos.filter((orc) => {
    const matchStatus = filtroStatus === "todos" || orc.status === filtroStatus;
    const matchObra = filtroObra === "TODOS" || orc.obraId === filtroObra;
    const matchBusca =
      busca === "" ||
      orc.nome.toLowerCase().includes(busca.toLowerCase()) ||
      orc.obraNome?.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca && matchObra;
  });

  const handleNovoOrcamento = () => {
    const novoId = generateId();
    const obraFiltrada = filtroObra !== "TODOS" ? obras.find((o) => o.id === filtroObra) : undefined;
    createOrcamento({
      nome: "Novo Orcamento",
      obraId: obraFiltrada?.id ?? "",
      obraNome: obraFiltrada?.nome ?? "",
      clienteNome: "",
      uf: "SP",
      bdi: 25,
      areaM2: 0,
      basePadrao: "SINAPI",
      status: "RASCUNHO",
      capitulos: [],
      subtotal: 0,
      valorBdi: 0,
      total: 0,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RASCUNHO":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Rascunho
          </span>
        );
      case "APROVADO":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Aprovado
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orcamentos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie orcamentos de obras com base nas tabelas SINAPI, SICRO e TCPO
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/orcamentos/analisar-projeto"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-indigo-600 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 transition-colors dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
          >
            <FileCode2 className="h-4 w-4" />
            Analisar Projeto (CAD)
          </Link>
          <Link
            href={`/orcamentos/${generateId()}`}
            onClick={handleNovoOrcamento}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Orcamento
          </Link>
        </div>
      </div>

      {/* CAD Analysis Card */}
      <Link
        href="/orcamentos/analisar-projeto"
        className="block rounded-xl border-2 border-dashed border-indigo-300 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 hover:border-indigo-400 hover:shadow-md transition-all dark:border-indigo-700 dark:from-indigo-900/20 dark:to-blue-900/20 dark:hover:border-indigo-600"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <FileCode2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Analise de Projeto CAD</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Faca upload de arquivos DWG, DXF ou IFC para levantamento automatico de quantitativos e geracao de orcamento
            </p>
          </div>
        </div>
      </Link>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar orcamento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {["todos", "RASCUNHO", "APROVADO"].map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filtroStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {status === "todos" ? "Todos" : status === "RASCUNHO" ? "Rascunho" : "Aprovado"}
            </button>
          ))}
        </div>
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

      {/* List */}
      {orcamentosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800/50">
          <FileText className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum orcamento encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crie um novo orcamento para comecar.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Obra
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Valor Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orcamentosFiltrados.map((orc) => (
                <tr
                  key={orc.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/orcamentos/${orc.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      {orc.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {orc.obraNome || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {orc.criadoEm}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(orc.total)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(orc.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteOrcamento(orc.id)}
                      className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}