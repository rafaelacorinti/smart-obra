"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useObras, useLancamentos, useColaboradores, usePresencas, useOrdensServico, useVeiculos, useAbastecimentosVeiculo, useManutencoesVeiculo, useMateriaisEstoque, useMovimentacoes } from "@/hooks/use-storage-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart3, DollarSign, TrendingUp, Users, Fuel, Package, ArrowLeft, FileDown, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import * as XLSX from "xlsx";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

type ReportType = "financeiro" | "lucro-obra" | "custos-categoria" | "produtividade" | "combustivel" | "materiais" | null;

const reports = [
  { id: "financeiro" as ReportType, title: "Financeiro Geral", desc: "Receitas x Despesas por periodo", icon: DollarSign, color: "from-emerald-500 to-teal-600" },
  { id: "lucro-obra" as ReportType, title: "Lucro por Obra", desc: "Rentabilidade e margem por obra", icon: TrendingUp, color: "from-blue-500 to-indigo-600" },
  { id: "custos-categoria" as ReportType, title: "Custos por Categoria", desc: "Distribuicao de despesas", icon: BarChart3, color: "from-orange-500 to-red-600" },
  { id: "produtividade" as ReportType, title: "Produtividade", desc: "Horas e OS dos colaboradores", icon: Users, color: "from-purple-500 to-violet-600" },
  { id: "combustivel" as ReportType, title: "Consumo de Combustivel", desc: "Consumo e custos por veiculo", icon: Fuel, color: "from-cyan-500 to-blue-600" },
  { id: "materiais" as ReportType, title: "Materiais e Estoque", desc: "Movimentacoes e alertas", icon: Package, color: "from-pink-500 to-rose-600" },
];

