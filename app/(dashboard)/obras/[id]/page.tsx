"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, MapPin, Calendar, DollarSign, Users,
  Camera, FileText, Clock, Package, Plus, Upload, Sun, Cloud, CloudRain, CloudLightning,
  Milestone, Activity, StickyNote, Trash2, User, Download, Eye, X, Image as ImageIcon
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  useObras, useLancamentos, useDiarioObra, useFotosObra,
  useDocumentosObra, useTimelineObra, useColaboradoresObra, useMateriaisObra,
  useClientes
} from "@/hooks/use-storage-data";
import { formatCurrency } from "@/lib/utils";
import { Obra } from "@/lib/mock-data";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string }> = {
  PLANEJAMENTO: { label: "Planejamento", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  EM_ANDAMENTO: { label: "Em Andamento", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PAUSADA: { label: "Pausada", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CONCLUIDA: { label: "Concluida", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const climaIcons: Record<string, any> = {
  ENSOLARADO: Sun,
  NUBLADO: Cloud,
  CHUVOSO: CloudRain,
  TEMPESTADE: CloudLightning,
};

const climaLabels: Record<string, string> = {
  ENSOLARADO: "Ensolarado",
  NUBLADO: "Nublado",
  CHUVOSO: "Chuvoso",
  TEMPESTADE: "Tempestade",
};

export default function ObraDetailPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = params.id as string;

  const { obras, loading: loadingObra, deleteObraCascade } = useObras();
  const { lancamentos, createLancamento } = useLancamentos(obraId);
  const { entradas, addEntrada } = useDiarioObra(obraId);
  const { fotos, addFoto } = useFotosObra(obraId);
  const { documentos, addDocumento } = useDocumentosObra(obraId);
  const { eventos: timelineEventos, addEvento } = useTimelineObra(obraId);
  const { colaboradores, addColaborador, removeColaborador } = useColaboradoresObra(obraId);
  const { materiais, addMaterial } = useMateriaisObra(obraId);

  const { clientes } = useClientes();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [showDiarioForm, setShowDiarioForm] = useState(false);
  const [showFotoForm, setShowFotoForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [showColabForm, setShowColabForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showLancamentoForm, setShowLancamentoForm] = useState(false);
  const [lightboxFoto, setLightboxFoto] = useState<string | null>(null);

  // Form states
  const [diarioForm, setDiarioForm] = useState({ data: new Date().toISOString().split("T")[0], clima: "ENSOLARADO", descricao: "", fotos: [] as string[] });
  const [fotoForm, setFotoForm] = useState({ descricao: "", url: "" });
  const [docForm, setDocForm] = useState({ nome: "", tipo: "CONTRATO" as any, url: "" });
  const [timelineForm, setTimelineForm] = useState({ tipo: "ACTIVITY" as any, titulo: "", descricao: "", data: new Date().toISOString().split("T")[0] });
  const [colabForm, setColabForm] = useState({ nome: "", cargo: "", horasTrabalhadas: 0 });
  const [materialForm, setMaterialForm] = useState({ nome: "", unidade: "", quantidade: 0, custoUnitario: 0 });
  const [lancamentoForm, setLancamentoForm] = useState({ tipo: "DESPESA" as "RECEITA" | "DESPESA", categoria: "", descricao: "", valor: 0, data: new Date().toISOString().split("T")[0], status: "PENDENTE" as any });

  useEffect(() => { setMounted(true); }, []);

  const obra = obras.find((o) => o.id === obraId);
  const clienteVinculado = obra ? clientes.find((c) => c.id === obra.clienteId) : undefined;

  if (!mounted || loadingObra) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="mt-4 text-xl font-semibold">Obra nao encontrada</h2>
        <Link href="/obras"><Button className="mt-4">Voltar para Obras</Button></Link>
      </div>
    );
  }

  // Financial calculations
  const receitas = lancamentos.filter((l) => l.tipo === "RECEITA");
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA");
  const totalReceitas = receitas.reduce((s, l) => s + l.valor, 0);
  const totalDespesas = despesas.reduce((s, l) => s + l.valor, 0);
  const saldo = obra.orcamento - obra.gastoReal;
  const lucroEstimado = totalReceitas - totalDespesas;

  // Financial chart data
  const finChartData = [
    { mes: "Mar", receitas: 0, despesas: 0 },
    { mes: "Abr", receitas: 112500, despesas: 45000 },
    { mes: "Mai", receitas: 0, despesas: 120000 },
    { mes: "Jun", receitas: 112500, despesas: 12500 },
    { mes: "Jul", receitas: 0, despesas: 0 },
    { mes: "Ago", receitas: 0, despesas: 38000 },
  ];

  const handleDiarioSubmit = () => {
    if (!diarioForm.descricao.trim()) return;
    addEntrada({ obraId, data: diarioForm.data, clima: diarioForm.clima as any, descricao: diarioForm.descricao, fotos: diarioForm.fotos });
    setDiarioForm({ data: new Date().toISOString().split("T")[0], clima: "ENSOLARADO", descricao: "", fotos: [] });
    setShowDiarioForm(false);
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setFotoForm({ ...fotoForm, url });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFotoSubmit = () => {
    if (!fotoForm.url) return;
    addFoto({ obraId, url: fotoForm.url, descricao: fotoForm.descricao });
    setFotoForm({ descricao: "", url: "" });
    setShowFotoForm(false);
  };

  const handleDocSubmit = () => {
    if (!docForm.nome.trim()) return;
    addDocumento({ obraId, nome: docForm.nome, tipo: docForm.tipo, url: docForm.url || "#" });
    setDocForm({ nome: "", tipo: "CONTRATO", url: "" });
    setShowDocForm(false);
  };

  const handleTimelineSubmit = () => {
    if (!timelineForm.titulo.trim()) return;
    addEvento({ obraId, tipo: timelineForm.tipo, titulo: timelineForm.titulo, descricao: timelineForm.descricao, data: timelineForm.data });
    setTimelineForm({ tipo: "ACTIVITY", titulo: "", descricao: "", data: new Date().toISOString().split("T")[0] });
    setShowTimelineForm(false);
  };

  const handleColabSubmit = () => {
    if (!colabForm.nome.trim()) return;
    addColaborador({ obraId, nome: colabForm.nome, cargo: colabForm.cargo, horasTrabalhadas: colabForm.horasTrabalhadas });
    setColabForm({ nome: "", cargo: "", horasTrabalhadas: 0 });
    setShowColabForm(false);
  };

  const handleMaterialSubmit = () => {
    if (!materialForm.nome.trim()) return;
    addMaterial({ obraId, nome: materialForm.nome, unidade: materialForm.unidade, quantidade: materialForm.quantidade, custoUnitario: materialForm.custoUnitario, custoTotal: materialForm.quantidade * materialForm.custoUnitario });
    setMaterialForm({ nome: "", unidade: "", quantidade: 0, custoUnitario: 0 });
    setShowMaterialForm(false);
  };

  const handleLancamentoSubmit = () => {
    if (!lancamentoForm.descricao.trim() || lancamentoForm.valor <= 0) return;
    createLancamento({ obraId, tipo: lancamentoForm.tipo, categoria: lancamentoForm.categoria, descricao: lancamentoForm.descricao, valor: lancamentoForm.valor, data: lancamentoForm.data, status: lancamentoForm.status });
    setLancamentoForm({ tipo: "DESPESA", categoria: "", descricao: "", valor: 0, data: new Date().toISOString().split("T")[0], status: "PENDENTE" });
    setShowLancamentoForm(false);
  };

  const handleDiarioFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDiarioForm((prev) => ({ ...prev, fotos: [...prev.fotos, reader.result as string] }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div>
      <PageHeader
        title={obra.nome}
        breadcrumbs={[{ label: "Obras", href: "/obras" }, { label: obra.nome }]}
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Obra
            </Button>
            <Link href="/obras">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        }
      />

      <Tabs defaultValue="resumo" className="mt-6">
        <TabsList className="mb-6 flex flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="resumo" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2">Resumo</TabsTrigger>
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2">Financeiro</TabsTrigger>
          <TabsTrigger value="diario" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2">Diario</TabsTrigger>
          <TabsTrigger value="fotos" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2">Fotos</TabsTrigger>
          <TabsTrigger value="documentos" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2">Documentos</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2">Timeline</TabsTrigger>
          <TabsTrigger value="equipe" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2">Equipe</TabsTrigger>
          <TabsTrigger value="materiais" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2">Materiais</TabsTrigger>
        </TabsList>

        {/* TAB: Resumo */}
        <TabsContent value="resumo">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Info card */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{obra.nome}</h2>
                    <p className="mt-1 text-muted-foreground">{obra.cliente}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusConfig[obra.status]?.color}`}>
                    {statusConfig[obra.status]?.label}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{obra.endereco}, {obra.cidade} - {obra.estado}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Inicio: {new Date(obra.dataInicio + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Previsao: {new Date(obra.previsaoTermino + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                {obra.descricao && <p className="mt-4 text-sm text-muted-foreground">{obra.descricao}</p>}

                {/* Cliente vinculado */}
                {clienteVinculado && (
                  <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Cliente Vinculado
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{clienteVinculado.nome}</span></div>
                      <div><span className="text-muted-foreground">CPF/CNPJ:</span> <span className="font-medium">{clienteVinculado.cpfCnpj}</span></div>
                      <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{clienteVinculado.telefone}</span></div>
                      <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{clienteVinculado.email}</span></div>
                    </div>
                  </div>
                )}

                {/* Progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progresso Geral</span>
                    <span className="text-lg font-bold text-primary">{obra.progresso}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${obra.progresso}%` }} />
                  </div>
                </div>
              </div>

              {/* Equipe resumo */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Equipe Vinculada</h3>
                <div className="flex flex-wrap gap-3">
                  {colaboradores.slice(0, 6).map((colab) => (
                    <div key={colab.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {colab.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{colab.nome}</p>
                        <p className="text-xs text-muted-foreground">{colab.cargo}</p>
                      </div>
                    </div>
                  ))}
                  {colaboradores.length > 6 && (
                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                      +{colaboradores.length - 6} mais
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial cards */}
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Orcamento Previsto</p>
                <p className="mt-1 text-xl font-bold">{formatCurrency(obra.orcamento)}</p>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Gasto Real</p>
                <p className="mt-1 text-xl font-bold text-red-600">{formatCurrency(obra.gastoReal)}</p>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Saldo Disponivel</p>
                <p className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(saldo)}</p>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">Lucro Estimado</p>
                <p className={`mt-1 text-xl font-bold ${lucroEstimado >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(lucroEstimado)}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: Financeiro */}
        <TabsContent value="financeiro">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="Total Receitas" value={formatCurrency(totalReceitas)} icon={DollarSign} />
              <StatCard title="Total Despesas" value={formatCurrency(totalDespesas)} icon={DollarSign} />
              <StatCard title="Saldo" value={formatCurrency(lucroEstimado)} icon={DollarSign} />
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">Evolucao Financeira</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={finChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Lancamentos</h3>
                <Button size="sm" onClick={() => setShowLancamentoForm(true)}>
                  <Plus className="mr-1 h-4 w-4" /> Adicionar
                </Button>
              </div>

              {showLancamentoForm && (
                <div className="mb-4 rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={lancamentoForm.tipo} onValueChange={(v: any) => setLancamentoForm({ ...lancamentoForm, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECEITA">Receita</SelectItem>
                        <SelectItem value="DESPESA">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Categoria" value={lancamentoForm.categoria} onChange={(e) => setLancamentoForm({ ...lancamentoForm, categoria: e.target.value })} />
                  </div>
                  <Input placeholder="Descricao" value={lancamentoForm.descricao} onChange={(e) => setLancamentoForm({ ...lancamentoForm, descricao: e.target.value })} />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input type="number" placeholder="Valor" value={lancamentoForm.valor || ""} onChange={(e) => setLancamentoForm({ ...lancamentoForm, valor: Number(e.target.value) })} />
                    <Input type="date" value={lancamentoForm.data} onChange={(e) => setLancamentoForm({ ...lancamentoForm, data: e.target.value })} />
                    <Select value={lancamentoForm.status} onValueChange={(v: any) => setLancamentoForm({ ...lancamentoForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="PAGO">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleLancamentoSubmit}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowLancamentoForm(false)}>Cancelar</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {lancamentos.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${l.tipo === "RECEITA" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50" : "bg-red-100 text-red-600 dark:bg-red-950/50"}`}>
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{l.descricao}</p>
                        <p className="text-xs text-muted-foreground">{l.categoria} - {new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${l.tipo === "RECEITA" ? "text-emerald-600" : "text-red-600"}`}>
                        {l.tipo === "RECEITA" ? "+" : "-"}{formatCurrency(l.valor)}
                      </p>
                      <span className={`text-xs ${l.status === "PAGO" ? "text-emerald-600" : l.status === "VENCIDO" ? "text-red-600" : "text-amber-600"}`}>
                        {l.status === "PAGO" ? "Pago" : l.status === "VENCIDO" ? "Vencido" : "Pendente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: Diario */}
        <TabsContent value="diario">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowDiarioForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nova Entrada
              </Button>
            </div>

            {showDiarioForm && (
              <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-semibold">Nova Entrada do Diario</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={diarioForm.data} onChange={(e) => setDiarioForm({ ...diarioForm, data: e.target.value })} />
                  </div>
                  <div>
                    <Label>Clima</Label>
                    <Select value={diarioForm.clima} onValueChange={(v) => setDiarioForm({ ...diarioForm, clima: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENSOLARADO">Ensolarado</SelectItem>
                        <SelectItem value="NUBLADO">Nublado</SelectItem>
                        <SelectItem value="CHUVOSO">Chuvoso</SelectItem>
                        <SelectItem value="TEMPESTADE">Tempestade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Descricao</Label>
                  <Textarea value={diarioForm.descricao} onChange={(e) => setDiarioForm({ ...diarioForm, descricao: e.target.value })} placeholder="Descreva as atividades do dia..." rows={4} />
                </div>
                <div>
                  <Label>Fotos</Label>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-4 hover:border-primary/50">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Clique para adicionar fotos</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleDiarioFotoUpload} />
                  </label>
                  {diarioForm.fotos.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {diarioForm.fotos.map((f, i) => (
                        <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden">
                          <img src={f} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDiarioSubmit}>Salvar Entrada</Button>
                  <Button variant="outline" onClick={() => setShowDiarioForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="relative ml-4 border-l-2 border-muted pl-6 space-y-6">
              {entradas.map((entrada) => {
                const ClimaIcon = climaIcons[entrada.clima] || Sun;
                return (
                  <div key={entrada.id} className="relative">
                    <div className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-primary" />
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{new Date(entrada.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                          <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                            <ClimaIcon className="h-3 w-3" />
                            <span className="text-xs">{climaLabels[entrada.clima]}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{entrada.descricao}</p>
                      {entrada.fotos.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {entrada.fotos.map((f, i) => (
                            <div key={i} className="h-20 w-20 rounded-lg overflow-hidden cursor-pointer" onClick={() => setLightboxFoto(f)}>
                              <img src={f} alt="" className="h-full w-full object-cover hover:scale-110 transition-transform" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {entradas.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhuma entrada no diario ainda.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: Fotos */}
        <TabsContent value="fotos">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowFotoForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Foto
              </Button>
            </div>

            {showFotoForm && (
              <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-semibold">Nova Foto</h3>
                <div>
                  <Label>Imagem</Label>
                  <label className="mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 hover:border-primary/50">
                    {fotoForm.url ? (
                      <img src={fotoForm.url} alt="" className="h-48 rounded-lg object-contain" />
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Clique para selecionar uma foto</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                  </label>
                </div>
                <div>
                  <Label>Descricao</Label>
                  <Input value={fotoForm.descricao} onChange={(e) => setFotoForm({ ...fotoForm, descricao: e.target.value })} placeholder="Descricao da foto" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleFotoSubmit}>Salvar</Button>
                  <Button variant="outline" onClick={() => { setShowFotoForm(false); setFotoForm({ descricao: "", url: "" }); }}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {fotos.map((foto) => (
                <div key={foto.id} className="group relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => foto.url && setLightboxFoto(foto.url)}>
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    {foto.url ? (
                      <img src={foto.url} alt={foto.descricao} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{foto.descricao}</p>
                    <p className="text-xs text-muted-foreground">{new Date(foto.criadoEm + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>

            {fotos.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Camera className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhuma foto adicionada ainda.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: Documentos */}
        <TabsContent value="documentos">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowDocForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Documento
              </Button>
            </div>

            {showDocForm && (
              <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-semibold">Novo Documento</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Nome do Documento</Label>
                    <Input value={docForm.nome} onChange={(e) => setDocForm({ ...docForm, nome: e.target.value })} placeholder="Nome do documento" />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={docForm.tipo} onValueChange={(v: any) => setDocForm({ ...docForm, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONTRATO">Contrato</SelectItem>
                        <SelectItem value="PROJETO">Projeto</SelectItem>
                        <SelectItem value="ALVARA">Alvara</SelectItem>
                        <SelectItem value="ORCAMENTO">Orcamento</SelectItem>
                        <SelectItem value="OUTRO">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDocSubmit}>Salvar</Button>
                  <Button variant="outline" onClick={() => setShowDocForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {documentos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.nome}</p>
                      <p className="text-xs text-muted-foreground">{doc.tipo} - {new Date(doc.criadoEm + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline"><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>

            {documentos.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhum documento adicionado ainda.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: Timeline */}
        <TabsContent value="timeline">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowTimelineForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Evento
              </Button>
            </div>

            {showTimelineForm && (
              <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-semibold">Novo Evento</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={timelineForm.tipo} onValueChange={(v: any) => setTimelineForm({ ...timelineForm, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MILESTONE">Marco</SelectItem>
                        <SelectItem value="ACTIVITY">Atividade</SelectItem>
                        <SelectItem value="NOTE">Nota</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={timelineForm.data} onChange={(e) => setTimelineForm({ ...timelineForm, data: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Titulo</Label>
                  <Input value={timelineForm.titulo} onChange={(e) => setTimelineForm({ ...timelineForm, titulo: e.target.value })} placeholder="Titulo do evento" />
                </div>
                <div>
                  <Label>Descricao</Label>
                  <Textarea value={timelineForm.descricao} onChange={(e) => setTimelineForm({ ...timelineForm, descricao: e.target.value })} placeholder="Descricao..." rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleTimelineSubmit}>Salvar</Button>
                  <Button variant="outline" onClick={() => setShowTimelineForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="relative ml-4 border-l-2 border-muted pl-6 space-y-6">
              {timelineEventos.map((evento) => {
                const iconMap = { MILESTONE: Milestone, ACTIVITY: Activity, NOTE: StickyNote };
                const colorMap = { MILESTONE: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50", ACTIVITY: "bg-blue-100 text-blue-600 dark:bg-blue-950/50", NOTE: "bg-amber-100 text-amber-600 dark:bg-amber-950/50" };
                const Icon = iconMap[evento.tipo] || Activity;
                return (
                  <div key={evento.id} className="relative">
                    <div className={`absolute -left-[33px] flex h-5 w-5 items-center justify-center rounded-full ${colorMap[evento.tipo]}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="rounded-lg border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{evento.titulo}</h4>
                        <span className="text-xs text-muted-foreground">{new Date(evento.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{evento.descricao}</p>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[evento.tipo]}`}>
                        {evento.tipo === "MILESTONE" ? "Marco" : evento.tipo === "ACTIVITY" ? "Atividade" : "Nota"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {timelineEventos.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhum evento na timeline ainda.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: Equipe */}
        <TabsContent value="equipe">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowColabForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Vincular Colaborador
              </Button>
            </div>

            {showColabForm && (
              <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-semibold">Vincular Colaborador</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>Nome</Label>
                    <Input value={colabForm.nome} onChange={(e) => setColabForm({ ...colabForm, nome: e.target.value })} placeholder="Nome" />
                  </div>
                  <div>
                    <Label>Cargo</Label>
                    <Input value={colabForm.cargo} onChange={(e) => setColabForm({ ...colabForm, cargo: e.target.value })} placeholder="Cargo" />
                  </div>
                  <div>
                    <Label>Horas Trabalhadas</Label>
                    <Input type="number" value={colabForm.horasTrabalhadas || ""} onChange={(e) => setColabForm({ ...colabForm, horasTrabalhadas: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleColabSubmit}>Vincular</Button>
                  <Button variant="outline" onClick={() => setShowColabForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {colaboradores.map((colab) => (
                <div key={colab.id} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-bold text-primary">
                        {colab.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{colab.nome}</p>
                        <p className="text-sm text-muted-foreground">{colab.cargo}</p>
                      </div>
                    </div>
                    <button onClick={() => removeColaborador(colab.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{colab.horasTrabalhadas}h trabalhadas</span>
                  </div>
                </div>
              ))}
            </div>

            {colaboradores.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhum colaborador vinculado a esta obra.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: Materiais */}
        <TabsContent value="materiais">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowMaterialForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Material
              </Button>
            </div>

            {showMaterialForm && (
              <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-semibold">Adicionar Material</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={materialForm.nome} onChange={(e) => setMaterialForm({ ...materialForm, nome: e.target.value })} placeholder="Nome" />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input value={materialForm.unidade} onChange={(e) => setMaterialForm({ ...materialForm, unidade: e.target.value })} placeholder="Ex: saco, m3" />
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input type="number" value={materialForm.quantidade || ""} onChange={(e) => setMaterialForm({ ...materialForm, quantidade: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Custo Unitario (R$)</Label>
                    <Input type="number" value={materialForm.custoUnitario || ""} onChange={(e) => setMaterialForm({ ...materialForm, custoUnitario: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleMaterialSubmit}>Adicionar</Button>
                  <Button variant="outline" onClick={() => setShowMaterialForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Material</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Unidade</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Qtd</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Custo Unit.</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {materiais.map((mat) => (
                    <tr key={mat.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">{mat.nome}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{mat.unidade}</td>
                      <td className="px-4 py-3 text-sm">{mat.quantidade}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(mat.custoUnitario)}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(mat.custoTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                {materiais.length > 0 && (
                  <tfoot className="border-t bg-muted/30">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm font-semibold">Total</td>
                      <td className="px-4 py-3 text-sm font-bold">{formatCurrency(materiais.reduce((s, m) => s + m.custoTotal, 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {materiais.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhum material vinculado a esta obra.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-xl mx-4">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Excluir Obra</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Tem certeza? Todos os dados vinculados serao excluidos (orcamentos, despesas, OS, diario, fotos, compras, cronograma, centro de custos, documentos).
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => {
                deleteObraCascade(obraId);
                router.push("/obras");
              }}>
                Confirmar Exclusao
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxFoto(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setLightboxFoto(null)}>
            <X className="h-6 w-6" />
          </button>
          <img src={lightboxFoto} alt="" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}
