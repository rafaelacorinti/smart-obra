"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Plus, Sun, Cloud, CloudRain, CloudSun, ChevronDown, ChevronUp, Image, Video, X, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useObras } from "@/hooks/use-storage-data";
import { generateId } from "@/lib/storage";

interface RegistroDiario {
  id: string;
  obraId: string;
  data: string;
  equipePresenteNumero: number;
  equipeNomes: string;
  atividadesExecutadas: string;
  ocorrencias: string;
  clima: "ENSOLARADO" | "NUBLADO" | "CHUVOSO" | "PARCIALMENTE_NUBLADO";
  fotos: string[];
  videos: string[];
  criadoEm: string;
}

const STORAGE_KEY = "smart-obra-diario";

function getDiarioStorage(): RegistroDiario[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function setDiarioStorage(registros: RegistroDiario[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

function getClimaIcon(clima: string) {
  switch (clima) {
    case "ENSOLARADO": return <Sun className="h-5 w-5 text-yellow-500" />;
    case "NUBLADO": return <Cloud className="h-5 w-5 text-gray-500" />;
    case "CHUVOSO": return <CloudRain className="h-5 w-5 text-blue-500" />;
    case "PARCIALMENTE_NUBLADO": return <CloudSun className="h-5 w-5 text-orange-400" />;
    default: return <Sun className="h-5 w-5 text-yellow-500" />;
  }
}

function getClimaLabel(clima: string) {
  const map: Record<string, string> = {
    ENSOLARADO: "Ensolarado",
    NUBLADO: "Nublado",
    CHUVOSO: "Chuvoso",
    PARCIALMENTE_NUBLADO: "Parcialmente Nublado",
  };
  return map[clima] || clima;
}

export default function DiarioObraPage() {
  const { obras, loading: obrasLoading } = useObras();
  const [selectedObraId, setSelectedObraId] = useState<string>("");
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterData, setFilterData] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<RegistroDiario, "id" | "criadoEm">>({
    obraId: "",
    data: new Date().toISOString().split("T")[0],
    equipePresenteNumero: 0,
    equipeNomes: "",
    atividadesExecutadas: "",
    ocorrencias: "",
    clima: "ENSOLARADO",
    fotos: [],
    videos: [],
  });

  useEffect(() => {
    if (obras.length > 0 && !selectedObraId) setSelectedObraId(obras[0].id);
  }, [obras, selectedObraId]);

  useEffect(() => {
    if (selectedObraId) {
      const all = getDiarioStorage();
      setRegistros(all.filter((r) => r.obraId === selectedObraId).sort((a, b) => b.data.localeCompare(a.data)));
    }
  }, [selectedObraId]);

  function refresh() {
    const all = getDiarioStorage();
    setRegistros(all.filter((r) => r.obraId === selectedObraId).sort((a, b) => b.data.localeCompare(a.data)));
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const maxPhotos = 3;
    const currentPhotos = formData.fotos.length;
    const remaining = maxPhotos - currentPhotos;
    if (remaining <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remaining);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData((prev) => ({ ...prev, fotos: [...prev.fotos, result] }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemovePhoto(index: number) {
    setFormData((prev) => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }));
  }

  function handleAddVideo() {
    const url = prompt("Cole o link do video (YouTube ou Google Drive):");
    if (url && (url.includes("youtube") || url.includes("youtu.be") || url.includes("drive.google"))) {
      setFormData((prev) => ({ ...prev, videos: [...prev.videos, url] }));
    }
  }

  function handleSubmit() {
    if (!formData.atividadesExecutadas.trim()) return;
    const newRegistro: RegistroDiario = {
      ...formData,
      id: generateId(),
      obraId: selectedObraId,
      criadoEm: new Date().toISOString(),
    };
    const all = getDiarioStorage();
    all.push(newRegistro);
    setDiarioStorage(all);
    refresh();
    setShowForm(false);
    setFormData({
      obraId: selectedObraId,
      data: new Date().toISOString().split("T")[0],
      equipePresenteNumero: 0,
      equipeNomes: "",
      atividadesExecutadas: "",
      ocorrencias: "",
      clima: "ENSOLARADO",
      fotos: [],
      videos: [],
    });
  }

  const filteredRegistros = filterData
    ? registros.filter((r) => r.data === filterData)
    : registros;

  if (obrasLoading) {
    return <div className="space-y-4"><div className="h-8 w-64 bg-muted animate-pulse rounded" /><div className="h-64 bg-muted animate-pulse rounded" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Diario de Obra"
        breadcrumbs={[{ label: "Diario de Obra" }]}
        actions={
          <button onClick={() => { setShowForm(true); setFormData((prev) => ({ ...prev, obraId: selectedObraId })); }} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Novo Registro
          </button>
        }
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <select value={selectedObraId} onChange={(e) => setSelectedObraId(e.target.value)} className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Selecione uma obra</option>
          {obras.map((obra) => (<option key={obra.id} value={obra.id}>{obra.nome}</option>))}
        </select>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Filtrar por data" />
          {filterData && <button onClick={() => setFilterData("")} className="text-xs text-muted-foreground hover:text-foreground">Limpar</button>}
        </div>
      </div>

      {/* New record form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-2xl bg-background border border-border rounded-lg shadow-xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5" /> Novo Registro de Diario</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Data</label>
                  <input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Clima</label>
                  <select value={formData.clima} onChange={(e) => setFormData({ ...formData, clima: e.target.value as RegistroDiario["clima"] })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="ENSOLARADO">Ensolarado</option>
                    <option value="NUBLADO">Nublado</option>
                    <option value="CHUVOSO">Chuvoso</option>
                    <option value="PARCIALMENTE_NUBLADO">Parcialmente Nublado</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Equipe Presente (numero)</label>
                  <input type="number" min={0} value={formData.equipePresenteNumero} onChange={(e) => setFormData({ ...formData, equipePresenteNumero: Number(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Nomes da Equipe (opcional)</label>
                <textarea value={formData.equipeNomes} onChange={(e) => setFormData({ ...formData, equipeNomes: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" placeholder="Nomes separados por virgula..." />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Atividades Executadas *</label>
                <textarea value={formData.atividadesExecutadas} onChange={(e) => setFormData({ ...formData, atividadesExecutadas: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]" placeholder="Descreva as atividades realizadas..." />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Ocorrencias (opcional)</label>
                <textarea value={formData.ocorrencias} onChange={(e) => setFormData({ ...formData, ocorrencias: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" placeholder="Problemas, eventos especiais..." />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Fotos (max. 3)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.fotos.map((foto, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
                      <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => handleRemovePhoto(idx)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
                {formData.fotos.length < 3 && (
                  <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-2 text-xs text-muted-foreground hover:border-foreground hover:text-foreground">
                    <Image className="h-4 w-4" /> Adicionar Foto
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Videos (links YouTube/Drive)</label>
                <div className="space-y-1 mb-2">
                  {formData.videos.map((video, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Video className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate flex-1">{video}</span>
                      <button onClick={() => setFormData((prev) => ({ ...prev, videos: prev.videos.filter((_, i) => i !== idx) }))} className="text-red-500 hover:text-red-700"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddVideo} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input px-3 py-2 text-xs text-muted-foreground hover:border-foreground hover:text-foreground">
                  <Video className="h-4 w-4" /> Adicionar Link de Video
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm font-medium border border-input hover:bg-muted">Cancelar</button>
              <button onClick={handleSubmit} disabled={!formData.atividadesExecutadas.trim()} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Salvar Registro</button>
            </div>
          </div>
        </div>
      )}

      {/* Records list */}
      {selectedObraId && (
        <div className="space-y-3">
          {filteredRegistros.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum registro encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em &quot;Novo Registro&quot; para adicionar</p>
            </div>
          )}
          {filteredRegistros.map((registro) => {
            const isExpanded = expandedId === registro.id;
            return (
              <div key={registro.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : registro.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {getClimaIcon(registro.clima)}
                    <div>
                      <p className="text-sm font-medium">{registro.data}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">{registro.atividadesExecutadas.substring(0, 80)}{registro.atividadesExecutadas.length > 80 ? "..." : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{registro.equipePresenteNumero} pessoas</span>
                    {registro.fotos.length > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><Image className="h-3 w-3" />{registro.fotos.length}</span>}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div><p className="text-xs text-muted-foreground">Clima</p><p className="text-sm flex items-center gap-1.5">{getClimaIcon(registro.clima)} {getClimaLabel(registro.clima)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Equipe Presente</p><p className="text-sm">{registro.equipePresenteNumero} pessoas</p></div>
                      <div><p className="text-xs text-muted-foreground">Data</p><p className="text-sm">{registro.data}</p></div>
                    </div>
                    {registro.equipeNomes && <div><p className="text-xs text-muted-foreground">Nomes da Equipe</p><p className="text-sm">{registro.equipeNomes}</p></div>}
                    <div><p className="text-xs text-muted-foreground">Atividades Executadas</p><p className="text-sm whitespace-pre-wrap">{registro.atividadesExecutadas}</p></div>
                    {registro.ocorrencias && <div><p className="text-xs text-muted-foreground">Ocorrencias</p><p className="text-sm whitespace-pre-wrap text-orange-600 dark:text-orange-400">{registro.ocorrencias}</p></div>}
                    {registro.fotos.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Fotos</p>
                        <div className="flex flex-wrap gap-2">
                          {registro.fotos.map((foto, idx) => (
                            <div key={idx} className="w-24 h-24 rounded-md overflow-hidden border border-border">
                              <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {registro.videos.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Videos</p>
                        <div className="space-y-1">
                          {registro.videos.map((video, idx) => (
                            <a key={idx} href={video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                              <Video className="h-3 w-3" /> {video}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}