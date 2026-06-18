"use client";

import React from "react";
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
  ChevronUp,
  Loader2,
  Settings2,
  Info,
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

const FATORES_REGIONAIS: Record<string, number> = {
  AC: 1.15, AL: 1.05, AM: 1.18, AP: 1.16, BA: 1.02, CE: 1.03, DF: 1.08,
  ES: 1.01, GO: 1.02, MA: 1.06, MG: 0.98, MS: 1.04, MT: 1.05, PA: 1.12,
  PB: 1.04, PE: 1.03, PI: 1.06, PR: 0.97, RJ: 1.05, RN: 1.04, RO: 1.12,
  RR: 1.18, RS: 0.98, SC: 0.97, SE: 1.04, SP: 1.00, TO: 1.08,
};

interface BDIBreakdown {
  administracaoCentral: number;
  seguro: number;
  garantia: number;
  risco: number;
  despesasFinanceiras: number;
  lucro: number;
  pis: number;
  cofins: number;
  iss: number;
  cprb: number;
}

const BDI_PADRAO: BDIBreakdown = {
  administracaoCentral: 4.0,
  seguro: 0.8,
  garantia: 0.8,
  risco: 1.0,
  despesasFinanceiras: 1.2,
  lucro: 7.0,
  pis: 1.65,
  cofins: 7.6,
  iss: 2.0,
  cprb: 0.0,
};

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

interface ComposicaoDetalhe {
  tipo: "material" | "maoDeObra" | "equipamento";
  descricao: string;
  unidade: string;
  coeficiente: number;
  precoUnitario: number;
}

interface ItemOrcamento {
  id: string;
  codigo: string;
  descricao: string;
  fonte: "SINAPI" | "SICRO" | "TCPO";
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  composicao?: ComposicaoDetalhe[];
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
  const [bdiBreakdown, setBdiBreakdown] = useState<BDIBreakdown>(BDI_PADRAO);
  const [showBdiBreakdown, setShowBdiBreakdown] = useState(false);
  const [areaM2, setAreaM2] = useState(0);
  const [basePadrao, setBasePadrao] = useState<"SINAPI" | "SICRO" | "TCPO">("SINAPI");
  const [status, setStatus] = useState<"RASCUNHO" | "APROVADO">("RASCUNHO");
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [encargosHorista, setEncargosHorista] = useState(80);
  const [encargosMensalista, setEncargosMensalista] = useState(68);
  const [tipoEncargo, setTipoEncargo] = useState<"horista" | "mensalista">("horista");
  const [fatorRegional, setFatorRegional] = useState(1.0);
  const [contingencia, setContingencia] = useState(5);
  const [showCoeficientes, setShowCoeficientes] = useState(false);
  const [composicaoExpandida, setComposicaoExpandida] = useState<Record<string, boolean>>({});

