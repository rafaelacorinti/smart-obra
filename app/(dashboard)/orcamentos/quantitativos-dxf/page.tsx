"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload, ArrowLeft, Loader2, FileCode2, Ruler, Layers,
  CheckCircle2, AlertTriangle, FileSpreadsheet, Settings2,
  ChevronDown, ChevronUp, Building2, Droplets, Columns3, DoorOpen
} from "lucide-react";
import {
  extrairQuantitativos,
  LAYER_MAP_DEFAULT,
  ResultadoQuantitativos,
} from "@/lib/dxf-quantitativos";
import { converterQuantitativosParaOrcamento } from "@/lib/quantitativos-to-orcamento";
import { useOrcamentos } from "@/hooks/use-storage-data";
import { ModuleGuard } from "@/components/module-guard";
import { generateId } from "@/lib/storage";

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

interface UploadedFile {
  name: string;
  size: number;
}

export default function QuantitativosDxfPage() {
  const router = useRouter();
  const { createOrcamento } = useOrcamentos();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  // Config state
  const [peDireito, setPeDireito] = useState<number>(2.80);
  const [uf, setUf] = useState("SP");
  const [showLayerConfig, setShowLayerConfig] = useState(false);
  const [layerMap, setLayerMap] = useState<Record<string, string[]>>(() => {
    const copy: Record<string, string[]> = {};
    Object.entries(LAYER_MAP_DEFAULT).forEach(([k, v]) => {
      copy[k] = [...v];
    });
    return copy;
  });

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [resultado, setResultado] = useState<ResultadoQuantitativos | null>(null);
  const [error, setError] = useState<string>("");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (ext !== "dxf") {
      setError("Formato nao suportado. Apenas arquivos .DXF sao aceitos nesta ferramenta.");
      return;
    }
    setError("");
    setFile({ name: f.name, size: f.size });
    setResultado(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent((e.target?.result as string) || "");
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const runExtraction = async () => {
    if (!fileContent) return;
    setAnalyzing(true);
    setError("");
    setResultado(null);

    // Small delay para UI atualizar
    await new Promise((r) => setTimeout(r, 100));

    try {
      const res = extrairQuantitativos(fileContent, peDireito, layerMap);
      setResultado(res);
    } catch (err: any) {
      setError("Erro ao processar o arquivo DXF: " + (err?.message || "Erro desconhecido"));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImportarOrcamento = () => {
    if (!resultado) return;

    const novoId = generateId();
    const { capitulos, subtotal } = converterQuantitativosParaOrcamento(
      resultado,
      uf,
      file?.name || "Projeto DXF"
    );
    const bdi = 25;
    const valorBdi = subtotal * bdi / 100;
    const total = subtotal + valorBdi;

    createOrcamento({
      id: novoId,
      nome: "Quantitativos DXF - " + (file?.name || "Projeto"),
      obraId: "",
      obraNome: "",
      clienteNome: "",
      uf,
      bdi,
      areaM2: resultado.resumo.areaPiso || 0,
      basePadrao: "SINAPI",
      status: "RASCUNHO",
      capitulos,
      subtotal,
      valorBdi,
      total,
    });

    router.push("/orcamentos/" + novoId);
  };

  const handleLayerChange = (categoria: string, value: string) => {
    setLayerMap((prev) => ({
      ...prev,
      [categoria]: value.split(",").map((s) => s.trim()).filter(Boolean),
    }));
  };

  const categoriaLabels: Record<string, string> = {
    PAREDES: "Paredes / Alvenaria",
    PORTAS: "Portas",
    JANELAS: "Janelas",
    AREA_PISO: "Areas de Piso",
    HIDROSSANITARIO: "Hidrossanitario",
    ESTRUTURA: "Estrutura / Pilares",
    HACHURA_IGNORAR: "Hachura (ignorar)",
  };

  const categoriaIcons: Record<string, React.ReactNode> = {
    Alvenaria: <Building2 className="h-4 w-4" />,
    Esquadrias: <DoorOpen className="h-4 w-4" />,
    Pisos: <Layers className="h-4 w-4" />,
    Hidrossanitario: <Droplets className="h-4 w-4" />,
    Estrutura: <Columns3 className="h-4 w-4" />,
  };

  const categoriaCores: Record<string, string> = {
    Alvenaria: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Esquadrias: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Pisos: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Hidrossanitario: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    Estrutura: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <ModuleGuard moduleId="orcamentos" moduleName="Orcamentos">
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
            Quantitativos DXF
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Levantamento automatico de quantitativos a partir de arquivo DXF por camadas (layers)
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Upload + Config */}
      {!resultado && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Arquivo DXF
            </h2>
            <div
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : file
                  ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/10"
                  : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
            >
              {file ? (
                <div className="text-center">
                  <FileCode2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                  <button
                    onClick={() => { setFile(null); setFileContent(""); }}
                    className="mt-3 text-sm text-red-500 hover:text-red-700"
                  >
                    Remover arquivo
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Arraste o arquivo DXF aqui</span> ou
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Selecionar Arquivo
                  </button>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Formato aceito: .DXF
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".dxf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </div>

          {/* Config */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Configuracao
            </h2>
            <div className="space-y-4">
              {/* Pe-direito */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Ruler className="inline h-4 w-4 mr-1" />
                  Pe-direito (m)
                </label>
                <input
                  type="number"
                  value={peDireito}
                  onChange={(e) => setPeDireito(parseFloat(e.target.value) || 2.80)}
                  step={0.05}
                  min={2.0}
                  max={6.0}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">Utilizado para calcular area bruta de alvenaria (comprimento x pe-direito)</p>
              </div>

              {/* UF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado/UF (precos regionais)
                </label>
                <select
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {UFS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Layer Config Toggle */}
              <div>
                <button
                  onClick={() => setShowLayerConfig(!showLayerConfig)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Mapeamento de Layers (avancado)
                  </span>
                  {showLayerConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showLayerConfig && (
                  <div className="mt-3 space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Edite os nomes de camadas aceitos por categoria (separados por virgula). Use ____ como coringa para prefixos.
                    </p>
                    {Object.entries(layerMap).map(([cat, layers]) => (
                      <div key={cat}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {categoriaLabels[cat] || cat}
                        </label>
                        <input
                          type="text"
                          value={layers.join(", ")}
                          onChange={(e) => handleLayerChange(cat, e.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Extract Button */}
            <button
              onClick={runExtraction}
              disabled={!file || !fileContent || analyzing}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extraindo quantitativos...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FileCode2 className="h-4 w-4" />
                  Extrair Quantitativos
                </span>
              )}
            </button>
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
                <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
                  <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Paredes</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {resultado.resumo.comprimentoParedes.toLocaleString("pt-BR")} m
                  </p>
                  <p className="text-xs text-gray-500">
                    Area: {resultado.resumo.areaParedes.toLocaleString("pt-BR")} m2
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <DoorOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Esquadrias</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {resultado.resumo.totalPortas} portas / {resultado.resumo.totalJanelas} janelas
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <Layers className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Area de Piso</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {resultado.resumo.areaPiso.toLocaleString("pt-BR")} m2
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                  <Columns3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estrutura / Hidro</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {resultado.resumo.totalPilares} pilares / {resultado.resumo.totalLoucas} loucas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pe-direito highlight */}
          <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-3 dark:bg-indigo-900/20">
            <Ruler className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm text-indigo-800 dark:text-indigo-300">
              Pe-direito utilizado: <strong>{resultado.peDireito.toFixed(2)}m</strong> (area bruta de alvenaria = comprimento linear x pe-direito)
            </p>
          </div>

          {/* Layers encontrados */}
          {resultado.layersEncontrados.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Layers encontrados no arquivo ({resultado.layersEncontrados.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {resultado.layersEncontrados.map((layer) => {
                  const mapeado = resultado.layersMapeados[layer];
                  return (
                    <span
                      key={layer}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        mapeado
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                      title={mapeado ? "Mapeado para: " + mapeado : "Nao mapeado"}
                    >
                      {layer}
                      {mapeado && <CheckCircle2 className="ml-1 h-3 w-3" />}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabela de Quantitativos */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tabela de Quantitativos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {resultado.itens.length} itens extraidos do arquivo DXF
              </p>
            </div>

            {resultado.itens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nenhum quantitativo encontrado
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center max-w-md">
                  Verifique se os nomes das camadas (layers) do seu arquivo DXF correspondem aos mapeamentos configurados. Use o painel de configuracao avancada para ajustar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Item
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Quantidade
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Unidade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Observacao
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {resultado.itens.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              categoriaCores[item.categoria] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {categoriaIcons[item.categoria]}
                            {item.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.item}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {item.quantidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                          {item.unidade}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[250px] truncate" title={item.observacao}>
                          {item.observacao}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <button
              onClick={() => {
                setResultado(null);
                setFile(null);
                setFileContent("");
                setError("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Nova Analise
            </button>
            {resultado.itens.length > 0 && (
              <button
                onClick={handleImportarOrcamento}
                className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Importar para Orcamento
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </ModuleGuard>
  );
}