export default function RelatoriosPage() {
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [periodo, setPeriodo] = useState({ inicio: "2024-01-01", fim: "2024-12-31" });

  const { obras } = useObras();
  const { lancamentos } = useLancamentos();
  const { colaboradores } = useColaboradores();
  const { presencas } = usePresencas();
  const { ordens } = useOrdensServico();
  const { veiculos } = useVeiculos();
  const { abastecimentos } = useAbastecimentosVeiculo();
  const { manutencoes } = useManutencoesVeiculo();
  const { materiais } = useMateriaisEstoque();
  const { movimentacoes } = useMovimentacoes();

  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((l) => l.data >= periodo.inicio && l.data <= periodo.fim);
  }, [lancamentos, periodo]);

  const handleExportExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activeReport) {
    return (
      <div>
        <PageHeader title="Relatorios" breadcrumbs={[{ label: "Relatorios" }]} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className="group rounded-xl border bg-card p-6 text-left shadow-sm transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${report.color}`}>
                <report.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{report.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{report.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="print:p-4">
      <PageHeader
        title={reports.find((r) => r.id === activeReport)?.title || "Relatorio"}
        breadcrumbs={[{ label: "Relatorios", href: "/relatorios" }, { label: reports.find((r) => r.id === activeReport)?.title || "" }]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => setActiveReport(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />Voltar
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />PDF
            </Button>
            <Button size="sm" onClick={() => {
              if (activeReport === "financeiro") handleExportExcel(lancamentosFiltrados.map(l => ({ Tipo: l.tipo, Categoria: l.categoria, Descricao: l.descricao, Valor: l.valor, Data: l.data, Status: l.status })), "relatorio-financeiro");
              if (activeReport === "lucro-obra") handleExportExcel(obras.map(o => ({ Obra: o.nome, Orcamento: o.orcamento, GastoReal: o.gastoReal, Lucro: o.orcamento - o.gastoReal, Margem: ((o.orcamento - o.gastoReal) / o.orcamento * 100).toFixed(1) + "%" })), "lucro-por-obra");
            }}>
              <FileDown className="mr-2 h-4 w-4" />Excel
            </Button>
          </div>
        }
      />

      {/* Period Filter */}
      <div className="mb-6 flex items-center gap-4 print:hidden">
        <div>
          <label className="text-xs text-muted-foreground">De</label>
          <input type="date" value={periodo.inicio} onChange={(e) => setPeriodo({...periodo, inicio: e.target.value})} className="ml-2 rounded-lg border bg-background px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Ate</label>
          <input type="date" value={periodo.fim} onChange={(e) => setPeriodo({...periodo, fim: e.target.value})} className="ml-2 rounded-lg border bg-background px-3 py-1.5 text-sm" />
        </div>
      </div>

      {activeReport === "financeiro" && <RelatorioFinanceiro lancamentos={lancamentosFiltrados} />}
      {activeReport === "lucro-obra" && <RelatorioLucroObra obras={obras} lancamentos={lancamentosFiltrados} />}
      {activeReport === "custos-categoria" && <RelatorioCustos lancamentos={lancamentosFiltrados} />}
      {activeReport === "produtividade" && <RelatorioProdutividade colaboradores={colaboradores} presencas={presencas} ordens={ordens} />}
      {activeReport === "combustivel" && <RelatorioCombustivel veiculos={veiculos} abastecimentos={abastecimentos} />}
      {activeReport === "materiais" && <RelatorioMateriais materiais={materiais} movimentacoes={movimentacoes} />}
    </div>
  );
}

function RelatorioFinanceiro({ lancamentos }: { lancamentos: any[] }) {
  const receitas = lancamentos.filter((l) => l.tipo === "RECEITA");
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA");
  const totalReceitas = receitas.reduce((a, l) => a + l.valor, 0);
  const totalDespesas = despesas.reduce((a, l) => a + l.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const dadosMensais = useMemo(() => {
    const meses: Record<string, { receitas: number; despesas: number }> = {};
    lancamentos.forEach((l) => {
      const mes = l.data.slice(0, 7);
      if (!meses[mes]) meses[mes] = { receitas: 0, despesas: 0 };
      if (l.tipo === "RECEITA") meses[mes].receitas += l.valor;
      else meses[mes].despesas += l.valor;
    });
    return Object.entries(meses).sort().map(([mes, data]) => ({
      mes: mes.slice(5) + "/" + mes.slice(2, 4),
      receitas: data.receitas,
      despesas: data.despesas,
    }));
  }, [lancamentos]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Total Receitas</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Total Despesas</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className={`text-2xl font-bold ${saldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(saldo)}</p>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h4 className="font-medium mb-4">Receitas x Despesas por Mes</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosMensais}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RelatorioLucroObra({ obras, lancamentos }: { obras: any[]; lancamentos: any[] }) {
  const dadosObras = useMemo(() => {
    return obras.map((obra) => {
      const receitasObra = lancamentos.filter((l) => l.obraId === obra.id && l.tipo === "RECEITA").reduce((a, l) => a + l.valor, 0);
      const despesasObra = lancamentos.filter((l) => l.obraId === obra.id && l.tipo === "DESPESA").reduce((a, l) => a + l.valor, 0);
      const lucro = receitasObra - despesasObra;
      const margem = receitasObra > 0 ? (lucro / receitasObra) * 100 : 0;
      return { nome: obra.nome, receita: receitasObra, custo: despesasObra, lucro, margem };
    }).sort((a, b) => b.lucro - a.lucro);
  }, [obras, lancamentos]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Obra</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Receita</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Custo</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Lucro</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Margem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dadosObras.map((d, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium">{d.nome}</td>
                <td className="px-4 py-3 text-sm text-emerald-600">{formatCurrency(d.receita)}</td>
                <td className="px-4 py-3 text-sm text-red-600 hidden sm:table-cell">{formatCurrency(d.custo)}</td>
                <td className="px-4 py-3 text-sm font-medium">{formatCurrency(d.lucro)}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`font-medium ${d.margem >= 0 ? "text-emerald-600" : "text-red-600"}`}>{d.margem.toFixed(1)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h4 className="font-medium mb-4">Comparativo de Lucro por Obra</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosObras} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis dataKey="nome" type="category" width={150} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="receita" name="Receita" fill="#10b981" />
            <Bar dataKey="custo" name="Custo" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RelatorioCustos({ lancamentos }: { lancamentos: any[] }) {
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA");
  const totalDespesas = despesas.reduce((a, l) => a + l.valor, 0);

  const porCategoria = useMemo(() => {
    const cats: Record<string, number> = {};
    despesas.forEach((l) => {
      cats[l.categoria] = (cats[l.categoria] || 0) + l.valor;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [despesas]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground">Total de Despesas no Periodo</p>
        <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h4 className="font-medium mb-4">Despesas por Categoria</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={porCategoria} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {porCategoria.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Categoria</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Valor</th>
                <th className="px-4 py-3 text-left text-sm font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {porCategoria.map((cat, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(cat.value)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{((cat.value / totalDespesas) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RelatorioProdutividade({ colaboradores, presencas, ordens }: { colaboradores: any[]; presencas: any[]; ordens: any[] }) {
  const dados = useMemo(() => {
    return colaboradores.map((col) => {
      const presencasCol = presencas.filter((p) => p.colaboradorId === col.id);
      const horasTotal = presencasCol.reduce((a, p) => a + p.horas, 0);
      const osCol = ordens.filter((o) => o.tecnicoId === col.id);
      const osConcluidas = osCol.filter((o) => o.status === "FINALIZADA").length;
      return { nome: col.nome, cargo: col.cargo, horas: horasTotal, totalOS: osCol.length, osConcluidas };
    }).sort((a, b) => b.horas - a.horas);
  }, [colaboradores, presencas, ordens]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Colaborador</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Cargo</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Horas</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">OS Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium">OS Concluidas</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dados.map((d, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3 text-sm font-medium">{d.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{d.cargo}</td>
                <td className="px-4 py-3 text-sm">{d.horas}h</td>
                <td className="px-4 py-3 text-sm hidden md:table-cell">{d.totalOS}</td>
                <td className="px-4 py-3 text-sm font-medium text-emerald-600">{d.osConcluidas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h4 className="font-medium mb-4">Horas Trabalhadas por Colaborador</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dados.slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="nome" type="category" width={120} />
            <Tooltip />
            <Bar dataKey="horas" name="Horas" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RelatorioCombustivel({ veiculos, abastecimentos }: { veiculos: any[]; abastecimentos: any[] }) {
  const dados = useMemo(() => {
    return veiculos.filter((v) => v.kmAtual > 0).map((v) => {
      const abasts = abastecimentos.filter((a) => a.veiculoId === v.id);
      const totalLitros = abasts.reduce((a, b) => a + b.litros, 0);
      const totalCusto = abasts.reduce((a, b) => a + b.total, 0);
      const sorted = [...abasts].sort((a, b) => a.km - b.km);
      const kmRodado = sorted.length >= 2 ? sorted[sorted.length - 1].km - sorted[0].km : 0;
      const consumoMedio = totalLitros > 0 && kmRodado > 0 ? kmRodado / totalLitros : 0;
      return { nome: v.nome, placa: v.placa, totalLitros, totalCusto, kmRodado, consumoMedio };
    });
  }, [veiculos, abastecimentos]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Veiculo</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Placa</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Consumo Medio</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Litros Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Custo Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Km Rodado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dados.map((d, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium">{d.nome}</td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground hidden sm:table-cell">{d.placa}</td>
                <td className="px-4 py-3 text-sm font-medium text-primary">{d.consumoMedio.toFixed(1)} km/l</td>
                <td className="px-4 py-3 text-sm hidden md:table-cell">{d.totalLitros.toFixed(0)} L</td>
                <td className="px-4 py-3 text-sm font-medium">{formatCurrency(d.totalCusto)}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{d.kmRodado.toLocaleString()} km</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h4 className="font-medium mb-4">Consumo Medio Comparativo (km/l)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nome" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="consumoMedio" name="km/l" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RelatorioMateriais({ materiais, movimentacoes }: { materiais: any[]; movimentacoes: any[] }) {
  const maisUtilizados = useMemo(() => {
    const uso: Record<string, { nome: string; saidas: number }> = {};
    movimentacoes.filter((m) => m.tipo === "SAIDA").forEach((m) => {
      if (!uso[m.materialId]) uso[m.materialId] = { nome: m.materialNome, saidas: 0 };
      uso[m.materialId].saidas += m.quantidade;
    });
    return Object.values(uso).sort((a, b) => b.saidas - a.saidas);
  }, [movimentacoes]);

  const alertasEstoque = materiais.filter((m) => m.quantidade <= m.estoqueMinimo);

  return (
    <div className="space-y-6">
      {alertasEstoque.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4">
          <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Alertas de Estoque Baixo</h4>
          <div className="space-y-1">
            {alertasEstoque.map((m) => (
              <p key={m.id} className="text-sm text-red-600 dark:text-red-300">
                {m.nome}: {m.quantidade} {m.unidade} (minimo: {m.estoqueMinimo})
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h4 className="font-medium mb-4">Itens Mais Utilizados</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={maisUtilizados.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nome" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="saidas" name="Saidas" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h4 className="font-medium">Ranking de Consumo</h4>
          </div>
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">#</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Material</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Saidas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {maisUtilizados.slice(0, 10).map((m, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-4 py-2 text-sm font-medium text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 text-sm">{m.nome}</td>
                  <td className="px-4 py-2 text-sm font-medium">{m.saidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}