  const [modalAberto, setModalAberto] = useState(false);
  const [capituloAtivo, setCapituloAtivo] = useState<string | null>(null);
  const [tabAtiva, setTabAtiva] = useState<"SINAPI" | "SICRO" | "TCPO">("SINAPI");
  const [buscaModal, setBuscaModal] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [resultados, setResultados] = useState<ItemBusca[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [showCurvaABC, setShowCurvaABC] = useState(false);
  const [showGrafico, setShowGrafico] = useState(false);

  useEffect(() => {
    const totalBdi =
      bdiBreakdown.administracaoCentral +
      bdiBreakdown.seguro +
      bdiBreakdown.garantia +
      bdiBreakdown.risco +
      bdiBreakdown.despesasFinanceiras +
      bdiBreakdown.lucro +
      bdiBreakdown.pis +
      bdiBreakdown.cofins +
      bdiBreakdown.iss +
      bdiBreakdown.cprb;
    setBdi(parseFloat(totalBdi.toFixed(2)));
  }, [bdiBreakdown]);

  useEffect(() => {
    setFatorRegional(FATORES_REGIONAIS[uf] || 1.0);
  }, [uf]);

  useEffect(() => {
    if (orcamentos.length > 0 && !loaded) {
      const existing = orcamentos.find((o: any) => o.id === id);
      if (existing) {
        setNome(existing.nome);
        setObraId(existing.obraId || "");
        setObraNome(existing.obraNome || "");
        setClienteNome(existing.clienteNome || "");
        setUf(existing.uf || "SP");
        setBdi(existing.bdi || 25);
        if (existing.bdiBreakdown) setBdiBreakdown(existing.bdiBreakdown);
        setAreaM2(existing.areaM2 || 0);
        setBasePadrao(existing.basePadrao || "SINAPI");
        setStatus(existing.status || "RASCUNHO");
        setCapitulos(existing.capitulos || []);
        if (existing.encargosHorista) setEncargosHorista(existing.encargosHorista);
        if (existing.encargosMensalista) setEncargosMensalista(existing.encargosMensalista);
        if (existing.tipoEncargo) setTipoEncargo(existing.tipoEncargo);
        if (existing.contingencia !== undefined) setContingencia(existing.contingencia);
        if (existing.fatorRegional) setFatorRegional(existing.fatorRegional);
      }
      setLoaded(true);
    }
  }, [orcamentos, id, loaded]);

  useEffect(() => {
    if (obraId) {
      const obra = obras.find((o: any) => o.id === obraId);
      if (obra) {
        setObraNome(obra.nome);
        setClienteNome(obra.cliente);
        if (obra.estado) setUf(obra.estado);
      }
    }
  }, [obraId, obras]);

  const custoMaoDeObra = useMemo(() => {
    return capitulos.reduce((acc, cap) => {
      return acc + cap.itens.reduce((s, item) => {
        if (item.composicao && item.composicao.length > 0) {
          const moTotal = item.composicao
            .filter(c => c.tipo === "maoDeObra")
            .reduce((sum, c) => sum + c.coeficiente * c.precoUnitario, 0);
          return s + moTotal * item.quantidade;
        }
        return s + item.quantidade * item.precoUnitario * 0.35;
      }, 0);
    }, 0);
  }, [capitulos]);

  const custoMateriais = useMemo(() => {
    return capitulos.reduce((acc, cap) => {
      return acc + cap.itens.reduce((s, item) => {
        if (item.composicao && item.composicao.length > 0) {
          const matTotal = item.composicao
            .filter(c => c.tipo === "material")
            .reduce((sum, c) => sum + c.coeficiente * c.precoUnitario, 0);
          return s + matTotal * item.quantidade;
        }
        return s + item.quantidade * item.precoUnitario * 0.5;
      }, 0);
    }, 0);
  }, [capitulos]);

  const custoEquipamentos = useMemo(() => {
    return capitulos.reduce((acc, cap) => {
      return acc + cap.itens.reduce((s, item) => {
        if (item.composicao && item.composicao.length > 0) {
          const eqTotal = item.composicao
            .filter(c => c.tipo === "equipamento")
            .reduce((sum, c) => sum + c.coeficiente * c.precoUnitario, 0);
          return s + eqTotal * item.quantidade;
        }
        return s + item.quantidade * item.precoUnitario * 0.15;
      }, 0);
    }, 0);
  }, [capitulos]);

  const subtotal = useMemo(() => {
    return capitulos.reduce((acc, cap) => {
      return acc + cap.itens.reduce((s, item) => s + item.quantidade * item.precoUnitario, 0);
    }, 0);
  }, [capitulos]);

  const subtotalComFator = subtotal * fatorRegional;
  const taxaEncargos = tipoEncargo === "horista" ? encargosHorista : encargosMensalista;
  const valorEncargos = custoMaoDeObra * fatorRegional * (taxaEncargos / 100);
  const custoDireto = subtotalComFator + valorEncargos;
  const valorBdi = custoDireto * (bdi / 100);
  const valorContingencia = custoDireto * (contingencia / 100);
  const total = custoDireto + valorBdi + valorContingencia;
  const custoPorM2 = areaM2 > 0 ? total / areaM2 : 0;

  const buscarItens = useCallback(async () => {
    if (!buscaModal && !grupoFiltro) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const tabela = tabAtiva.toLowerCase();
      const p = new URLSearchParams();
      p.set("uf", uf);
      if (buscaModal) p.set("busca", buscaModal);
      if (grupoFiltro) p.set("grupo", grupoFiltro);
      const res = await fetch(`/api/tabelas/${tabela}?${p.toString()}`);
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
    const timer = setTimeout(() => { buscarItens(); }, 300);
    return () => clearTimeout(timer);
  }, [buscarItens]);

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
    const composicao: ComposicaoDetalhe[] = [
      { tipo: "material", descricao: "Materiais diversos", unidade: item.unidade, coeficiente: 1, precoUnitario: item.preco * 0.5 },
      { tipo: "maoDeObra", descricao: "Mao de obra", unidade: "h", coeficiente: 1, precoUnitario: item.preco * 0.35 },
      { tipo: "equipamento", descricao: "Equipamentos", unidade: "h", coeficiente: 1, precoUnitario: item.preco * 0.15 },
    ];
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
              composicao,
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

  const toggleComposicao = (itemId: string) => {
    setComposicaoExpandida(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const salvar = () => {
    const dados: any = {
      nome, obraId, obraNome, clienteNome, uf, bdi, bdiBreakdown, areaM2, basePadrao, status, capitulos,
      encargosHorista, encargosMensalista, tipoEncargo, contingencia, fatorRegional,
      subtotal: subtotalComFator, valorBdi, valorEncargos, valorContingencia, total,
    };
    const existing = orcamentos.find((o: any) => o.id === id);
    if (existing) {
      updateOrcamento(id, dados);
    } else {
      createOrcamento({ ...dados, id } as any);
    }
    alert("Orcamento salvo com sucesso!");
  };

  const exportarPDF = () => { window.print(); };

  const exportarExcel = () => {
    const rows: any[] = [];
    let itemNum = 1;
    capitulos.forEach((cap) => {
      rows.push({ Item: "", Codigo: "", Descricao: `--- ${cap.nome} ---`, Fonte: "", Unidade: "", Qtd: "", "Preco Unit.": "", "Preco Total": "" });
      cap.itens.forEach((item) => {
        rows.push({ Item: itemNum++, Codigo: item.codigo, Descricao: item.descricao, Fonte: item.fonte, Unidade: item.unidade, Qtd: item.quantidade, "Preco Unit.": item.precoUnitario, "Preco Total": item.quantidade * item.precoUnitario });
      });
      const subtotalCap = cap.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
      rows.push({ Item: "", Codigo: "", Descricao: "SUBTOTAL", Fonte: "", Unidade: "", Qtd: "", "Preco Unit.": "", "Preco Total": subtotalCap });
    });
    rows.push({});
    rows.push({ Item: "", Codigo: "", Descricao: "CUSTO DIRETO (c/ fator regional)", "Preco Total": subtotalComFator });
    rows.push({ Item: "", Codigo: "", Descricao: `ENCARGOS SOCIAIS (${taxaEncargos}%)`, "Preco Total": valorEncargos });
    rows.push({ Item: "", Codigo: "", Descricao: `BDI (${bdi}%)`, "Preco Total": valorBdi });
    rows.push({ Item: "", Codigo: "", Descricao: `CONTINGENCIA (${contingencia}%)`, "Preco Total": valorContingencia });
    rows.push({ Item: "", Codigo: "", Descricao: "PRECO TOTAL", "Preco Total": total });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orcamento");
    XLSX.writeFile(wb, `${nome.replace(/\s+/g, "_")}.xlsx`);
  };

  const curvaABC = useMemo(() => {
    const todosItens = capitulos.flatMap((cap) =>
      cap.itens.map((item) => ({ ...item, capitulo: cap.nome, total: item.quantidade * item.precoUnitario }))
    );
    todosItens.sort((a, b) => b.total - a.total);
    let acumulado = 0;
    return todosItens.map((item) => {
      acumulado += item.total;
      return { ...item, acumulado, percentual: subtotal > 0 ? (acumulado / subtotal) * 100 : 0 };
    });
  }, [capitulos, subtotal]);

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
    return (<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[fonte] || ""}`}>{fonte}</span>);
  };

  const updateBdiField = (field: keyof BDIBreakdown, value: number) => {
    setBdiBreakdown(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orcamento de Obra</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={salvar} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Save className="h-4 w-4" /> Salvar</button>
          <button onClick={exportarPDF} className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"><FileDown className="h-4 w-4" /> PDF</button>
          <button onClick={exportarExcel} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
          <button onClick={() => { setShowCurvaABC(!showCurvaABC); setShowGrafico(false); }} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"><BarChart3 className="h-4 w-4" /> Curva ABC</button>
          <button onClick={() => { setShowGrafico(!showGrafico); setShowCurvaABC(false); }} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"><PieChart className="h-4 w-4" /> Grafico</button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 print:border print:shadow-none">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Nome</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Obra</label><select value={obraId} onChange={(e) => setObraId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"><option value="">Selecione...</option>{obras.map((o: any) => (<option key={o.id} value={o.id}>{o.nome}</option>))}</select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Cliente</label><input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">UF</label><select value={uf} onChange={(e) => setUf(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">{ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}</select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">BDI Total (%)</label><div className="flex items-center gap-2"><input type="number" value={bdi} readOnly className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white" /><button onClick={() => setShowBdiBreakdown(!showBdiBreakdown)} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" title="Configurar BDI"><Settings2 className="h-4 w-4" /></button></div></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Area (m2)</label><input type="number" value={areaM2} onChange={(e) => setAreaM2(Number(e.target.value))} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Base Padrao</label><select value={basePadrao} onChange={(e) => setBasePadrao(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"><option value="SINAPI">SINAPI</option><option value="SICRO">SICRO</option><option value="TCPO">TCPO</option></select></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"><option value="RASCUNHO">Rascunho</option><option value="APROVADO">Aprovado</option></select></div>
        </div>
        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button onClick={() => setShowCoeficientes(!showCoeficientes)} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">
            <Settings2 className="h-4 w-4" /> Coeficientes de Calculo {showCoeficientes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showCoeficientes && (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Tipo Encargo</label><select value={tipoEncargo} onChange={(e) => setTipoEncargo(e.target.value as any)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"><option value="horista">Horista</option><option value="mensalista">Mensalista</option></select></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Encargos Horista (%)</label><input type="number" value={encargosHorista} onChange={(e) => setEncargosHorista(Number(e.target.value))} min={0} max={200} step={0.1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Encargos Mensalista (%)</label><input type="number" value={encargosMensalista} onChange={(e) => setEncargosMensalista(Number(e.target.value))} min={0} max={200} step={0.1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Fator Regional ({uf})</label><input type="number" value={fatorRegional} onChange={(e) => setFatorRegional(Number(e.target.value))} min={0.5} max={2} step={0.01} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
              <div><label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Contingencia (%)</label><input type="number" value={contingencia} onChange={(e) => setContingencia(Number(e.target.value))} min={0} max={30} step={0.5} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            </div>
          )}
        </div>
      </div>

      {showBdiBreakdown && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm dark:border-blue-900 dark:bg-blue-950/30 print:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Composicao do BDI</h2>
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"><Info className="h-3 w-3" /> Total: {bdi.toFixed(2)}%</div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Adm. Central (%)</label><input type="number" value={bdiBreakdown.administracaoCentral} onChange={(e) => updateBdiField("administracaoCentral", Number(e.target.value))} step={0.1} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Seguro (%)</label><input type="number" value={bdiBreakdown.seguro} onChange={(e) => updateBdiField("seguro", Number(e.target.value))} step={0.1} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Garantia (%)</label><input type="number" value={bdiBreakdown.garantia} onChange={(e) => updateBdiField("garantia", Number(e.target.value))} step={0.1} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Risco (%)</label><input type="number" value={bdiBreakdown.risco} onChange={(e) => updateBdiField("risco", Number(e.target.value))} step={0.1} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Desp. Financeiras (%)</label><input type="number" value={bdiBreakdown.despesasFinanceiras} onChange={(e) => updateBdiField("despesasFinanceiras", Number(e.target.value))} step={0.1} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Lucro (%)</label><input type="number" value={bdiBreakdown.lucro} onChange={(e) => updateBdiField("lucro", Number(e.target.value))} step={0.1} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">PIS (%)</label><input type="number" value={bdiBreakdown.pis} onChange={(e) => updateBdiField("pis", Number(e.target.value))} step={0.01} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">COFINS (%)</label><input type="number" value={bdiBreakdown.cofins} onChange={(e) => updateBdiField("cofins", Number(e.target.value))} step={0.01} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">ISS (%)</label><input type="number" value={bdiBreakdown.iss} onChange={(e) => updateBdiField("iss", Number(e.target.value))} step={0.01} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
            <div><label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">CPRB (%)</label><input type="number" value={bdiBreakdown.cprb} onChange={(e) => updateBdiField("cprb", Number(e.target.value))} step={0.01} min={0} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></div>
          </div>
        </div>
      )}

      {showCurvaABC && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 print:hidden">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Curva ABC</h2>
          {curvaABC.length === 0 ? (<p className="text-sm text-gray-500">Adicione itens ao orcamento para visualizar a Curva ABC.</p>) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Codigo</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Descricao</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Capitulo</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Valor</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">% Item</th>
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
                      <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{subtotal > 0 ? ((item.total / subtotal) * 100).toFixed(2) : "0.00"}%</td>
                      <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{item.percentual.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.percentual <= 80 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : item.percentual <= 95 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
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

      {showGrafico && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 print:hidden">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Distribuicao por Capitulo</h2>
          {dadosGrafico.length === 0 ? (<p className="text-sm text-gray-500">Adicione itens para visualizar o grafico.</p>) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={dadosGrafico} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                    {dadosGrafico.map((_, index) => (<Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Composicao</h2>
          <button onClick={adicionarCapitulo} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 print:hidden"><Plus className="h-4 w-4" /> Adicionar Capitulo</button>
        </div>
        {capitulos.length === 0 && (<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 dark:border-gray-600"><p className="text-sm text-gray-500 dark:text-gray-400">Adicione capitulos para organizar o orcamento.</p></div>)}
        {capitulos.map((cap, capIdx) => {
          const subtotalCap = cap.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
          const percentualCap = subtotal > 0 ? ((subtotalCap / subtotal) * 100).toFixed(1) : "0.0";
          return (
            <div key={cap.id} className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 dark:bg-gray-900/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{capIdx + 1}. {cap.nome}</h3>
                <div className="flex items-center gap-2 print:hidden">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{percentualCap}%</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{formatCurrency(subtotalCap)}</span>
                  <button onClick={() => abrirModalBusca(cap.id)} className="rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => removerCapitulo(cap.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
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
                        <th className="px-3 py-2 w-16 print:hidden"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {cap.itens.map((item, itemIdx) => (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-3 py-2 text-gray-500">{itemIdx + 1}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{item.codigo}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white max-w-xs truncate" title={item.descricao}>{item.descricao}</td>
                            <td className="px-3 py-2 text-center">{getFonteBadge(item.fonte)}</td>
                            <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{item.unidade}</td>
                            <td className="px-3 py-2 text-center"><input type="number" value={item.quantidade} onChange={(e) => atualizarQuantidade(cap.id, item.id, Math.max(0, Number(e.target.value)))} className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white print:border-none print:bg-transparent" min={0} step={0.01} /></td>
                            <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.precoUnitario)}</td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.quantidade * item.precoUnitario)}</td>
                            <td className="px-3 py-2 print:hidden"><div className="flex items-center gap-1"><button onClick={() => toggleComposicao(item.id)} className="text-blue-400 hover:text-blue-600" title="Ver composicao">{composicaoExpandida[item.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button><button onClick={() => removerItem(cap.id, item.id)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button></div></td>
                          </tr>
                          {composicaoExpandida[item.id] && item.composicao && (
                            <tr><td colSpan={9} className="bg-gray-50/80 px-6 py-2 dark:bg-gray-900/30"><div className="text-xs"><p className="mb-1 font-medium text-gray-700 dark:text-gray-300">Composicao Analitica:</p><div className="grid grid-cols-1 gap-1 sm:grid-cols-3">{item.composicao.filter(c => c.tipo === "material").length > 0 && (<div className="rounded border border-blue-100 bg-blue-50/50 p-2 dark:border-blue-900/30 dark:bg-blue-950/20"><p className="font-medium text-blue-700 dark:text-blue-400">Materiais</p>{item.composicao.filter(c => c.tipo === "material").map((c, ci) => (<p key={ci} className="text-gray-600 dark:text-gray-400">{c.descricao}: {formatCurrency(c.coeficiente * c.precoUnitario)}</p>))}</div>)}{item.composicao.filter(c => c.tipo === "maoDeObra").length > 0 && (<div className="rounded border border-green-100 bg-green-50/50 p-2 dark:border-green-900/30 dark:bg-green-950/20"><p className="font-medium text-green-700 dark:text-green-400">Mao de Obra</p>{item.composicao.filter(c => c.tipo === "maoDeObra").map((c, ci) => (<p key={ci} className="text-gray-600 dark:text-gray-400">{c.descricao}: {formatCurrency(c.coeficiente * c.precoUnitario)}</p>))}</div>)}{item.composicao.filter(c => c.tipo === "equipamento").length > 0 && (<div className="rounded border border-orange-100 bg-orange-50/50 p-2 dark:border-orange-900/30 dark:bg-orange-950/20"><p className="font-medium text-orange-700 dark:text-orange-400">Equipamentos</p>{item.composicao.filter(c => c.tipo === "equipamento").map((c, ci) => (<p key={ci} className="text-gray-600 dark:text-gray-400">{c.descricao}: {formatCurrency(c.coeficiente * c.precoUnitario)}</p>))}</div>)}</div></div></td></tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {cap.itens.length === 0 && (<div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">Nenhum item. Clique em + para adicionar.</div>)}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Resumo do Orcamento</h2>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 dark:border-blue-900/30 dark:bg-blue-950/20"><span className="text-xs text-blue-700 dark:text-blue-400">Materiais</span><span className="text-sm font-medium text-blue-800 dark:text-blue-300">{formatCurrency(custoMateriais * fatorRegional)}</span></div>
          <div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 px-3 py-2 dark:border-green-900/30 dark:bg-green-950/20"><span className="text-xs text-green-700 dark:text-green-400">Mao de Obra</span><span className="text-sm font-medium text-green-800 dark:text-green-300">{formatCurrency(custoMaoDeObra * fatorRegional)}</span></div>
          <div className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 dark:border-orange-900/30 dark:bg-orange-950/20"><span className="text-xs text-orange-700 dark:text-orange-400">Equipamentos</span><span className="text-sm font-medium text-orange-800 dark:text-orange-300">{formatCurrency(custoEquipamentos * fatorRegional)}</span></div>
        </div>
        <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Subtotal (itens)</span><span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span></div>
          {fatorRegional !== 1.0 && (<div className="flex items-center justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Fator Regional ({uf}: x{fatorRegional.toFixed(2)})</span><span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotalComFator)}</span></div>)}
          <div className="flex items-center justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Encargos Sociais ({tipoEncargo} {taxaEncargos}% s/ MO)</span><span className="font-medium text-amber-700 dark:text-amber-400">{formatCurrency(valorEncargos)}</span></div>
          <div className="border-t border-gray-200 pt-2 dark:border-gray-700"><div className="flex items-center justify-between text-sm font-medium"><span className="text-gray-700 dark:text-gray-300">Custo Direto</span><span className="text-gray-900 dark:text-white">{formatCurrency(custoDireto)}</span></div></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">BDI ({bdi}%)</span><span className="font-medium text-blue-700 dark:text-blue-400">{formatCurrency(valorBdi)}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Contingencia ({contingencia}%)</span><span className="font-medium text-orange-700 dark:text-orange-400">{formatCurrency(valorContingencia)}</span></div>
          <div className="border-t-2 border-gray-300 pt-2 dark:border-gray-600"><div className="flex items-center justify-between"><span className="text-base font-bold text-gray-900 dark:text-white">PRECO TOTAL</span><span className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(total)}</span></div></div>
          {areaM2 > 0 && (<div className="flex items-center justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">Custo por m2</span><span className="font-medium text-purple-700 dark:text-purple-400">{formatCurrency(custoPorM2)}</span></div>)}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className="relative mx-4 flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700"><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Buscar Item</h2><button onClick={() => setModalAberto(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button></div>
            <div className="flex border-b border-gray-200 px-6 dark:border-gray-700">
              {(["SINAPI", "SICRO", "TCPO"] as const).map((tab) => (<button key={tab} onClick={() => { setTabAtiva(tab); setResultados([]); }} className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tabAtiva === tab ? tab === "SINAPI" ? "border-blue-500 text-blue-600" : tab === "SICRO" ? "border-green-500 text-green-600" : "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>{tab}</button>))}
            </div>
            <div className="flex gap-3 px-6 py-4">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Buscar por codigo ou descricao..." value={buscaModal} onChange={(e) => setBuscaModal(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" autoFocus /></div>
              <input type="text" placeholder="Filtrar por grupo..." value={grupoFiltro} onChange={(e) => setGrupoFiltro(e.target.value)} className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {buscando ? (<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /><span className="ml-2 text-sm text-gray-500">Buscando...</span></div>) : resultados.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0"><tr><th className="px-3 py-2 text-left font-medium text-gray-500">Codigo</th><th className="px-3 py-2 text-left font-medium text-gray-500">Descricao</th><th className="px-3 py-2 text-center font-medium text-gray-500">Und</th><th className="px-3 py-2 text-right font-medium text-gray-500">Preco ({uf})</th><th className="px-3 py-2 w-10"></th></tr></thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {resultados.map((item) => (<tr key={item.codigo} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer" onClick={() => adicionarItem(item)}><td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{item.codigo}</td><td className="px-3 py-2 text-gray-900 dark:text-white max-w-sm truncate" title={item.descricao}>{item.descricao}</td><td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{item.unidade}</td><td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.preco)}</td><td className="px-3 py-2"><Plus className="h-4 w-4 text-blue-500" /></td></tr>))}
                  </tbody>
                </table>
              ) : (<div className="flex flex-col items-center justify-center py-12 text-gray-400"><Search className="h-8 w-8 mb-2" /><p className="text-sm">Digite para buscar itens na tabela {tabAtiva}</p></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
