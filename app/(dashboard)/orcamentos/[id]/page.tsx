"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Save,
  FileDown,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  Trash2,
  Search,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useOrcamentos, useObras } from "@/hooks/use-storage-data";
import { generateId } from "@/lib/storage";
import { PieChart as RechartsPie, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";

const ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
];

const CORES_GRAFICO = [
  "#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4",
  "#ec4899","#14b8a6","#f97316","#6366f1","#84cc16","#a855f7"
];

interface ItemBusca {
  codigo: string;
  descricao: string;
  unidade: string;
  grupo: string;
  preco: number;
  fonte: "SINAPI" | "SICRO" | "TCPO";
  mesReferencia: string;
  produtividade?: string;
}

interface ItemOrcamento {
  id: string;
  codigo: string;
  descricao: string;
  fonte: "SINAPI" | "SICRO" | "TCPO";
  unidade: string;
  quantidade: number;
  precoUnitario: number;
}

interface Capitulo {
  id: string;
  nome: string;
  itens: ItemOrcamento[];
}

export default function OrcamentoDetalhe() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { orcamentos, updateOrcamento, createOrcamento } = useOrcamentos();
  const { obras } = useObras();

  const [nome, setNome] = useState("Novo Orcamento");
  const [obraId, setObraId] = useState("");
  const [obraNome, setObraNome] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [uf, setUf] = useState("SP");
  const [bdi, setBdi] = useState(25);
  const [areaM2, setAreaM2] = useState(0);
  const [basePadrao, setBasePadrao] = useState<"SINAPI" | "SICRO" | "TCPO">("SINAPI");
  const [status, setStatus] = useState<"RASCUNHO" | "APROVADO">("RASCUNHO");
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Modal state
  const [modalAberto, setModalAberto] = useState(false);
  const [capituloAtivo, setCapituloAtivo] = useState<string | null>(null);
  const [tabAtiva, setTabAtiva] = useState<"SINAPI" | "SICRO" | "TCPO">("SINAPI");
  const [buscaModal, setBuscaModal] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [resultados, setResultados] = useState<ItemBusca[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Views
  const [showCurvaABC, setShowCurvaABC] = useState(false);
  const [showGrafico, setShowGrafico] = useState(false);

  // Load existing orcamento
  useEffect(() => {
    if (orcamentos.length > 0 && !loaded) {
      const existing = orcamentos.find((o) => o.id === id);
      if (existing) {
        setNome(existing.nome);
        setObraId(existing.obraId || "");
        setObraNome(existing.obraNome || "");
        setClienteNome(existing.clienteNome || "");
        setUf(existing.uf || "SP");
        setBdi(existing.bdi || 25);
        setAreaM2(existing.areaM2 || 0);
        setBasePadrao(existing.basePadrao || "SINAPI");
        setStatus(existing.status || "RASCUNHO");
        setCapitulos(existing.capitulos || []);
      }
      setLoaded(true);
    }
  }, [orcamentos, id, loaded]);

  // Auto-fill client when obra changes
  useEffect(() => {
    if (obraId) {
      const obra = obras.find((o) => o.id === obraId);
      if (obra) {
        setObraNome(obra.nome);
        setClienteNome(obra.cliente);
        if (obra.estado) setUf(obra.estado);
      }
    }
  }, [obraId, obras]);

  // Calculations
  const subtotal = useMemo(() => {
    return capitulos.reduce((acc, cap) => {
      return acc + cap.itens.reduce((s, item) => s + item.quantidade * item.precoUnitario, 0);
    }, 0);
  }, [capitulos]);

  const valorBdi = subtotal * (bdi / 100);
  const total = subtotal + valorBdi;
  const custoPorM2 = areaM2 > 0 ? total / areaM2 : 0;

  // Search API
  const buscarItens = useCallback(async () => {
    if (!buscaModal && !grupoFiltro) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const tabela = tabAtiva.toLowerCase();
      const params = new URLSearchParams();
      params.set("uf", uf);
      if (buscaModal) params.set("busca", buscaModal);
      if (grupoFiltro) params.set("grupo", grupoFiltro);
      const res = await fetch(`/api/tabelas/${tabela}?${params.toString()}`);
      const data = await res.json();
      setResultados(data);
    } catch (e) {
      console.error("Erro ao buscar itens:", e);
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }, [buscaModal, grupoFiltro, tabAtiva, uf]);

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarItens();
    }, 300);
    return () => clearTimeout(timer);
  }, [buscarItens]);

  // Actions
  const adicionarCapitulo = () => {
    const nomeCapitulo = prompt("Nome do capitulo:");
    if (!nomeCapitulo) return;
    setCapitulos((prev) => [...prev, { id: generateId(), nome: nomeCapitulo, itens: [] }]);
  };

  const removerCapitulo = (capId: string) => {
    if (!confirm("Remover este capitulo e todos seus itens?")) return;
    setCapitulos((prev) => prev.filter((c) => c.id !== capId));
  };

  const abrirModalBusca = (capId: string) => {
    setCapituloAtivo(capId);
    setTabAtiva(basePadrao);
    setBuscaModal("");
    setGrupoFiltro("");
    setResultados([]);
    setModalAberto(true);
  };

  const adicionarItem = (item: ItemBusca) => {
    if (!capituloAtivo) return;
    setCapitulos((prev) =>
      prev.map((cap) => {
        if (cap.id !== capituloAtivo) return cap;
        return {
          ...cap,
          itens: [
            ...cap.itens,
            {
              id: generateId(),
              codigo: item.codigo,
              descricao: item.descricao,
              fonte: item.fonte,
              unidade: item.unidade,
              quantidade: 1,
              precoUnitario: item.preco,
            },
          ],
        };
      })
    );
  };

  const removerItem = (capId: string, itemId: string) => {
    setCapitulos((prev) =>
      prev.map((cap) => {
        if (cap.id !== capId) return cap;
        return { ...cap, itens: cap.itens.filter((i) => i.id !== itemId) };
      })
    );
  };

  const atualizarQuantidade = (capId: string, itemId: string, qtd: number) => {
    setCapitulos((prev) =>
      prev.map((cap) => {
        if (cap.id !== capId) return cap;
        return {
          ...cap,
          itens: cap.itens.map((i) => (i.id === itemId ? { ...i, quantidade: qtd } : i)),
        };
      })
    );
  };

  const salvar = () => {
    const dados = {
      nome,
      obraId,
      obraNome,
      clienteNome,
      uf,
      bdi,
      areaM2,
      basePadrao,
      status,
      capitulos,
      subtotal,
      valorBdi,
      total,
    };
    const existing = orcamentos.find((o) => o.id === id);
    if (existing) {
      updateOrcamento(id, dados);
    } else {
      createOrcamento({ ...dados, id } as any);
    }
    alert("Orcamento salvo com sucesso!");
  };

  const exportarPDF = () => {
    window.print();
  };

  const exportarExcel = () => {
    const rows: any[] = [];
    let itemNum = 1;
    capitulos.forEach((cap) => {
      rows.push({ Item: "", Codigo: "", Descricao: `--- ${cap.nome} ---`, Fonte: "", Unidade: "", Qtd: "", "Preco Unit.": "", "Preco Total": "" });
      cap.itens.forEach((item) => {
        rows.push({
          Item: itemNum++,
          Codigo: item.codigo,
          Descricao: item.descricao,
          Fonte: item.fonte,
          Unidade: item.unidade,
          Qtd: item.quantidade,
          "Preco Unit.": item.precoUnitario,
          "Preco Total": item.quantidade * item.precoUnitario,
        });
      });
      const subtotalCap = cap.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
      rows.push({ Item: "", Codigo: "", Descricao: "SUBTOTAL", Fonte: "", Unidade: "", Qtd: "", "Preco Unit.": "", "Preco Total": subtotalCap });
    });
    rows.push({});
    rows.push({ Item: "", Codigo: "", Descricao: "SUBTOTAL GERAL", Fonte: "", Unidade: "", Qtd: "", "Preco Unit.": "", "Preco Total": subtotal });
    rows.push({ Item: "", Codigo: "", Descricao: `BDI (${bdi}%)`, Fonte: "", Unidade: "", Qtd: "", "Preco Unit.": "", "Preco Total": valorBdi });
    rows.push({ Item: "", Codigo: "", Descricao: "TOTAL COM BDI", Fonte: "", Unidade: "", Qtd: "", "Preco Unit.": "", "Preco Total": total });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orcamento");
    XLSX.writeFile(wb, `${nome.replace(/\s+/g, "_")}.xlsx`);
  };

  // Curva ABC data
  const curvaABC = useMemo(() => {
    const todosItens = capitulos.flatMap((cap) =>
      cap.itens.map((item) => ({
        ...item,
        capitulo: cap.nome,
        total: item.quantidade * item.precoUnitario,
      }))
    );
    todosItens.sort((a, b) => b.total - a.total);
    let acumulado = 0;
    return todosItens.map((item) => {
      acumulado += item.total;
      return { ...item, acumulado, percentual: subtotal > 0 ? (acumulado / subtotal) * 100 : 0 };
    });
  }, [capitulos, subtotal]);

  // Pie chart data
  const dadosGrafico = useMemo(() => {
    return capitulos.map((cap) => ({
      name: cap.nome,
      value: cap.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0),
    })).filter((d) => d.value > 0);
  }, [capitulos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getFonteBadge = (fonte: string) => {
    const colors: Record<string, string> = {
      SINAPI: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      SICRO: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      TCPO: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[fonte] || ""}`}>
        {fonte}
      </span>
    );
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Orcamento de Obra
        </h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={salvar} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Save className="h-4 w-4" /> Salvar
          </button>
          <button onClick={exportarPDF} className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
            <FileDown className="h-4 w-4" /> PDF
          </button>
          <button onClick={exportarExcel} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => { setShowCurvaABC(!showCurvaABC); setShowGrafico(false); }} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
            <BarChart3 className="h-4 w-4" /> Curva ABC
          </button>
          <button onClick={() => { setShowGrafico(!showGrafico); setShowCurvaABC(false); }} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
            <PieChart className="h-4 w-4" /> Grafico
          </button>
        </div>
      </div>

      {/* Form fields */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 print:border print:shadow-none">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Nome</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Obra</label>
            <select value={obraId} onChange={(e) => setObraId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">Selecione...</option>
              {obras.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Cliente</label>
            <input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">UF</label>
            <select value={uf} onChange={(e) => setUf(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">BDI (%)</label>
            <input type="number" value={bdi} onChange={(e) => setBdi(Number(e.target.value))} min={0} max={100} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Area (m2)</label>
            <input type="number" value={areaM2} onChange={(e) => setAreaM2(Number(e.target.value))} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Base Padrao</label>
            <select value={basePadrao} onChange={(e) => setBasePadrao(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="SINAPI">SINAPI</option>
              <option value="SICRO">SICRO</option>
              <option value="TCPO">TCPO</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="RASCUNHO">Rascunho</option>
              <option value="APROVADO">Aprovado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Curva ABC */}
      {showCurvaABC && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 print:hidden">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Curva ABC</h2>
          {curvaABC.length === 0 ? (
            <p className="text-sm text-gray-500">Adicione itens ao orcamento para visualizar a Curva ABC.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Codigo</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Descricao</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Capitulo</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Valor</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">% Acum.</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">Classe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {curvaABC.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-300">{item.codigo}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-white max-w-xs truncate">{item.descricao}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{item.capitulo}</td>
                      <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                      <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{item.percentual.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.percentual <= 80 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          item.percentual <= 95 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {item.percentual <= 80 ? "A" : item.percentual <= 95 ? "B" : "C"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grafico Pizza */}
      {showGrafico && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 print:hidden">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Distribuicao por Capitulo</h2>
          {dadosGrafico.length === 0 ? (
            <p className="text-sm text-gray-500">Adicione itens para visualizar o grafico.</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={dadosGrafico} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {dadosGrafico.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Chapters + Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Composicao</h2>
          <button onClick={adicionarCapitulo} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 print:hidden">
            <Plus className="h-4 w-4" /> Adicionar Capitulo
          </button>
        </div>

        {capitulos.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">Adicione capitulos para organizar o orcamento.</p>
          </div>
        )}

        {capitulos.map((cap, capIdx) => {
          const subtotalCap = cap.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
          return (
            <div key={cap.id} className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 dark:bg-gray-900/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {capIdx + 1}. {cap.nome}
                </h3>
                <div className="flex items-center gap-2 print:hidden">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{formatCurrency(subtotalCap)}</span>
                  <button onClick={() => abrirModalBusca(cap.id)} className="rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button onClick={() => removerCapitulo(cap.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {cap.itens.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                    <thead className="bg-gray-50/50 dark:bg-gray-900/30">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 w-10">#</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Codigo</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Descricao</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Fonte</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Und</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400 w-20">Qtd</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">P. Unit.</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">P. Total</th>
                        <th className="px-3 py-2 w-10 print:hidden"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {cap.itens.map((item, itemIdx) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-3 py-2 text-gray-500">{itemIdx + 1}</td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{item.codigo}</td>
                          <td className="px-3 py-2 text-gray-900 dark:text-white max-w-xs truncate" title={item.descricao}>{item.descricao}</td>
                          <td className="px-3 py-2 text-center">{getFonteBadge(item.fonte)}</td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{item.unidade}</td>
                          <td className="px-3 py-2 text-center print:text-center">
                            <input
                              type="number"
                              value={item.quantidade}
                              onChange={(e) => atualizarQuantidade(cap.id, item.id, Math.max(0, Number(e.target.value)))}
                              className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white print:border-none print:bg-transparent"
                              min={0}
                              step={0.01}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.precoUnitario)}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.quantidade * item.precoUnitario)}</td>
                          <td className="px-3 py-2 print:hidden">
                            <button onClick={() => removerItem(cap.id, item.id)} className="text-red-400 hover:text-red-600">
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {cap.itens.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                  Nenhum item. Clique em + para adicionar.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Resumo</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Subtotal</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(subtotal)}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-600 dark:text-blue-400">BDI ({bdi}%)</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(valorBdi)}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <p className="text-xs text-green-600 dark:text-green-400">Total com BDI</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(total)}</p>
          </div>
          {areaM2 > 0 && (
            <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
              <p className="text-xs text-purple-600 dark:text-purple-400">Custo/m2</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(custoPorM2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className="relative mx-4 flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Buscar Item</h2>
              <button onClick={() => setModalAberto(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 dark:border-gray-700">
              {(["SINAPI", "SICRO", "TCPO"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setTabAtiva(tab); setResultados([]); }}
                  className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    tabAtiva === tab
                      ? tab === "SINAPI" ? "border-blue-500 text-blue-600" : tab === "SICRO" ? "border-green-500 text-green-600" : "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex gap-3 px-6 py-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por codigo ou descricao..."
                  value={buscaModal}
                  onChange={(e) => setBuscaModal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
              <input
                type="text"
                placeholder="Filtrar por grupo..."
                value={grupoFiltro}
                onChange={(e) => setGrupoFiltro(e.target.value)}
                className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {buscando ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">Buscando...</span>
                </div>
              ) : resultados.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Codigo</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Descricao</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-500">Und</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Preco ({uf})</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {resultados.map((item) => (
                      <tr key={item.codigo} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer" onClick={() => adicionarItem(item)}>
                        <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{item.codigo}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white max-w-sm truncate" title={item.descricao}>{item.descricao}</td>
                        <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{item.unidade}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.preco)}</td>
                        <td className="px-3 py-2">
                          <Plus className="h-4 w-4 text-blue-500" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Search className="h-8 w-8 mb-2" />
                  <p className="text-sm">Digite para buscar itens na tabela {tabAtiva}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
