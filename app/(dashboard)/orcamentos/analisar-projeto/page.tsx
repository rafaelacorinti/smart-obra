"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload, FileText, CheckCircle2, Loader2, ArrowLeft,
  Building2, MapPin, Layers, Ruler, AlertTriangle,
  FileSpreadsheet, DollarSign, BarChart3, Sparkles
} from "lucide-react";
import { analyzeProject, gerarCapitulosOrcamento, ConfigAnalise, AnaliseResultado, TipoObra, PadraoAcabamento } from "@/lib/project-analyzer";
import { analyzeDxfFile } from "@/lib/dxf-parser";
import { analyzeIfcFile } from "@/lib/ifc-analyzer";
import { useOrcamentos } from "@/hooks/use-storage-data";
import { generateId } from "@/lib/storage";

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  extension: string;
  content?: string;
}

type AnalysisStep = {
  label: string;
  duration: number;
  done: boolean;
  active: boolean;
};

export default function AnalisarProjetoPage() {
  const router = useRouter();
  const { createOrcamento } = useOrcamentos();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileContent, setFileContent] = useState<string>("");

  // Config state
  const [uf, setUf] = useState("SP");
  const [tipoObra, setTipoObra] = useState<TipoObra>("Residencial");
  const [padrao, setPadrao] = useState<PadraoAcabamento>("Medio");
  const [areaTotal, setAreaTotal] = useState<number>(150);
  const [pavimentos, setPavimentos] = useState<number>(1);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [steps, setSteps] = useState<AnalysisStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<AnaliseResultado | null>(null);
  const [showDwgWarning, setShowDwgWarning] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (!['dwg', 'dxf', 'ifc'].includes(ext)) {
      alert('Formato nao suportado. Aceitos: .dwg, .dxf, .ifc');
      return;
    }

    const uploaded: UploadedFile = {
      name: f.name,
      size: f.size,
      type: f.type,
      extension: ext,
    };

    setFile(uploaded);
    setShowDwgWarning(ext === 'dwg');
    setResultado(null);

    // Read file content for DXF and IFC
    if (ext === 'dxf' || ext === 'ifc') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content || "");

        // Try to extract area from file
        if (ext === 'dxf' && content) {
          const dxfResult = analyzeDxfFile(content);
          if (dxfResult.estimatedArea > 10) {
            setAreaTotal(Math.round(dxfResult.estimatedArea));
          }
        }
        if (ext === 'ifc' && content) {
          const ifcResult = analyzeIfcFile(content);
          if (ifcResult.summary.estimatedSlabArea > 10) {
            setAreaTotal(Math.round(ifcResult.summary.estimatedSlabArea));
            setPavimentos(ifcResult.summary.estimatedFloors);
          }
        }
      };
      reader.readAsText(f);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const runAnalysis = async () => {
    if (!file) return;

    setAnalyzing(true);
    setResultado(null);

    const analysisSteps: AnalysisStep[] = [
      { label: 'Lendo arquivo...', duration: 2000, done: false, active: false },
      { label: 'Identificando elementos construtivos...', duration: 3000, done: false, active: false },
      { label: 'Calculando quantitativos...', duration: 3000, done: false, active: false },
      { label: 'Vinculando a tabela de precos...', duration: 2000, done: false, active: false },
      { label: 'Gerando orcamento detalhado...', duration: 2000, done: false, active: false },
    ];

    setSteps(analysisSteps);
    setProgress(0);

    const totalDuration = analysisSteps.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;

    for (let i = 0; i < analysisSteps.length; i++) {
      setCurrentStep(i);
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        active: idx === i,
        done: idx < i,
      })));

      // Animate progress during step
      const stepStart = elapsed;
      const stepDuration = analysisSteps[i].duration;
      const interval = 50;
      const increments = stepDuration / interval;

      for (let j = 0; j < increments; j++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        elapsed += interval;
        setProgress(Math.round((elapsed / totalDuration) * 100));
      }
    }

    // Mark all done
    setSteps(prev => prev.map(s => ({ ...s, done: true, active: false })));
    setProgress(100);
    setCurrentStep(analysisSteps.length);

    // Run actual analysis
    const config: ConfigAnalise = { uf, tipoObra, padrao, areaTotal, pavimentos };
    const result = analyzeProject(config);
    setResultado(result);
    setAnalyzing(false);
  };

  const handleGerarOrcamento = () => {
    if (!resultado) return;

    const novoId = generateId();
    const capitulos = gerarCapitulosOrcamento(resultado);
    const subtotal = resultado.resumo.custoTotal;
    const bdi = 25;
    const valorBdi = subtotal * bdi / 100;
    const total = subtotal + valorBdi;

    createOrcamento({
      id: novoId,
      nome: `Orcamento - ${file?.name || 'Projeto CAD'} (${tipoObra})`,
      obraId: '',
      obraNome: '',
      clienteNome: '',
      uf,
      bdi,
      areaM2: areaTotal,
      basePadrao: 'SINAPI',
      status: 'RASCUNHO',
      capitulos,
      subtotal,
      valorBdi,
      total,
    });

    router.push(`/orcamentos/${novoId}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getExtIcon = (ext: string) => {
    switch (ext) {
      case 'dwg': return '🏗️';
      case 'dxf': return '📐';
      case 'ifc': return '🏢';
      default: return '📄';
    }
  };

  const getFonteBadge = (fonte: 'SINAPI' | 'SICRO' | 'TCPO') => {
    const colors = {
      SINAPI: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      SICRO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      TCPO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[fonte]}`}>
        {fonte}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/orcamentos"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analise de Projeto CAD
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Faca upload de um arquivo CAD para levantamento automatico de quantitativos
          </p>
        </div>
      </div>

      {/* Upload + Config Section */}
      {!resultado && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Area */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Arquivo do Projeto
            </h2>

            <div
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : file
                  ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/10'
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="text-center">
                  <div className="text-4xl mb-3">{getExtIcon(file.extension)}</div>
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} - .{file.extension.toUpperCase()}
                  </p>
                  <button
                    onClick={() => { setFile(null); setFileContent(""); setShowDwgWarning(false); }}
                    className="mt-3 text-sm text-red-500 hover:text-red-700"
                  >
                    Remover arquivo
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Arraste o arquivo aqui</span> ou
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Selecionar Arquivo
                  </button>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Formatos aceitos: .DWG, .DXF, .IFC
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".dwg,.dxf,.ifc"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {showDwgWarning && (
              <div className="mt-4 flex items-start gap-3 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Arquivo DWG detectado
                  </p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    Para melhor analise, converta o arquivo DWG para DXF usando AutoCAD ou conversor online.
                    O orcamento sera gerado com base nos dados informados manualmente.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Configuration */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Configuracao da Analise
            </h2>

            <div className="space-y-4">
              {/* UF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Estado/UF (precos regionais)
                </label>
                <select
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {UFS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Tipo de Obra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Tipo de Obra
                </label>
                <select
                  value={tipoObra}
                  onChange={(e) => setTipoObra(e.target.value as TipoObra)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Infraestrutura">Infraestrutura</option>
                </select>
              </div>

              {/* Padrao */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Sparkles className="inline h-4 w-4 mr-1" />
                  Padrao de Acabamento
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Baixo', 'Medio', 'Alto', 'Luxo'] as PadraoAcabamento[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPadrao(p)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        padrao === p
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Ruler className="inline h-4 w-4 mr-1" />
                  Area Total (m2)
                </label>
                <input
                  type="number"
                  value={areaTotal}
                  onChange={(e) => setAreaTotal(Number(e.target.value))}
                  min={10}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Pavimentos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Layers className="inline h-4 w-4 mr-1" />
                  Numero de Pavimentos
                </label>
                <input
                  type="number"
                  value={pavimentos}
                  onChange={(e) => setPavimentos(Math.max(1, Number(e.target.value)))}
                  min={1}
                  max={50}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={runAnalysis}
              disabled={!file || analyzing}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analisar Projeto
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Analysis Progress */}
      {analyzing && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Processando Analise
          </h2>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : step.active ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                )}
                <span className={`text-sm ${
                  step.done ? 'text-green-700 dark:text-green-400' :
                  step.active ? 'text-blue-700 dark:text-blue-400 font-medium' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {resultado && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Ruler className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Area Construida</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{resultado.resumo.areaConstruida.toLocaleString('pt-BR')} m2</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Custo Estimado/m2</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(resultado.resumo.custoEstimadoM2)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Custo Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(resultado.resumo.custoTotal)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
                  <Layers className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pavimentos</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{resultado.resumo.pavimentos}</p>
                  <p className="text-xs text-gray-500">{resultado.resumo.tipoEstrutura}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quantitativos Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quantitativos Extraidos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Elementos construtivos identificados no projeto
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descricao</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Quantidade</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Unidade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {resultado.elementos.map((elem, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {elem.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{elem.descricao}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {elem.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{elem.unidade}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={elem.detalhes}>
                        {elem.detalhes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Orcamento Sugerido */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Orcamento Sugerido
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Itens vinculados as tabelas SINAPI/SICRO/TCPO para {uf}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Capitulo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Codigo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fonte</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Descricao</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Qtd</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Un</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">P. Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {resultado.orcamentoSugerido.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{item.capitulo}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{item.codigoReferencia}</td>
                      <td className="px-4 py-3">{getFonteBadge(item.fonte)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[250px] truncate" title={item.descricao}>
                        {item.descricao}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {item.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400">{item.unidade}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatCurrency(item.precoUnitario)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.precoTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                      Total (sem BDI):
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(resultado.resumo.custoTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <button
              onClick={() => { setResultado(null); setSteps([]); setProgress(0); }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Nova Analise
            </button>
            <button
              onClick={handleGerarOrcamento}
              className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Gerar Orcamento a partir da Analise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}