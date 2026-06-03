"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Trash2,
  Download,
  Search,
  Filter,
  X,
  Eye,
  FolderOpen,
} from "lucide-react";
import { useObras } from "@/hooks/use-storage-data";
import { generateId } from "@/lib/storage";

interface Documento {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  categoria: string;
  descricao: string;
  obraId: string;
  obraNome: string;
  dataUpload: string;
  base64: string;
}

const CATEGORIAS = [
  "Projeto",
  "Contrato",
  "Nota Fiscal",
  "ART",
  "Alvara",
  "Planta",
  "Outro",
];

const STORAGE_KEY = "smart-obra-documents";

function getDocumentos(): Documento[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function salvarDocumentos(docs: Documento[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(tipo: string) {
  const t = tipo.toLowerCase();
  if (t.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
  if (t.includes("spreadsheet") || t.includes("excel") || t.includes("xlsx") || t.includes("xls") || t.includes("csv")) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
  if (t.includes("word") || t.includes("doc")) return <FileText className="h-8 w-8 text-blue-600" />;
  if (t.includes("image") || t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("gif") || t.includes("webp")) return <FileImage className="h-8 w-8 text-purple-500" />;
  if (t.includes("dwg") || t.includes("dxf") || t.includes("cad")) return <File className="h-8 w-8 text-amber-600" />;
  return <File className="h-8 w-8 text-gray-500" />;
}

function getFileIconSmall(tipo: string) {
  const t = tipo.toLowerCase();
  if (t.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  if (t.includes("spreadsheet") || t.includes("excel") || t.includes("xlsx") || t.includes("xls") || t.includes("csv")) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  if (t.includes("word") || t.includes("doc")) return <FileText className="h-5 w-5 text-blue-600" />;
  if (t.includes("image") || t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("gif") || t.includes("webp")) return <FileImage className="h-5 w-5 text-purple-500" />;
  if (t.includes("dwg") || t.includes("dxf") || t.includes("cad")) return <File className="h-5 w-5 text-amber-600" />;
  return <File className="h-5 w-5 text-gray-500" />;
}

export default function DocumentosPage() {
  const { obras } = useObras();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroObra, setFiltroObra] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoPreview, setArquivoPreview] = useState<string | null>(null);
  const [categoria, setCategoria] = useState("Projeto");
  const [descricao, setDescricao] = useState("");
  const [obraVinculada, setObraVinculada] = useState("");

  useEffect(() => {
    setDocumentos(getDocumentos());
  }, []);

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const matchBusca = !busca || doc.nome.toLowerCase().includes(busca.toLowerCase()) || doc.descricao.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = !filtroCategoria || doc.categoria === filtroCategoria;
      const matchObra = !filtroObra || doc.obraId === filtroObra;
      return matchBusca && matchCategoria && matchObra;
    });
  }, [documentos, busca, filtroCategoria, filtroObra]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivo(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setArquivoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setArquivoPreview(null);
    }
  };

  const handleUpload = () => {
    if (!arquivo) {
      alert("Selecione um arquivo para enviar.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const obraSelecionada = obras.find((o: any) => o.id === obraVinculada);
      const novoDoc: Documento = {
        id: generateId(),
        nome: arquivo.name,
        tipo: arquivo.type || getExtensionType(arquivo.name),
        tamanho: arquivo.size,
        categoria,
        descricao,
        obraId: obraVinculada,
        obraNome: obraSelecionada?.nome || "",
        dataUpload: new Date().toISOString(),
        base64,
      };

      const novosDocumentos = [...documentos, novoDoc];
      setDocumentos(novosDocumentos);
      salvarDocumentos(novosDocumentos);

      // Reset form
      setArquivo(null);
      setArquivoPreview(null);
      setCategoria("Projeto");
      setDescricao("");
      setObraVinculada("");
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(arquivo);
  };

  const handleDownload = (doc: Documento) => {
    const link = document.createElement("a");
    link.href = doc.base64;
    link.download = doc.nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcluir = (docId: string) => {
    if (!confirm("Deseja realmente excluir este documento?")) return;
    const novosDocumentos = documentos.filter((d) => d.id !== docId);
    setDocumentos(novosDocumentos);
    salvarDocumentos(novosDocumentos);
  };

  const handlePreview = (doc: Documento) => {
    if (doc.tipo.startsWith("image/")) {
      setPreviewUrl(doc.base64);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie todos os documentos das suas obras
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Enviar Documento
        </button>
      </div>
      {/* Upload Panel */}
      {showUpload && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
          <h2 className="mb-4 text-sm font-semibold text-blue-900 dark:text-blue-200">
            Upload de Documento
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* File input */}
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Arquivo
              </label>
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-950/20">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {arquivo ? arquivo.name : "Clique para selecionar arquivo"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                </label>
                {arquivo && (
                  <div className="text-xs text-gray-500">
                    <p>{formatFileSize(arquivo.size)}</p>
                    <p>{arquivo.type || "Tipo desconhecido"}</p>
                  </div>
                )}
              </div>
              {arquivoPreview && (
                <div className="mt-3">
                  <img
                    src={arquivoPreview}
                    alt="Preview"
                    className="h-32 w-auto rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            {/* Categoria */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Obra vinculada */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Obra Vinculada
              </label>
              <select
                value={obraVinculada}
                onChange={(e) => setObraVinculada(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Nenhuma (geral)</option>
                {obras.map((o: any) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>

            {/* Descricao */}
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Descricao (opcional)
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Breve descricao do documento..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleUpload}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" /> Enviar
            </button>
            <button
              onClick={() => { setShowUpload(false); setArquivo(null); setArquivoPreview(null); }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todas categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filtroObra}
          onChange={(e) => setFiltroObra(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Todas obras</option>
          {obras.map((o: any) => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      </div>
      {/* Document list */}
      {documentosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-600">
          <FolderOpen className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {documentos.length === 0 ? "Nenhum documento enviado ainda." : "Nenhum documento encontrado com os filtros selecionados."}
          </p>
          {documentos.length === 0 && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Upload className="h-4 w-4" /> Enviar primeiro documento
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Documento</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Categoria</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Obra</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Tamanho</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Data</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {documentosFiltrados.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getFileIconSmall(doc.tipo || doc.nome)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{doc.nome}</p>
                        {doc.descricao && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{doc.descricao}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {doc.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{doc.obraNome || "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 text-xs">{formatFileSize(doc.tamanho)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                    {new Date(doc.dataUpload).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {(doc.tipo || "").startsWith("image/") && (
                        <button onClick={() => handlePreview(doc)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-purple-600 dark:hover:bg-gray-700" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleDownload(doc)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700" title="Download">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleExcluir(doc.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button onClick={() => setPreviewUrl(null)} className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 shadow-lg hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
              <X className="h-4 w-4" />
            </button>
            <img src={previewUrl} alt="Preview" className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function getExtensionType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const typeMap: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dwg: "application/dwg",
    dxf: "application/dxf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return typeMap[ext] || "application/octet-stream";
}