"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Upload, X, ChevronLeft, ChevronRight, Camera, Calendar, Smartphone, Columns2 } from "lucide-react";
import { useObras } from "@/hooks/use-storage-data";
import { generateId } from "@/lib/storage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FotoGaleria {
  id: string;
  obraId: string;
  data: string;
  descricao: string;
  etapa: string;
  base64: string;
  criadoEm: string;
}

const STORAGE_KEY = "smart-obra-galeria";
const ETAPAS = ["Fundacao","Estrutura","Alvenaria","Cobertura","Instalacoes Eletricas","Instalacoes Hidraulicas","Revestimento","Pintura","Acabamento","Paisagismo","Limpeza Final"];

function getFotos(): FotoGaleria[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveFotos(fotos: FotoGaleria[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fotos));
}

export default function GaleriaPage() {
  const { obras } = useObras();
  const [fotos, setFotos] = useState<FotoGaleria[]>([]);
  const [obraSelecionada, setObraSelecionada] = useState<string>("todas");
  const [filtroMes, setFiltroMes] = useState<string>("todos");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todas");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [comparacaoMode, setComparacaoMode] = useState(false);
  const [fotosComparacao, setFotosComparacao] = useState<string[]>([]);
  const [showComparacao, setShowComparacao] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<string[]>([]);
  const [uploadDescricao, setUploadDescricao] = useState("");
  const [uploadEtapa, setUploadEtapa] = useState("");
  const [uploadData, setUploadData] = useState(new Date().toISOString().split("T")[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setFotos(getFotos()); }, []);

  const fotosFiltradas = fotos
    .filter((f) => obraSelecionada === "todas" || f.obraId === obraSelecionada)
    .filter((f) => filtroMes === "todos" || f.data.substring(0, 7) === filtroMes)
    .filter((f) => filtroEtapa === "todas" || f.etapa === filtroEtapa)
    .sort((a, b) => b.data.localeCompare(a.data));

  const mesesDisponiveis = Array.from(new Set(fotos.map((f) => f.data.substring(0, 7)))).sort().reverse();
  const contadorPorPeriodo = mesesDisponiveis.map((mes) => ({
    mes,
    count: fotos.filter((f) => f.data.substring(0, 7) === mes && (obraSelecionada === "todas" || f.obraId === obraSelecionada)).length,
  }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selectedFiles = Array.from(files).slice(0, 5);
    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => { setUploadFiles((prev) => prev.length >= 5 ? prev : [...prev, reader.result as string]); };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = () => {
    if (uploadFiles.length === 0 || obraSelecionada === "todas" || !uploadEtapa) return;
    const novasFotos: FotoGaleria[] = uploadFiles.map((base64) => ({
      id: generateId(), obraId: obraSelecionada, data: uploadData, descricao: uploadDescricao, etapa: uploadEtapa, base64, criadoEm: new Date().toISOString(),
    }));
    const updated = [...fotos, ...novasFotos];
    saveFotos(updated);
    setFotos(updated);
    setUploadFiles([]);
    setUploadDescricao("");
    setUploadEtapa("");
    setUploadOpen(false);
  };

  const toggleComparacao = (fotoId: string) => {
    setFotosComparacao((prev) => {
      if (prev.includes(fotoId)) return prev.filter((id) => id !== fotoId);
      if (prev.length >= 2) return [prev[1], fotoId];
      return [...prev, fotoId];
    });
  };

  const deleteFoto = (id: string) => {
    const updated = fotos.filter((f) => f.id !== id);
    saveFotos(updated);
    setFotos(updated);
    setFotosComparacao((prev) => prev.filter((fid) => fid !== id));
  };

  const obraNome = (obraId: string) => obras.find((o) => o.id === obraId)?.nome || "Obra";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Galeria de Fotos</h1>
          <p className="text-muted-foreground">Registro fotografico das obras</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1"><Smartphone className="h-3 w-3" />Upload pelo celular</Badge>
          <Button variant={comparacaoMode ? "default" : "outline"} size="sm" onClick={() => { setComparacaoMode(!comparacaoMode); if (comparacaoMode) setFotosComparacao([]); }}>
            <Columns2 className="mr-2 h-4 w-4" />Antes e Depois
          </Button>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button disabled={obraSelecionada === "todas"}><Upload className="mr-2 h-4 w-4" />Upload</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Upload de Fotos</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Fotos (max 5 por vez)</Label>
                  <Input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="mt-1" />
                  {uploadFiles.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {uploadFiles.map((f, i) => (
                        <div key={i} className="relative h-16 w-16">
                          <img src={f} alt="" className="h-full w-full rounded object-cover" />
                          <button onClick={() => setUploadFiles((prev) => prev.filter((_, idx) => idx !== i))} className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div><Label>Data</Label><Input type="date" value={uploadData} onChange={(e) => setUploadData(e.target.value)} className="mt-1" /></div>
                <div>
                  <Label>Etapa da Obra</Label>
                  <Select value={uploadEtapa} onValueChange={setUploadEtapa}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                    <SelectContent>{ETAPAS.map((etapa) => (<SelectItem key={etapa} value={etapa}>{etapa}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Descricao (opcional)</Label><Textarea value={uploadDescricao} onChange={(e) => setUploadDescricao(e.target.value)} placeholder="Descreva a foto..." className="mt-1" /></div>
                <Button onClick={handleUpload} className="w-full" disabled={uploadFiles.length === 0 || !uploadEtapa}><Camera className="mr-2 h-4 w-4" />Enviar {uploadFiles.length} foto(s)</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card><CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label className="text-xs text-muted-foreground">Obra</Label>
            <Select value={obraSelecionada} onValueChange={setObraSelecionada}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as obras</SelectItem>
                {obras.map((obra) => (<SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Mes</Label>
            <Select value={filtroMes} onValueChange={setFiltroMes}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os meses</SelectItem>
                {mesesDisponiveis.map((mes) => (<SelectItem key={mes} value={mes}>{format(new Date(mes + "-01"), "MMMM yyyy", { locale: ptBR })}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Etapa</Label>
            <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as etapas</SelectItem>
                {ETAPAS.map((etapa) => (<SelectItem key={etapa} value={etapa}>{etapa}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end"><div className="rounded-lg bg-muted px-3 py-2 text-sm"><span className="font-semibold">{fotosFiltradas.length}</span> foto(s)</div></div>
        </div>
      </CardContent></Card>

      {contadorPorPeriodo.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contadorPorPeriodo.slice(0, 6).map(({ mes, count }) => (
            <Badge key={mes} variant="secondary" className="gap-1"><Calendar className="h-3 w-3" />{format(new Date(mes + "-01"), "MMM/yy", { locale: ptBR })}: {count}</Badge>
          ))}
        </div>
      )}

      {comparacaoMode && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"><CardContent className="py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700 dark:text-blue-300">Selecione 2 fotos para comparacao Antes e Depois ({fotosComparacao.length}/2 selecionadas)</p>
            {fotosComparacao.length === 2 && (<Button size="sm" onClick={() => setShowComparacao(true)}>Ver Comparacao</Button>)}
          </div>
        </CardContent></Card>
      )}

      {fotosFiltradas.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Nenhuma foto encontrada</p>
          <p className="text-sm text-muted-foreground">{obraSelecionada === "todas" ? "Selecione uma obra e faca upload de fotos" : "Faca upload de fotos para esta obra"}</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {fotosFiltradas.map((foto, index) => (
            <div key={foto.id} className={`group relative cursor-pointer overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md ${comparacaoMode && fotosComparacao.includes(foto.id) ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
              onClick={() => { if (comparacaoMode) { toggleComparacao(foto.id); } else { setLightboxIndex(index); } }}>
              <div className="aspect-square"><img src={foto.base64} alt={foto.descricao || "Foto da obra"} className="h-full w-full object-cover" /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs font-medium truncate">{foto.etapa}</p>
                <p className="text-[10px] opacity-80">{format(new Date(foto.data), "dd/MM/yyyy")}</p>
              </div>
              {comparacaoMode && fotosComparacao.includes(foto.id) && (<div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">{fotosComparacao.indexOf(foto.id) + 1}</div>)}
              {!comparacaoMode && (<button onClick={(e) => { e.stopPropagation(); deleteFoto(foto.id); }} className="absolute right-1 top-1 rounded-full bg-red-500/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"><X className="h-3 w-3" /></button>)}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightboxIndex(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setLightboxIndex(null)}><X className="h-6 w-6" /></button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : fotosFiltradas.length - 1)); }}><ChevronLeft className="h-6 w-6" /></button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev! < fotosFiltradas.length - 1 ? prev! + 1 : 0)); }}><ChevronRight className="h-6 w-6" /></button>
          <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img src={fotosFiltradas[lightboxIndex].base64} alt={fotosFiltradas[lightboxIndex].descricao || "Foto"} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
            <div className="mt-3 text-center text-white">
              <p className="font-medium">{fotosFiltradas[lightboxIndex].etapa}</p>
              {fotosFiltradas[lightboxIndex].descricao && <p className="text-sm opacity-80">{fotosFiltradas[lightboxIndex].descricao}</p>}
              <p className="text-xs opacity-60">{format(new Date(fotosFiltradas[lightboxIndex].data), "dd/MM/yyyy")} | {obraNome(fotosFiltradas[lightboxIndex].obraId)}</p>
              <p className="mt-1 text-xs opacity-40">{lightboxIndex + 1} / {fotosFiltradas.length}</p>
            </div>
          </div>
        </div>
      )}

      {showComparacao && fotosComparacao.length === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowComparacao(false)}>
          <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Antes e Depois</h2>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setShowComparacao(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {fotosComparacao.map((fotoId, i) => {
                const foto = fotos.find((f) => f.id === fotoId);
                if (!foto) return null;
                return (
                  <div key={fotoId} className="space-y-2">
                    <Badge variant="secondary" className="text-sm">{i === 0 ? "ANTES" : "DEPOIS"}</Badge>
                    <img src={foto.base64} alt={foto.descricao || "Comparacao"} className="w-full rounded-lg object-contain max-h-[60vh]" />
                    <div className="text-sm text-white/80">
                      <p>{foto.etapa} - {format(new Date(foto.data), "dd/MM/yyyy")}</p>
                      {foto.descricao && <p className="text-xs opacity-60">{foto.descricao}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}