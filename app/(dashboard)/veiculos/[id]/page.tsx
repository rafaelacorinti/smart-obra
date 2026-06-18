"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useVeiculos, useManutencoesVeiculo, useAbastecimentosVeiculo, useDocumentosVeiculo } from "@/hooks/use-storage-data";
import { ManutencaoVeiculo, AbastecimentoVeiculo, DocumentoVeiculo } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Truck, Wrench, Fuel, FileText, DollarSign, AlertTriangle, Plus, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

export default function VeiculoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { veiculos } = useVeiculos();
  const { manutencoes, createManutencao } = useManutencoesVeiculo(id);
  const { abastecimentos, createAbastecimento } = useAbastecimentosVeiculo(id);
  const { documentos, createDocumento } = useDocumentosVeiculo(id);

  const [showManutencaoForm, setShowManutencaoForm] = useState(false);
  const [showAbastecimentoForm, setShowAbastecimentoForm] = useState(false);
  const [showDocumentoForm, setShowDocumentoForm] = useState(false);

  const [manForm, setManForm] = useState({ tipo: "PREVENTIVA" as ManutencaoVeiculo["tipo"], descricao: "", data: "", custo: 0, kmNaManutencao: 0, proximaKm: 0 });
  const [abastForm, setAbastForm] = useState({ data: "", litros: 0, precoLitro: 0, km: 0 });
  const [docForm, setDocForm] = useState({ tipo: "CRLV" as DocumentoVeiculo["tipo"], nome: "", validade: "" });

  const veiculo = veiculos.find((v) => v.id === id);

  const consumoMedio = useMemo(() => {
    if (abastecimentos.length < 2) return 0;
    const sorted = [...abastecimentos].sort((a, b) => a.km - b.km);
    const kmTotal = sorted[sorted.length - 1].km - sorted[0].km;
    const litrosTotal = sorted.slice(1).reduce((acc, a) => acc + a.litros, 0);
    return litrosTotal > 0 ? kmTotal / litrosTotal : 0;
  }, [abastecimentos]);

  const consumoMensal = useMemo(() => {
    const meses: Record<string, { litros: number; custo: number }> = {};
    abastecimentos.forEach((a) => {
      const mes = a.data.slice(0, 7);
      if (!meses[mes]) meses[mes] = { litros: 0, custo: 0 };
      meses[mes].litros += a.litros;
      meses[mes].custo += a.total;
    });
    return Object.entries(meses).sort().map(([mes, data]) => ({
      mes: mes.slice(5) + "/" + mes.slice(2, 4),
      litros: data.litros,
      custo: data.custo,
    }));
  }, [abastecimentos]);

  const custoTotal = useMemo(() => {
    const manCusto = manutencoes.reduce((acc, m) => acc + m.custo, 0);
    const combCusto = abastecimentos.reduce((acc, a) => acc + a.total, 0);
    return { manutencao: manCusto, combustivel: combCusto, total: manCusto + combCusto };
  }, [manutencoes, abastecimentos]);

  const custoPorKm = useMemo(() => {
    if (!veiculo || veiculo.kmAtual === 0) return 0;
    return custoTotal.total / veiculo.kmAtual;
  }, [custoTotal, veiculo]);

  const custosPieData = [
    { name: "Manutencao", value: custoTotal.manutencao },
    { name: "Combustivel", value: custoTotal.combustivel },
  ];

  const alertasManutencao = useMemo(() => {
    if (!veiculo) return [];
    return manutencoes.filter((m) => m.proximaKm && m.proximaKm <= veiculo.kmAtual + 1000);
  }, [manutencoes, veiculo]);

  const alertasDocumentos = useMemo(() => {
    const hoje = new Date().toISOString().split("T")[0];
    const em30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    return documentos.filter((d) => d.validade <= em30dias);
  }, [documentos]);

  if (!veiculo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Truck className="h-16 w-16 text-muted-foreground/30" />
        <p className="mt-4 text-lg font-medium">Veiculo nao encontrado</p>
        <Button className="mt-4" onClick={() => router.push("/veiculos")}>Voltar</Button>
      </div>
    );
  }

  const handleManutencaoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createManutencao({ ...manForm, veiculoId: id });
    setManForm({ tipo: "PREVENTIVA", descricao: "", data: "", custo: 0, kmNaManutencao: 0, proximaKm: 0 });
    setShowManutencaoForm(false);
  };

  const handleAbastecimentoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = abastForm.litros * abastForm.precoLitro;
    createAbastecimento({ ...abastForm, total, veiculoId: id });
    setAbastForm({ data: "", litros: 0, precoLitro: 0, km: 0 });
    setShowAbastecimentoForm(false);
  };

  const handleDocumentoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDocumento({ ...docForm, veiculoId: id, url: "#" });
    setDocForm({ tipo: "CRLV", nome: "", validade: "" });
    setShowDocumentoForm(false);
  };

  return (
    <div>
      <PageHeader
        title={veiculo.nome}
        breadcrumbs={[{ label: "Veiculos", href: "/veiculos" }, { label: veiculo.nome }]}
      />

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="manutencoes">Manutencoes</TabsTrigger>
          <TabsTrigger value="abastecimentos">Abastecimentos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
        </TabsList>

        {/* ABA DADOS */}
        <TabsContent value="dados">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                <Truck className="h-16 w-16 text-primary/40" />
              </div>
              <h3 className="text-lg font-semibold">{veiculo.nome}</h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Placa</span><span className="text-sm font-medium font-mono">{veiculo.placa || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Tipo</span><span className="text-sm font-medium">{veiculo.tipo}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Marca/Modelo</span><span className="text-sm font-medium">{veiculo.marca} {veiculo.modelo}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Ano</span><span className="text-sm font-medium">{veiculo.ano}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Km Atual</span><span className="text-sm font-medium">{veiculo.kmAtual.toLocaleString()} km</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Horimetro</span><span className="text-sm font-medium">{veiculo.horimetro.toLocaleString()} h</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span><span className="text-sm font-medium">{veiculo.status}</span></div>
              </div>
            </div>
            <div className="space-y-4">
              {alertasManutencao.length > 0 && (
                <div className="rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 p-4">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Manutencao Proxima</span>
                  </div>
                  {alertasManutencao.map((m) => (
                    <p key={m.id} className="mt-2 text-sm text-yellow-600 dark:text-yellow-300">
                      {m.descricao} - Proxima em {m.proximaKm?.toLocaleString()} km
                    </p>
                  ))}
                </div>
              )}
              {alertasDocumentos.length > 0 && (
                <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Documentos Vencendo</span>
                  </div>
                  {alertasDocumentos.map((d) => (
                    <p key={d.id} className="mt-2 text-sm text-red-600 dark:text-red-300">
                      {d.nome} - Validade: {formatDate(d.validade)}
                    </p>
                  ))}
                </div>
              )}
              <div className="rounded-xl border bg-card p-4">
                <h4 className="font-medium mb-3">Resumo</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Manutencoes</p>
                    <p className="text-lg font-bold">{manutencoes.length}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Abastecimentos</p>
                    <p className="text-lg font-bold">{abastecimentos.length}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Consumo Medio</p>
                    <p className="text-lg font-bold">{consumoMedio.toFixed(1)} km/l</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Custo Total</p>
                    <p className="text-lg font-bold">{formatCurrency(custoTotal.total)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ABA MANUTENCOES */}
        <TabsContent value="manutencoes">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Manutencoes</h3>
            <Button size="sm" onClick={() => setShowManutencaoForm(true)}>
              <Plus className="mr-2 h-4 w-4" />Nova Manutencao
            </Button>
          </div>
          {alertasManutencao.length > 0 && (
            <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Manutencao proxima ou vencida!
              </p>
            </div>
          )}
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Descricao</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Custo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Km</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Proxima (km)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {manutencoes.sort((a, b) => b.data.localeCompare(a.data)).map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3"><span className="rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{m.tipo}</span></td>
                    <td className="px-4 py-3 text-sm">{m.descricao}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{formatDate(m.data)}</td>
                    <td className="px-4 py-3 text-sm font-medium hidden md:table-cell">{formatCurrency(m.custo)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{m.kmNaManutencao > 0 ? m.kmNaManutencao.toLocaleString() : "-"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{m.proximaKm ? m.proximaKm.toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showManutencaoForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowManutencaoForm(false)} />
              <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-xl mx-4">
                <h3 className="text-lg font-semibold mb-4">Nova Manutencao</h3>
                <form onSubmit={handleManutencaoSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <select value={manForm.tipo} onChange={(e) => setManForm({...manForm, tipo: e.target.value as ManutencaoVeiculo["tipo"]})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                      <option value="PREVENTIVA">Preventiva</option>
                      <option value="CORRETIVA">Corretiva</option>
                      <option value="REVISAO">Revisao</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descricao *</label>
                    <input type="text" value={manForm.descricao} onChange={(e) => setManForm({...manForm, descricao: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Data *</label>
                      <input type="date" value={manForm.data} onChange={(e) => setManForm({...manForm, data: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Custo (R$)</label>
                      <input type="number" value={manForm.custo} onChange={(e) => setManForm({...manForm, custo: Number(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Km na manutencao</label>
                      <input type="number" value={manForm.kmNaManutencao} onChange={(e) => setManForm({...manForm, kmNaManutencao: Number(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Proxima (km)</label>
                      <input type="number" value={manForm.proximaKm} onChange={(e) => setManForm({...manForm, proximaKm: Number(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowManutencaoForm(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ABA ABASTECIMENTOS */}
        <TabsContent value="abastecimentos">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Abastecimentos</h3>
            <Button size="sm" onClick={() => setShowAbastecimentoForm(true)}>
              <Plus className="mr-2 h-4 w-4" />Novo Abastecimento
            </Button>
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Consumo Medio</p>
              <p className="text-2xl font-bold text-primary">{consumoMedio.toFixed(1)} km/l</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Gasto</p>
              <p className="text-2xl font-bold">{formatCurrency(abastecimentos.reduce((a, b) => a + b.total, 0))}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Litros Total</p>
              <p className="text-2xl font-bold">{abastecimentos.reduce((a, b) => a + b.litros, 0).toFixed(0)} L</p>
            </div>
          </div>
          {consumoMensal.length > 0 && (
            <div className="mb-6 rounded-xl border bg-card p-4">
              <h4 className="font-medium mb-4">Consumo Mensal</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={consumoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${Number(value).toFixed(0)} L`, "Litros"]} />
                  <Bar dataKey="litros" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Litros</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Preco/L</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Km</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {abastecimentos.sort((a, b) => b.data.localeCompare(a.data)).map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">{formatDate(a.data)}</td>
                    <td className="px-4 py-3 text-sm">{a.litros} L</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">R$ {a.precoLitro.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(a.total)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{a.km.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showAbastecimentoForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAbastecimentoForm(false)} />
              <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-xl mx-4">
                <h3 className="text-lg font-semibold mb-4">Novo Abastecimento</h3>
                <form onSubmit={handleAbastecimentoSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Data *</label>
                      <input type="date" value={abastForm.data} onChange={(e) => setAbastForm({...abastForm, data: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Km Atual *</label>
                      <input type="number" value={abastForm.km} onChange={(e) => setAbastForm({...abastForm, km: Number(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Litros *</label>
                      <input type="number" step="0.01" value={abastForm.litros} onChange={(e) => setAbastForm({...abastForm, litros: Number(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Preco/Litro *</label>
                      <input type="number" step="0.01" value={abastForm.precoLitro} onChange={(e) => setAbastForm({...abastForm, precoLitro: Number(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Total: {formatCurrency(abastForm.litros * abastForm.precoLitro)}</p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowAbastecimentoForm(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ABA DOCUMENTOS */}
        <TabsContent value="documentos">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Documentos</h3>
            <Button size="sm" onClick={() => setShowDocumentoForm(true)}>
              <Plus className="mr-2 h-4 w-4" />Novo Documento
            </Button>
          </div>
          {alertasDocumentos.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-3">
              <p className="text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Documentos vencendo em breve!
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documentos.map((doc) => {
              const hoje = new Date().toISOString().split("T")[0];
              const vencido = doc.validade < hoje;
              const vencendo = !vencido && doc.validade <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
              return (
                <div key={doc.id} className={`rounded-xl border p-4 ${vencido ? "border-red-300 bg-red-50 dark:bg-red-900/10" : vencendo ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10" : "bg-card"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{doc.nome}</span>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted">{doc.tipo}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Validade: {formatDate(doc.validade)}
                  </div>
                  {vencido && <p className="mt-1 text-xs text-red-600 font-medium">VENCIDO</p>}
                  {vencendo && <p className="mt-1 text-xs text-yellow-600 font-medium">VENCENDO EM BREVE</p>}
                </div>
              );
            })}
          </div>
          {showDocumentoForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDocumentoForm(false)} />
              <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-xl mx-4">
                <h3 className="text-lg font-semibold mb-4">Novo Documento</h3>
                <form onSubmit={handleDocumentoSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <select value={docForm.tipo} onChange={(e) => setDocForm({...docForm, tipo: e.target.value as DocumentoVeiculo["tipo"]})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                      <option value="CRLV">CRLV</option>
                      <option value="SEGURO">Seguro</option>
                      <option value="IPVA">IPVA</option>
                      <option value="LICENCIAMENTO">Licenciamento</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nome *</label>
                    <input type="text" value={docForm.nome} onChange={(e) => setDocForm({...docForm, nome: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Validade *</label>
                    <input type="date" value={docForm.validade} onChange={(e) => setDocForm({...docForm, validade: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowDocumentoForm(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ABA CUSTOS */}
        <TabsContent value="custos">
          <h3 className="text-lg font-semibold mb-4">Custos</h3>
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Manutencao</p>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(custoTotal.manutencao)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Combustivel</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(custoTotal.combustivel)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Custo Total</p>
              <p className="text-xl font-bold">{formatCurrency(custoTotal.total)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Custo/km</p>
              <p className="text-xl font-bold text-emerald-600">R$ {custoPorKm.toFixed(2)}</p>
            </div>
          </div>
          {custoTotal.total > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <h4 className="font-medium mb-4">Distribuicao de Custos</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={custosPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {custosPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
