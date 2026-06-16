"use client";
import { useMemo } from "react";
import { Sparkles, AlertTriangle, TrendingUp, Truck, Package, Clock, Users } from "lucide-react";
import {
  useObras,
  useLancamentos,
  useVeiculos,
  useManutencoesVeiculo,
  useMateriaisEstoque,
  useColaboradores,
  usePresencas,
} from "@/hooks/use-storage-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "critical" | "warning" | "info";

interface Insight {
  id: string;
  priority: Priority;
  icon: React.ReactNode;
  title: string;
  description: string;
}

// ─── Priority order map ───────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

// ─── Card style maps ──────────────────────────────────────────────────────────

const BORDER_COLOR: Record<Priority, string> = {
  critical: "border-l-red-500",
  warning: "border-l-yellow-400",
  info: "border-l-blue-500",
};

const ICON_BG: Record<Priority, string> = {
  critical: "bg-red-100 text-red-600",
  warning: "bg-yellow-100 text-yellow-600",
  info: "bg-blue-100 text-blue-600",
};

const GRADIENT_BG: Record<Priority, string> = {
  critical: "from-red-50/60 to-white",
  warning: "from-yellow-50/60 to-white",
  info: "from-blue-50/60 to-white",
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardInsights() {
  const { obras } = useObras();
  const { lancamentos } = useLancamentos();
  const { veiculos } = useVeiculos();
  const { manutencoes } = useManutencoesVeiculo();
  const { materiais } = useMateriaisEstoque();
  const { colaboradores } = useColaboradores();
  const { presencas } = usePresencas();

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    // ── 1. Obras with cost > 80 % of budget (critical above 100 %, warning otherwise) ──
    for (const obra of obras ?? []) {
      if (
        obra.orcamento > 0 &&
        obra.gastoReal > 0 &&
        obra.gastoReal / obra.orcamento > 0.8
      ) {
        const ratio = obra.gastoReal / obra.orcamento;
        const overPercent = formatPercent(ratio);
        const isCritical = ratio >= 1;
        result.push({
          id: `obra-budget-${obra.id}`,
          priority: isCritical ? "critical" : "warning",
          icon: <TrendingUp className="w-5 h-5" />,
          title: `Obra "${obra.nome}" com alto consumo de orçamento`,
          description: `Custo atual é ${overPercent} do orçamento previsto. ${
            isCritical
              ? "Orçamento já ultrapassado — revisão urgente."
              : "Atenção: aproximando-se do limite."
          }`,
        });
      }
    }

    // ── 2. Vehicles close to scheduled maintenance ────────────────────────────
    for (const veiculo of veiculos ?? []) {
      const manutencao = (manutencoes ?? []).find(
        (m) => m.veiculoId === veiculo.id
      );
      if (manutencao && manutencao.proximaKm != null) {
        const diff = manutencao.proximaKm - veiculo.kmAtual;
        if (diff <= 1000 && diff >= 0) {
          result.push({
            id: `manutencao-${veiculo.id}`,
            priority: diff <= 200 ? "critical" : "warning",
            icon: <Truck className="w-5 h-5" />,
            title: `Veículo "${veiculo.nome}" próximo da manutenção`,
            description: `Faltam ${diff.toLocaleString("pt-BR")} km para a próxima manutenção programada.`,
          });
        } else if (diff < 0) {
          result.push({
            id: `manutencao-overdue-${veiculo.id}`,
            priority: "critical",
            icon: <Truck className="w-5 h-5" />,
            title: `Veículo "${veiculo.nome}" com manutenção atrasada`,
            description: `KM atual ultrapassou o ponto de manutenção em ${Math.abs(diff).toLocaleString("pt-BR")} km.`,
          });
        }
      }
    }

    // ── 3. Lançamentos VENCIDO or PENDENTE within 7 days ─────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    const urgentLancamentos = (lancamentos ?? []).filter((l) => {
      if (l.status === "CANCELADO" || l.status === "PAGO") return false;
      const due = new Date(l.data);
      due.setHours(0, 0, 0, 0);
      if (l.status === "VENCIDO") return true;
      if (l.status === "PENDENTE" && due <= in7Days) return true;
      return false;
    });

    const vencidos = urgentLancamentos.filter((l) => l.status === "VENCIDO").length;
    const pendentesUrgentes = urgentLancamentos.filter(
      (l) => l.status === "PENDENTE"
    ).length;

    if (vencidos > 0) {
      result.push({
        id: "lancamentos-vencidos",
        priority: "critical",
        icon: <Clock className="w-5 h-5" />,
        title: `${vencidos} ${vencidos === 1 ? "conta vencida" : "contas vencidas"}`,
        description: "Há lançamentos com prazo expirado que precisam de atenção imediata.",
      });
    }

    if (pendentesUrgentes > 0) {
      result.push({
        id: "lancamentos-pendentes-semana",
        priority: "warning",
        icon: <Clock className="w-5 h-5" />,
        title: `${pendentesUrgentes} ${
          pendentesUrgentes === 1 ? "conta vence" : "contas vencem"
        } esta semana`,
        description: "Lançamentos pendentes com vencimento nos próximos 7 dias.",
      });
    }

    // ── 4. Materiais below minimum stock ──────────────────────────────────────
    const materiaisBaixos = (materiais ?? []).filter(
      (m) => m.estoqueMinimo != null && m.quantidade < m.estoqueMinimo
    );

    if (materiaisBaixos.length > 0) {
      result.push({
        id: "materiais-estoque-baixo",
        priority: "warning",
        icon: <Package className="w-5 h-5" />,
        title: `${materiaisBaixos.length} ${
          materiaisBaixos.length === 1
            ? "material abaixo do estoque mínimo"
            : "materiais abaixo do estoque mínimo"
        }`,
        description: `Reposição necessária: ${materiaisBaixos
          .slice(0, 3)
          .map((m) => m.nome)
          .join(", ")}${materiaisBaixos.length > 3 ? " e outros." : "."}`,
      });
    }

    // ── 5. Colaboradores with most EXTRA presences this month ─────────────────
    const now = new Date();
    const monthPresencas = (presencas ?? []).filter((p) => {
      const d = new Date(p.data);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    });

    // Count EXTRA per colaborador
    const extraCount: Record<string, number> = {};
    for (const p of monthPresencas) {
      if (p.tipo === "EXTRA") {
        extraCount[p.colaboradorId] = (extraCount[p.colaboradorId] ?? 0) + 1;
      }
    }

    // Find top colaborador by extra count
    let topColaboradorId: string | null = null;
    let topExtras = 0;
    for (const [id, count] of Object.entries(extraCount)) {
      if (count > topExtras) {
        topExtras = count;
        topColaboradorId = id;
      }
    }

    if (topColaboradorId && topExtras > 0) {
      const colaborador = (colaboradores ?? []).find(
        (c) => c.nome === topColaboradorId || (c as any).id === topColaboradorId
      );
      const nome = colaborador?.nome ?? topColaboradorId;
      result.push({
        id: "colaborador-horas-extras",
        priority: "info",
        icon: <Users className="w-5 h-5" />,
        title: `"${nome}" com mais horas extras este mês`,
        description: `${topExtras} ${
          topExtras === 1 ? "registro de hora extra" : "registros de horas extras"
        } no mês atual. Considere avaliar a carga de trabalho.`,
      });
    }

    // ── Sort by priority and cap at 5 ─────────────────────────────────────────
    return result
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      .slice(0, 5);
  }, [obras, lancamentos, veiculos, manutencoes, materiais, colaboradores, presencas]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="w-full">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-800 leading-none">
            Insights Inteligentes
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Alertas e recomendações baseados nos seus dados
          </p>
        </div>
      </div>

      {/* Insights list or empty state */}
      {insights.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-white px-4 py-4 shadow-sm">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-100 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">
              Tudo em ordem!
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Nenhum alerta no momento. Continue acompanhando seus projetos.
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className={`
                flex items-start gap-3 rounded-xl border border-l-4 border-gray-100
                bg-gradient-to-r ${GRADIENT_BG[insight.priority]}
                ${BORDER_COLOR[insight.priority]}
                px-4 py-3 shadow-sm transition-shadow hover:shadow-md
              `}
            >
              {/* Icon badge */}
              <div
                className={`
                  flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 mt-0.5
                  ${ICON_BG[insight.priority]}
                `}
              >
                {insight.icon}
              </div>

              {/* Text */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 leading-snug">
                  {insight.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {insight.description}
                </p>
              </div>

              {/* Priority badge */}
              <div className="flex-shrink-0 ml-auto pt-0.5">
                {insight.priority === "critical" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    <AlertTriangle className="w-3 h-3" />
                    Crítico
                  </span>
                )}
                {insight.priority === "warning" && (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    Atenção
                  </span>
                )}
                {insight.priority === "info" && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Info
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
