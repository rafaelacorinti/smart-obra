"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Printer, TrendingUp, DollarSign, Building2, BarChart3 } from "lucide-react";
import { useObras, useLancamentos } from "@/hooks/use-storage-data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

type TipoRelatorio = "financeiro" | "obras" | "gestao";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function RelatoriosPdfPage() {
  const { obras } = useObras();
  const { lancamentos } = useLancamentos();
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>("financeiro");
  const [obraSelecionada, setObraSelecionada] = useState<string>("todas");
  const [periodoInicio, setPeriodoInicio] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [periodoFim, setPeriodoFim] = useState(new Date().toISOString().split("T")[0]);
  const [showPreview, setShowPreview] = useState(false);

  const lancFiltrados = lancamentos.filter((l) => {
    const dentroOeobra = obraSelecionada === "todas" || l.obraId === obraSelecionada;
    const dentroPeriodo = l.data >= periodoInicio && l.data <= periodoFim;
    return dentroOeobra && dentroPeriodo;
  });

  const receitas = lancFiltrados.filter((l) => l.tipo === "RECEITA");
  const despesas = lancFiltrados.filter((l) => l.tipo === "DESPESA");
  const totalReceitas = receitas.reduce((acc, l) => acc + l.valor, 0);
  const totalDespesas = despesas.reduce((acc, l) => acc + l.valor, 0);
  const lucro = totalReceitas - totalDespesas;

  const despesasPorCategoria = despesas.reduce((acc, l) => {
    acc[l.categoria] = (acc[l.categoria] || 0) + l.valor;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(despesasPorCategoria).map(([name, value]) => ({ name, value }));

  const meses = Array.from(new Set(lancFiltrados.map((l) => l.data.substring(0, 7)))).sort();
  const fluxoCaixa = meses.map((mes) => {
    const mesLanc = lancFiltrados.filter((l) => l.data.substring(0, 7) === mes);
    const rec = mesLanc.filter((l) => l.tipo === "RECEITA").reduce((a, l) => a + l.valor, 0);
    const desp = mesLanc.filter((l) => l.tipo === "DESPESA").reduce((a, l) => a + l.valor, 0);
    return { mes: format(new Date(mes + "-01"), "MMM/yy", { locale: ptBR }), receitas: rec, despesas: desp, saldo: rec - desp };
  });

  const obrasData = obras.filter((o) => obraSelecionada === "todas" || o.id === obraSelecionada).map((o) => ({
    nome: o.nome,
    progresso: o.progresso,
    orcamento: o.orcamento,
    gastoReal: o.gastoReal,
    status: o.status,
  }));

  const handlePrint = () => { window.print(); };

  return (
    <div className="space-y-6">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20mm; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 15mm; }
          .print-area table { page-break-inside: avoid; }
          .print-footer { position: fixed; bottom: 10mm; left: 0; right: 0; text-align: center; font-size: 10px; color: #666; }
        }
      `}</style>

      {/* Controls - no print */}
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatorios Profissionais</h1>
          <p className="text-muted-foreground">Gere relatorios formatados para impressao/PDF</p>
        </div>
        <Button onClick={handlePrint} disabled={!showPreview}><Printer className="mr-2 h-4 w-4" />Gerar PDF</Button>
      </div>

      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
            <div>
              <Label className="text-xs text-muted-foreground">Tipo de Relatorio</Label>
              <Select value={tipoRelatorio} onValueChange={(v) => setTipoRelatorio(v as TipoRelatorio)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="obras">Obras</SelectItem>
                  <SelectItem value="gestao">Gestao</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Obra</Label>
              <Select value={obraSelecionada} onValueChange={setObraSelecionada}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as obras</SelectItem>
                  {obras.map((o) => (<SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Inicio</Label>
              <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fim</Label>
              <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => setShowPreview(true)}>Gerar Preview</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report types badges */}
      <div className="no-print flex flex-wrap gap-2">
        <Badge variant={tipoRelatorio === "financeiro" ? "default" : "outline"} className="cursor-pointer" onClick={() => setTipoRelatorio("financeiro")}>
          <DollarSign className="mr-1 h-3 w-3" />Financeiro
        </Badge>
        <Badge variant={tipoRelatorio === "obras" ? "default" : "outline"} className="cursor-pointer" onClick={() => setTipoRelatorio("obras")}>
          <Building2 className="mr-1 h-3 w-3" />Obras
        </Badge>
        <Badge variant={tipoRelatorio === "gestao" ? "default" : "outline"} className="cursor-pointer" onClick={() => setTipoRelatorio("gestao")}>
          <BarChart3 className="mr-1 h-3 w-3" />Gestao
        </Badge>
      </div>

      {/* Preview area */}
      {showPreview && (
        <div className="print-area">
          {/* Report Header */}
          <div className="mb-8 border-b-2 border-blue-600 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Smart Obra</h1>
                <p className="text-sm text-muted-foreground">Sistema de Gestao de Obras</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {tipoRelatorio === "financeiro" && "Relatorio Financeiro"}
                  {tipoRelatorio === "obras" && "Relatorio de Obras"}
                  {tipoRelatorio === "gestao" && "Relatorio de Gestao"}
                </p>
                <p className="text-sm text-muted-foreground">Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                <p className="text-xs text-muted-foreground">Periodo: {format(new Date(periodoInicio), "dd/MM/yyyy")} a {format(new Date(periodoFim), "dd/MM/yyyy")}</p>
              </div>
            </div>
          </div>

          {/* Financial Report */}
          {tipoRelatorio === "financeiro" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-50 dark:bg-green-950 border-green-200"><CardContent className="pt-4">
                  <p className="text-xs text-green-600 font-medium">Total Receitas</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </CardContent></Card>
                <Card className="bg-red-50 dark:bg-red-950 border-red-200"><CardContent className="pt-4">
                  <p className="text-xs text-red-600 font-medium">Total Despesas</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </CardContent></Card>
                <Card className={`${lucro >= 0 ? "bg-blue-50 dark:bg-blue-950 border-blue-200" : "bg-orange-50 dark:bg-orange-950 border-orange-200"}`}><CardContent className="pt-4">
                  <p className="text-xs font-medium">{lucro >= 0 ? "Lucro" : "Prejuizo"}</p>
                  <p className={`text-xl font-bold ${lucro >= 0 ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300"}`}>R$ {Math.abs(lucro).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </CardContent></Card>
              </div>

              <Card><CardHeader><CardTitle className="text-base">Fluxo de Caixa Mensal</CardTitle></CardHeader><CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={fluxoCaixa}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <Legend />
                    <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                    <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent></Card>

              {pieData.length > 0 && (
                <Card><CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                        {pieData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              )}

              <Card><CardHeader><CardTitle className="text-base">Detalhamento</CardTitle></CardHeader><CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b font-semibold"><td className="py-2">Data</td><td>Descricao</td><td>Categoria</td><td className="text-right">Valor</td><td>Status</td></tr></thead>
                  <tbody>
                    {lancFiltrados.slice(0, 20).map((l) => (
                      <tr key={l.id} className="border-b"><td className="py-1.5">{format(new Date(l.data), "dd/MM/yy")}</td><td className="truncate max-w-[200px]">{l.descricao}</td><td>{l.categoria}</td>
                        <td className={`text-right font-medium ${l.tipo === "RECEITA" ? "text-green-600" : "text-red-600"}`}>{l.tipo === "DESPESA" ? "-" : ""}R$ {l.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td><Badge variant="outline" className="text-[10px]">{l.status}</Badge></td></tr>
                    ))}
                  </tbody>
                </table>
              </CardContent></Card>
            </div>
          )}

          {/* Obras Report */}
          {tipoRelatorio === "obras" && (
            <div className="space-y-6">
              <Card><CardHeader><CardTitle className="text-base">Evolucao Fisica das Obras</CardTitle></CardHeader><CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={obrasData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => `${value}%`} />
                    <Bar dataKey="progresso" fill="#3b82f6" name="Progresso (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent></Card>

              <Card><CardHeader><CardTitle className="text-base">Orcamento vs Realizado</CardTitle></CardHeader><CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={obrasData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <Legend />
                    <Bar dataKey="orcamento" fill="#3b82f6" name="Orcamento" />
                    <Bar dataKey="gastoReal" fill="#f59e0b" name="Gasto Real" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent></Card>

              <Card><CardHeader><CardTitle className="text-base">Resumo das Obras</CardTitle></CardHeader><CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b font-semibold"><td className="py-2">Obra</td><td>Status</td><td>Progresso</td><td className="text-right">Orcamento</td><td className="text-right">Gasto Real</td><td className="text-right">Desvio</td></tr></thead>
                  <tbody>
                    {obrasData.map((o, i) => {
                      const desvio = o.gastoReal - o.orcamento;
                      return (
                        <tr key={i} className="border-b"><td className="py-1.5 font-medium">{o.nome}</td><td><Badge variant="outline" className="text-[10px]">{o.status}</Badge></td>
                          <td>{o.progresso}%</td><td className="text-right">R$ {o.orcamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          <td className="text-right">R$ {o.gastoReal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          <td className={`text-right font-medium ${desvio > 0 ? "text-red-600" : "text-green-600"}`}>{desvio > 0 ? "+" : ""}R$ {desvio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent></Card>
            </div>
          )}

          {/* Gestao Report */}
          {tipoRelatorio === "gestao" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Obras Ativas</p>
                  <p className="text-2xl font-bold">{obras.filter((o) => o.status === "EM_ANDAMENTO").length}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Margem</p>
                  <p className="text-2xl font-bold">{totalReceitas > 0 ? ((lucro / totalReceitas) * 100).toFixed(1) : "0"}%</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Ticket Medio</p>
                  <p className="text-2xl font-bold">R$ {receitas.length > 0 ? (totalReceitas / receitas.length).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : "0"}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Custo Medio/Obra</p>
                  <p className="text-2xl font-bold">R$ {obras.length > 0 ? (totalDespesas / obras.length).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : "0"}</p>
                </CardContent></Card>
              </div>

              <Card><CardHeader><CardTitle className="text-base">Lucratividade Mensal</CardTitle></CardHeader><CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={fluxoCaixa}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <Legend />
                    <Line type="monotone" dataKey="receitas" stroke="#10b981" name="Receitas" strokeWidth={2} />
                    <Line type="monotone" dataKey="despesas" stroke="#ef4444" name="Despesas" strokeWidth={2} />
                    <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent></Card>

              <Card><CardHeader><CardTitle className="text-base">Indicadores por Obra</CardTitle></CardHeader><CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b font-semibold"><td className="py-2">Obra</td><td>Progresso</td><td className="text-right">Orcamento</td><td className="text-right">Gasto</td><td className="text-right">Eficiencia</td></tr></thead>
                  <tbody>
                    {obrasData.map((o, i) => {
                      const eficiencia = o.orcamento > 0 ? ((o.orcamento - o.gastoReal) / o.orcamento * 100) : 0;
                      return (
                        <tr key={i} className="border-b"><td className="py-1.5 font-medium">{o.nome}</td>
                          <td><div className="flex items-center gap-2"><div className="h-2 w-16 rounded-full bg-muted"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${o.progresso}%` }} /></div><span className="text-xs">{o.progresso}%</span></div></td>
                          <td className="text-right">R$ {o.orcamento.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</td>
                          <td className="text-right">R$ {o.gastoReal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</td>
                          <td className={`text-right font-medium ${eficiencia >= 0 ? "text-green-600" : "text-red-600"}`}>{eficiencia.toFixed(1)}%</td></tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent></Card>
            </div>
          )}

          {/* Footer */}
          <div className="print-footer mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
            <p>Smart Obra - Relatorio gerado em {format(new Date(), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}</p>
            <p>Este documento e confidencial e de uso interno.</p>
          </div>
        </div>
      )}
    </div>
  );
}