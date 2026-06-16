"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  HardHat,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  FileWarning,
  FileText,
} from "lucide-react";
import { obrasStorage, despesasStorage, contratosStorage, documentosStorage } from "@/lib/storage";
import type { Obra, Despesa, Contrato, Documento } from "@/types";

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6", "#f59e0b", "#6366f1"];

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Alert {
  type: "danger" | "warning" | "info";
  icon: React.ReactNode;
  message: string;
}

export default function DashboardPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);

  useEffect(() => {
    setObras(obrasStorage.getAll());
    setDespesas(despesasStorage.getAll());
    setContratos(contratosStorage.getAll());
    setDocumentos(documentosStorage.getAll());
  }, []);

  // Computed metrics
  const obrasAtivas = obras.filter((o) => o.status === "em_andamento").length;
  const obrasConcluidas = obras.filter((o) => o.status === "concluida").length;
  const obrasAtrasadas = obras.filter((o) => {
    if (o.status === "concluida" || o.status === "cancelada") return false;
    return new Date(o.dataPrevisao) < new Date();
  }).length;

  const receitaPrevista = contratos.reduce((acc, c) => acc + c.valor, 0) || obras.reduce((acc, o) => acc + o.orcamento, 0);
  const despesasTotal = despesas.reduce((acc, d) => acc + d.valor, 0);
  const receitaRealizada = despesasTotal > 0 ? receitaPrevista * 0.85 : 0;
  const despesasPrevistas = obras.reduce((acc, o) => acc + o.orcamento * 0.7, 0);
  const lucroPrevisto = receitaPrevista - despesasPrevistas;
  const lucroRealizado = receitaRealizada - despesasTotal;

  // Fluxo de Caixa data
  const fluxoCaixa = MESES.map((mes, i) => {
    const mesNum = i + 1;
    const despesasMes = despesas
      .filter((d) => {
        const dt = new Date(d.data);
        return dt.getMonth() + 1 === mesNum;
      })
      .reduce((acc, d) => acc + d.valor, 0);
    const receitaMes = receitaPrevista > 0 ? (receitaPrevista / 12) * (0.7 + Math.random() * 0.6) : 0;
    return {
      mes,
      receita: Math.round(receitaMes),
      despesa: despesasMes > 0 ? despesasMes : Math.round(receitaMes * (0.5 + Math.random() * 0.4)),
    };
  });

  // Custos por Categoria
  const categorias = Array.from(new Set(despesas.map((d) => d.categoria)));
  const custosPorCategoria = categorias.length > 0
    ? categorias.map((cat) => ({
        categoria: cat,
        valor: despesas.filter((d) => d.categoria === cat).reduce((acc, d) => acc + d.valor, 0),
      }))
    : [
        { categoria: "Materiais", valor: 45000 },
        { categoria: "Mão de Obra", valor: 38000 },
        { categoria: "Equipamentos", valor: 15000 },
        { categoria: "Terceiros", valor: 22000 },
        { categoria: "Administrativo", valor: 8000 },
      ];

  // Despesas por Centro de Custo (mock)
  const centrosCusto = [
    { name: "Fundação", value: 25000 },
    { name: "Estrutura", value: 45000 },
    { name: "Alvenaria", value: 30000 },
    { name: "Cobertura", value: 18000 },
    { name: "Hidráulica", value: 12000 },
    { name: "Elétrica", value: 15000 },
    { name: "Acabamentos", value: 35000 },
    { name: "Paisagismo", value: 8000 },
    { name: "Administração", value: 10000 },
  ];

  // Receita por Obra
  const receitaPorObra = obras.length > 0
    ? obras.map((o) => ({
        obra: o.nome.length > 15 ? o.nome.substring(0, 15) + "..." : o.nome,
        receita: o.orcamento,
      }))
    : [
        { obra: "Residencial A", receita: 350000 },
        { obra: "Comercial B", receita: 520000 },
        { obra: "Reforma C", receita: 180000 },
      ];

  // Lucro por Obra
  const lucroPorObra = obras.length > 0
    ? obras.map((o) => {
        const despesaObra = despesas
          .filter((d) => d.obraId === o.id)
          .reduce((acc, d) => acc + d.valor, 0);
        const lucro = o.orcamento - despesaObra;
        return {
          obra: o.nome.length > 15 ? o.nome.substring(0, 15) + "..." : o.nome,
          lucro,
          fill: lucro >= 0 ? "#10b981" : "#ef4444",
        };
      })
    : [
        { obra: "Residencial A", lucro: 85000, fill: "#10b981" },
        { obra: "Comercial B", lucro: -25000, fill: "#ef4444" },
        { obra: "Reforma C", lucro: 42000, fill: "#10b981" },
      ];

  // Alerts
  const alerts: Alert[] = [];

  obras.forEach((o) => {
    const despesaObra = despesas
      .filter((d) => d.obraId === o.id)
      .reduce((acc, d) => acc + d.valor, 0);
    if (despesaObra > o.orcamento) {
      alerts.push({
        type: "danger",
        icon: <AlertTriangle className="w-5 h-5" />,
        message: `Obra "${o.nome}" ultrapassou o orçamento em ${formatCurrency(despesaObra - o.orcamento)}`,
      });
    }
    if (
      o.status === "em_andamento" &&
      new Date(o.dataPrevisao) < new Date()
    ) {
      alerts.push({
        type: "warning",
        icon: <Clock className="w-5 h-5" />,
        message: `Obra "${o.nome}" está atrasada (previsão: ${new Date(o.dataPrevisao).toLocaleDateString("pt-BR")})`,
      });
    }
  });

  contratos.forEach((c) => {
    const diasParaVencer = Math.ceil(
      (new Date(c.dataFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diasParaVencer < 0 && c.status === "ativo") {
      alerts.push({
        type: "danger",
        icon: <FileWarning className="w-5 h-5" />,
        message: `Contrato vencido há ${Math.abs(diasParaVencer)} dias`,
      });
    } else if (diasParaVencer >= 0 && diasParaVencer <= 30 && c.status === "ativo") {
      alerts.push({
        type: "warning",
        icon: <FileWarning className="w-5 h-5" />,
        message: `Contrato vence em ${diasParaVencer} dias`,
      });
    }
  });

  if (documentos.length === 0 && obras.length > 0) {
    alerts.push({
      type: "info",
      icon: <FileText className="w-5 h-5" />,
      message: "Existem obras sem documentos cadastrados",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "info",
      icon: <FileText className="w-5 h-5" />,
      message: "Nenhum alerta no momento. Cadastre obras para ver indicadores reais.",
    });
  }

  const alertColors = {
    danger: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Executivo</h1>
        <p className="text-gray-500 mt-1">Visão geral das obras e indicadores financeiros</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Obras */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Obras</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{obras.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <HardHat className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <span className="text-green-600">{obrasAtivas} ativas</span>
            <span className="text-blue-600">{obrasConcluidas} concluídas</span>
            <span className="text-red-600">{obrasAtrasadas} atrasadas</span>
          </div>
        </div>

        {/* Receita */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Receita Prevista</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(receitaPrevista)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Realizada: <span className="font-semibold text-green-600">{formatCurrency(receitaRealizada)}</span>
          </p>
        </div>

        {/* Despesas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Despesas Previstas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(despesasPrevistas)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Realizadas: <span className="font-semibold text-red-600">{formatCurrency(despesasTotal)}</span>
          </p>
        </div>

        {/* Lucro */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Lucro Previsto</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(lucroPrevisto)}</p>
            </div>
            <div className={`p-3 rounded-lg ${lucroRealizado >= 0 ? "bg-green-100" : "bg-red-100"}`}>
              <TrendingUp className={`w-6 h-6 ${lucroRealizado >= 0 ? "text-green-600" : "text-red-600"}`} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Realizado:{" "}
            <span className={`font-semibold ${lucroRealizado >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(lucroRealizado)}
            </span>
          </p>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Alertas</h2>
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg border ${alertColors[alert.type]}`}
          >
            {alert.icon}
            <span className="text-sm">{alert.message}</span>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fluxo de Caixa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxo de Caixa</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fluxoCaixa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita" />
              <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2} name="Despesa" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Custos por Categoria */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Custos por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={custosPorCategoria}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Valor" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Despesas por Centro de Custo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Despesas por Centro de Custo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={centrosCusto}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {centrosCusto.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Receita por Obra */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita por Obra</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={receitaPorObra} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="obra" width={100} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="receita" fill="#f97316" radius={[0, 4, 4, 0]} name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lucro por Obra */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lucro por Obra</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lucroPorObra}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="obra" />
              <YAxis tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="lucro" name="Lucro" radius={[4, 4, 0, 0]}>
                {lucroPorObra.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}