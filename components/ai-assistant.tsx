"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles, Lightbulb, TrendingUp, AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useObras,
  useLancamentos,
  useOrdensServico,
  useColaboradores,
  useMateriaisEstoque,
  useVeiculos,
  useManutencoesVeiculo,
} from "@/hooks/use-storage-data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

// ─── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Resumo da empresa",
    prompt: "Qual é o resumo geral da empresa?",
    icon: <Building2 className="w-3 h-3" />,
  },
  {
    label: "Alertas",
    prompt: "Quais são os alertas importantes?",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  {
    label: "Previsão de custos",
    prompt: "Qual é a previsão de custos?",
    icon: <TrendingUp className="w-3 h-3" />,
  },
  {
    label: "Sugestão de orçamento",
    prompt: "Me dê uma sugestão de orçamento.",
    icon: <Lightbulb className="w-3 h-3" />,
  },
];

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex-shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "900ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "180ms", animationDuration: "900ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "360ms", animationDuration: "900ms" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[78%]">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm text-sm leading-relaxed">
            {message.content}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-right pr-1">
            {message.timestamp.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex-shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[78%]">
        <div className="bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-line">
          {message.content}
        </div>
        <p className="text-[10px] text-slate-400 mt-1 pl-1">
          {message.timestamp.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o assistente inteligente do Smart Obra. 👷\n\nPosso ajudar com resumos, status de obras, previsão de custos, alertas e muito mais. Como posso ajudar?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { obras } = useObras();
  const { lancamentos } = useLancamentos();
  const { ordens: ordensServico } = useOrdensServico();
  const { colaboradores } = useColaboradores();
  const { materiais: materiaisEstoque } = useMateriaisEstoque();
  const { veiculos } = useVeiculos();
  const { manutencoes: manutencoesVeiculo } = useManutencoesVeiculo();

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ── Focus input when panel opens ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // ── Response generator ────────────────────────────────────────────────────
  function generateResponse(query: string): string {
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // ── Resumo / empresa ─────────────────────────────────────────────────
    if (q.includes("resumo") || q.includes("empresa")) {
      const obrasAtivas = obras.filter((o) => o.status === "EM_ANDAMENTO").length;
      const obrasTotal = obras.length;
      const totalColaboradores = colaboradores.length;
      const totalVeiculos = veiculos.length;

      const receitas = lancamentos
        .filter((l) => l.tipo === "RECEITA")
        .reduce((acc, l) => acc + (Number(l.valor) || 0), 0);
      const despesas = lancamentos
        .filter((l) => l.tipo === "DESPESA")
        .reduce((acc, l) => acc + (Number(l.valor) || 0), 0);
      const saldo = receitas - despesas;

      const osAbertas = ordensServico.filter(
        (os) => os.status === "ABERTA" || os.status === "EM_ANDAMENTO"
      ).length;

      return (
        `📊 Resumo Geral da Empresa\n\n` +
        `🏗️ Obras: ${obrasAtivas} em andamento de ${obrasTotal} total\n` +
        `👷 Colaboradores: ${totalColaboradores} cadastrados\n` +
        `🚗 Veículos: ${totalVeiculos} na frota\n` +
        `🔧 Ordens de serviço abertas: ${osAbertas}\n\n` +
        `💰 Financeiro:\n` +
        `   • Receitas: R$ ${receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
        `   • Despesas: R$ ${despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
        `   • Saldo: ${saldo >= 0 ? "+" : ""}R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      );
    }

    // ── Obra específica ──────────────────────────────────────────────────
    if (q.includes("obra")) {
      const words = q.split(" ").filter((w) => w.length > 3 && w !== "obra");
      const found = obras.find((o) =>
        words.some((w) =>
          (o.nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(w)
        )
      );

      if (found) {
        const nome = found.nome || "Sem nome";
        const status = found.status || "indefinido";
        const orcamento = Number(found.orcamento || 0);
        const progresso = found.progresso || 0;
        return (
          `🏗️ Obra: ${nome}\n\n` +
          `📌 Status: ${status}\n` +
          `📈 Progresso: ${progresso}%\n` +
          `💰 Orçamento: R$ ${orcamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
          `📍 Endereço: ${found.endereco || "Não informado"}`
        );
      }

      const lista = obras
        .slice(0, 5)
        .map((o) => `• ${o.nome || "Sem nome"} — ${o.status || "indefinido"}`)
        .join("\n");

      return obras.length === 0
        ? "Nenhuma obra cadastrada no momento."
        : `🏗️ Obras cadastradas:\n\n${lista}${obras.length > 5 ? `\n\n...e mais ${obras.length - 5} outras.` : ""}`;
    }

    // ── Previsão / custo ─────────────────────────────────────────────────
    if (q.includes("previsao") || q.includes("previsão") || q.includes("custo")) {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      const despesasMes = lancamentos
        .filter((l) => {
          const d = new Date(l.data || "");
          return l.tipo === "DESPESA" && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        })
        .reduce((acc, l) => acc + (Number(l.valor) || 0), 0);

      const receitasMes = lancamentos
        .filter((l) => {
          const d = new Date(l.data || "");
          return l.tipo === "RECEITA" && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        })
        .reduce((acc, l) => acc + (Number(l.valor) || 0), 0);

      const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
      const diaAtual = hoje.getDate();
      const projecaoDespesas = (despesasMes / diaAtual) * diasNoMes;

      return (
        `📈 Previsão de Custos\n\n` +
        `Mês atual (${hoje.toLocaleString("pt-BR", { month: "long", year: "numeric" })}):\n\n` +
        `📉 Despesas até hoje: R$ ${despesasMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n` +
        `📈 Receitas até hoje: R$ ${receitasMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n` +
        `🔮 Projeção de despesas até fim do mês:\n   R$ ${projecaoDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n` +
        `${projecaoDespesas > receitasMes * 1.2 ? "⚠️ Atenção: as despesas projetadas superam as receitas do mês." : "✅ Despesas dentro do esperado."}`
      );
    }

    // ── Alertas ──────────────────────────────────────────────────────────
    if (q.includes("alerta")) {
      const alertas: string[] = [];
      const hoje = new Date();

      // Contas vencidas
      const contasVencidas = lancamentos.filter((l) => {
        const venc = new Date(l.data || "");
        return (
          l.status !== "PAGO" &&
          l.status !== "CANCELADO" &&
          venc < hoje &&
          !isNaN(venc.getTime())
        );
      });
      if (contasVencidas.length > 0) {
        alertas.push(`💳 ${contasVencidas.length} conta(s) vencida(s) sem pagamento`);
      }

      // Manutenções pendentes
      const manutencoesPendentes = manutencoesVeiculo.filter(
        (m) => m.proximaKm !== undefined
      );
      if (manutencoesPendentes.length > 0) {
        alertas.push(`🔧 ${manutencoesPendentes.length} manutenção(ões) de veículo pendente(s)`);
      }

      // Estoque baixo (quantidade <= estoqueMinimo)
      const estoqueBaixo = materiaisEstoque.filter(
        (m) => Number(m.quantidade || 0) <= Number(m.estoqueMinimo || 0)
      );
      if (estoqueBaixo.length > 0) {
        alertas.push(`📦 ${estoqueBaixo.length} material(is) com estoque baixo`);
      }

      // OS atrasadas
      const osAtrasadas = ordensServico.filter((os) => {
        const prazo = new Date(os.dataAgendada || "");
        return (os.status === "ABERTA" || os.status === "EM_ANDAMENTO") && prazo < hoje && !isNaN(prazo.getTime());
      });
      if (osAtrasadas.length > 0) {
        alertas.push(`🔨 ${osAtrasadas.length} ordem(ns) de serviço atrasada(s)`);
      }

      if (alertas.length === 0) {
        return "✅ Nenhum alerta crítico no momento. Tudo em ordem!";
      }

      return `🚨 Alertas Importantes\n\n${alertas.join("\n")}\n\nVerifique os módulos correspondentes para mais detalhes.`;
    }

    // ── Sugestão / orçamento ──────────────────────────────────────────────
    if (
      q.includes("sugestao") ||
      q.includes("sugestão") ||
      q.includes("orcamento") ||
      q.includes("orçamento")
    ) {
      const mediaObras =
        obras.length > 0
          ? obras.reduce((acc, o) => acc + (Number(o.orcamento || 0)), 0) / obras.length
          : 0;

      const totalMateriais = materiaisEstoque.reduce(
        (acc, m) =>
          acc +
          Number(m.quantidade || 0) *
            Number(m.valorUnitario || 0),
        0
      );

      const custoMedioMensal =
        lancamentos.length > 0
          ? lancamentos
              .filter((l) => l.tipo === "DESPESA")
              .reduce((acc, l) => acc + (Number(l.valor) || 0), 0) / 12
          : 0;

      return (
        `💡 Sugestões de Orçamento\n\n` +
        `Com base nos dados atuais:\n\n` +
        `• Valor médio das obras cadastradas:\n  R$ ${mediaObras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n` +
        `• Valor total em estoque:\n  R$ ${totalMateriais.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n` +
        `• Custo médio mensal estimado:\n  R$ ${custoMedioMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\n` +
        `💼 Recomendação: reserve ao menos 15% do orçamento de cada obra para imprevistos e manutenções não planejadas.`
      );
    }

    // ── Default ───────────────────────────────────────────────────────────
    return (
      "Posso ajudar com:\n\n" +
      "🏢 Resumo da empresa — visão geral de KPIs\n" +
      "🏗️ Status de obras — informações detalhadas\n" +
      "📈 Previsão de custos — análise financeira\n" +
      "🚨 Alertas importantes — pendências críticas\n" +
      "💡 Sugestões de orçamento — estimativas inteligentes\n\n" +
      "É só perguntar!"
    );
  }

  // ── Send message ──────────────────────────────────────────────────────────
  function handleSend(text?: string) {
    const content = (text ?? inputValue).trim();
    if (!content || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    const delay = 1000 + Math.random() * 800;
    setTimeout(() => {
      const response = generateResponse(content);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, delay);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Overlay (click to close) ────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Side Panel ──────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full w-[400px] z-50
          flex flex-col bg-slate-50 shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ maxWidth: "100vw" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">
                Assistente IA
              </h2>
              <p className="text-violet-200 text-xs">Smart Obra · sempre online</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Fechar assistente"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0 border-b border-slate-200 bg-white scrollbar-hide">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleSend(action.prompt)}
              disabled={isTyping}
              className="
                flex items-center gap-1.5 whitespace-nowrap
                px-3 py-1.5 rounded-full text-xs font-medium
                bg-slate-100 hover:bg-violet-100 hover:text-violet-700
                text-slate-600 border border-slate-200 hover:border-violet-200
                transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                flex-shrink-0
              "
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-0"
          style={{ scrollBehavior: "smooth" }}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 py-4 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 focus-within:border-violet-400 focus-within:bg-white transition-all duration-150 shadow-sm">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo sobre a obra..."
              disabled={isTyping}
              className="
                flex-1 border-none bg-transparent shadow-none focus-visible:ring-0
                text-sm text-slate-700 placeholder:text-slate-400 px-0
              "
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className="
                w-8 h-8 rounded-xl flex-shrink-0
                bg-gradient-to-br from-violet-600 to-indigo-600
                hover:from-violet-500 hover:to-indigo-500
                disabled:opacity-40 shadow-sm transition-all duration-150
              "
              aria-label="Enviar mensagem"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            Respostas geradas com base nos dados do sistema
          </p>
        </div>
      </div>

      {/* ── Floating Button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Abrir assistente IA"
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-2xl
          bg-gradient-to-br from-violet-600 to-indigo-600
          hover:from-violet-500 hover:to-indigo-500
          shadow-lg hover:shadow-violet-500/40
          flex items-center justify-center
          transition-all duration-200
          hover:scale-110 active:scale-95
          ${!isOpen ? "animate-pulse-subtle" : ""}
          ${isOpen ? "rotate-0 scale-95" : "rotate-0 scale-100"}
        `}
        style={{
          boxShadow: isOpen
            ? "0 4px 20px rgba(109, 40, 217, 0.4)"
            : "0 8px 32px rgba(109, 40, 217, 0.35)",
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}
        {/* Unread / online dot */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
        )}
      </button>

      {/* ── Pulse animation style ────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 8px 32px rgba(109, 40, 217, 0.35); }
          50%       { box-shadow: 0 8px 40px rgba(109, 40, 217, 0.6), 0 0 0 8px rgba(109, 40, 217, 0.08); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
