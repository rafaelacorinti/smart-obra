"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, BookOpen, BarChart3, MessageSquare, Send, Sparkles, CloudSun, Users, Hammer, Loader2 } from "lucide-react";
import { obrasStorage, despesasStorage, clientesStorage, contratosStorage, ordensStorage, diariosStorage } from "@/lib/storage";
import { useToast } from "@/lib/use-toast";
import { cn } from "@/lib/utils";
import type { Obra, Despesa, DiarioObra } from "@/types";

type Tab = "diario" | "resumo" | "chat";

// --- Diário Inteligente ---
function gerarRelatorioFormal(texto: string): { relatorio: string; clima: string; trabalhadores: number; atividades: string[] } {
  const lower = texto.toLowerCase();

  // Detectar clima
  let clima = "Não informado";
  const climaKeywords: Record<string, string[]> = {
    "Ensolarado": ["sol", "ensolarado", "calor", "quente", "tempo bom", "céu limpo", "tempo aberto"],
    "Nublado": ["nublado", "nuvens", "encoberto", "cinza"],
    "Chuvoso": ["chuva", "chuvoso", "chovendo", "temporal", "garoa", "choveu"],
    "Frio": ["frio", "gelado", "inverno", "geada"],
  };
  for (const [key, words] of Object.entries(climaKeywords)) {
    if (words.some((w) => lower.includes(w))) { clima = key; break; }
  }

  // Detectar número de trabalhadores
  let trabalhadores = 0;
  const trabMatch = lower.match(/(\d+)\s*(?:trabalhador|funcionário|pedreiro|servente|operário|pessoa|homem|homens|trabalhadores|funcionários)/);
  if (trabMatch) trabalhadores = parseInt(trabMatch[1]);

  // Detectar atividades
  const atividadeKeywords = [
    "alvenaria", "concretagem", "fundação", "reboco", "pintura", "elétrica",
    "hidráulica", "telhado", "piso", "revestimento", "demolição", "escavação",
    "impermeabilização", "acabamento", "estrutura", "forma", "ferragem",
    "contrapiso", "chapisco", "emboço", "laje", "viga", "pilar",
  ];
  const atividades = atividadeKeywords.filter((a) => lower.includes(a));

  const data = new Date().toLocaleDateString("pt-BR");
  const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const relatorio = `RELATÓRIO DIÁRIO DE OBRA
=============================
Data: ${data}
Horário: ${hora}

CONDIÇÕES CLIMÁTICAS
${clima}

EFETIVO
${trabalhadores > 0 ? `${trabalhadores} trabalhador(es) presente(s)` : "Quantidade não informada"}

ATIVIDADES REALIZADAS
${atividades.length > 0 ? atividades.map((a) => `• ${a.charAt(0).toUpperCase() + a.slice(1)}`).join("\n") : "Conforme descrito abaixo"}

DESCRIÇÃO DETALHADA
${texto}

=============================
Relatório gerado automaticamente pelo Smart Obra IA`;

  return { relatorio, clima, trabalhadores, atividades };
}

// --- Resumo Semanal ---
function gerarResumoSemanal(): string {
  const agora = new Date();
  const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  const obras = obrasStorage.getAll();
  const despesas = despesasStorage.getAll();
  const ordens = ordensStorage.getAll();
  const clientes = clientesStorage.getAll();

  const despesasSemana = despesas.filter((d) => {
    const dataDespesa = new Date(d.data || d.createdAt);
    return dataDespesa >= seteDiasAtras;
  });

  const totalGastoSemana = despesasSemana.reduce((sum, d) => sum + d.valor, 0);

  const obrasAtivas = obras.filter((o) => o.status === "em_andamento");
  const obrasConcluidas = obras.filter((o) => o.status === "concluida");
  const osAbertas = ordens.filter((o) => o.status === "aberta" || o.status === "em_execucao");

  const gastosPorCategoria: Record<string, number> = {};
  despesasSemana.forEach((d) => {
    gastosPorCategoria[d.categoria] = (gastosPorCategoria[d.categoria] || 0) + d.valor;
  });

  const alertas: string[] = [];
  obrasAtivas.forEach((o) => {
    if (o.progresso < 20) alertas.push(`⚠ "${o.nome}" está com apenas ${o.progresso}% de progresso`);
    if (o.dataPrevisao && new Date(o.dataPrevisao) < agora) alertas.push(`🔴 "${o.nome}" ultrapassou a data de previsão`);
  });

  if (osAbertas.filter((o) => o.prioridade === "urgente").length > 0) {
    alertas.push(`🔴 ${osAbertas.filter((o) => o.prioridade === "urgente").length} OS urgente(s) pendente(s)`);
  }

  return `RESUMO SEMANAL — SMART OBRA
=============================
Período: ${seteDiasAtras.toLocaleDateString("pt-BR")} a ${agora.toLocaleDateString("pt-BR")}

📊 VISÃO GERAL
• ${obras.length} obras cadastradas (${obrasAtivas.length} ativas, ${obrasConcluidas.length} concluídas)
• ${clientes.length} clientes no sistema
• ${ordens.length} ordens de serviço (${osAbertas.length} em aberto)

💰 FINANCEIRO (últimos 7 dias)
• Total gasto: R$ ${totalGastoSemana.toLocaleString("pt-BR")}
• ${despesasSemana.length} despesas registradas
${Object.entries(gastosPorCategoria).map(([cat, val]) => `  - ${cat}: R$ ${val.toLocaleString("pt-BR")}`).join("\n")}

🏗️ OBRAS ATIVAS
${obrasAtivas.length > 0 ? obrasAtivas.map((o) => `• ${o.nome}: ${o.progresso}% concluído`).join("\n") : "• Nenhuma obra ativa no momento"}

⚠️ ALERTAS
${alertas.length > 0 ? alertas.join("\n") : "• Nenhum alerta pendente. Tudo em dia!"}

=============================
Resumo gerado automaticamente pelo Smart Obra IA`;
}

// --- Chat da Obra ---
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function processarPergunta(pergunta: string): string {
  const lower = pergunta.toLowerCase().trim();
  const obras = obrasStorage.getAll();
  const despesas = despesasStorage.getAll();
  const clientes = clientesStorage.getAll();
  const contratos = contratosStorage.getAll();
  const ordens = ordensStorage.getAll();

  // Quanto gastou na obra X
  const gastoMatch = lower.match(/(?:quanto|qual|valor).*(?:gast|custo|despesa).*(?:obra|projeto)\s+(.+)/);
  if (gastoMatch) {
    const nomeObra = gastoMatch[1].trim();
    const obra = obras.find((o) => o.nome.toLowerCase().includes(nomeObra));
    if (obra) {
      const despesasObra = despesas.filter((d) => d.obraId === obra.id);
      const total = despesasObra.reduce((s, d) => s + d.valor, 0);
      return `Na obra "${obra.nome}", foram registradas ${despesasObra.length} despesas totalizando R$ ${total.toLocaleString("pt-BR")}.\n\nO orçamento previsto é de R$ ${obra.orcamento.toLocaleString("pt-BR")}.\n${total > obra.orcamento ? "⚠️ ATENÇÃO: Os gastos ultrapassaram o orçamento!" : `Ainda restam R$ ${(obra.orcamento - total).toLocaleString("pt-BR")} do orçamento.`}`;
    }
    return `Não encontrei uma obra com o nome "${nomeObra}". Obras cadastradas: ${obras.map((o) => o.nome).join(", ") || "nenhuma"}`;
  }

  // Obra mais atrasada
  if (lower.includes("atrasad") || lower.includes("atraso") || (lower.includes("menor") && lower.includes("progresso"))) {
    const ativas = obras.filter((o) => o.status === "em_andamento");
    if (ativas.length === 0) return "Não há obras em andamento no momento.";
    const maisAtrasada = ativas.reduce((prev, curr) => prev.progresso < curr.progresso ? prev : curr);
    return `A obra com menor progresso é "${maisAtrasada.nome}" com apenas ${maisAtrasada.progresso}% concluído.\n\nCliente: ${maisAtrasada.cliente}\nStatus: Em andamento\nOrçamento: R$ ${maisAtrasada.orcamento.toLocaleString("pt-BR")}`;
  }

  // Maior lucro / mais cara
  if (lower.includes("lucro") || lower.includes("mais car") || lower.includes("maior valor") || lower.includes("maior orçamento")) {
    if (obras.length === 0) return "Não há obras cadastradas.";
    const maiorOrcamento = obras.reduce((prev, curr) => prev.orcamento > curr.orcamento ? prev : curr);
    const despesasObra = despesas.filter((d) => d.obraId === maiorOrcamento.id);
    const totalGasto = despesasObra.reduce((s, d) => s + d.valor, 0);
    const lucro = maiorOrcamento.orcamento - totalGasto;
    return `A obra de maior orçamento é "${maiorOrcamento.nome}" com R$ ${maiorOrcamento.orcamento.toLocaleString("pt-BR")}.\n\nGastos até agora: R$ ${totalGasto.toLocaleString("pt-BR")}\nLucro estimado: R$ ${lucro.toLocaleString("pt-BR")} ${lucro < 0 ? "(⚠️ prejuízo!)" : ""}`;
  }

  // Total de despesas
  if (lower.includes("total") && (lower.includes("despesa") || lower.includes("gasto"))) {
    const total = despesas.reduce((s, d) => s + d.valor, 0);
    const categorias: Record<string, number> = {};
    despesas.forEach((d) => { categorias[d.categoria] = (categorias[d.categoria] || 0) + d.valor; });
    return `Total de despesas: R$ ${total.toLocaleString("pt-BR")} (${despesas.length} registros)\n\nPor categoria:\n${Object.entries(categorias).map(([c, v]) => `• ${c}: R$ ${v.toLocaleString("pt-BR")}`).join("\n")}`;
  }

  // Quantas obras / clientes
  if (lower.includes("quantas obras") || lower.includes("quantos obras")) {
    const ativas = obras.filter((o) => o.status === "em_andamento").length;
    return `Você possui ${obras.length} obra(s) cadastrada(s).\n• ${ativas} em andamento\n• ${obras.filter((o) => o.status === "concluida").length} concluída(s)\n• ${obras.filter((o) => o.status === "pausada").length} pausada(s)`;
  }

  if (lower.includes("quantos clientes") || lower.includes("quantas clientes")) {
    return `Você possui ${clientes.length} cliente(s) cadastrado(s).`;
  }

  // OS pendentes
  if (lower.includes("os") && (lower.includes("pendente") || lower.includes("aberta") || lower.includes("urgente"))) {
    const abertas = ordens.filter((o) => o.status === "aberta" || o.status === "em_execucao");
    const urgentes = abertas.filter((o) => o.prioridade === "urgente");
    if (abertas.length === 0) return "Não há ordens de serviço pendentes.";
    return `Existem ${abertas.length} OS em aberto:\n${abertas.map((o) => `• ${o.titulo} (${o.prioridade}) — ${o.responsavel || "sem responsável"}`).join("\n")}\n\n${urgentes.length > 0 ? `⚠️ ${urgentes.length} são urgentes!` : "Nenhuma urgente."}`;
  }

  // Resumo geral
  if (lower.includes("resumo") || lower.includes("status geral") || lower.includes("como está") || lower.includes("visão geral")) {
    return gerarResumoSemanal();
  }

  return `Desculpe, não entendi sua pergunta. Tente perguntar sobre:\n\n• "Quanto gastou na obra [nome]?"\n• "Qual obra está mais atrasada?"\n• "Qual obra tem maior lucro?"\n• "Total de despesas"\n• "Quantas obras tenho?"\n• "OS pendentes"\n• "Resumo geral"`;
}

export default function IAPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>("diario");
  const { toast } = useToast();

  // Diário state
  const [diarioTexto, setDiarioTexto] = React.useState("");
  const [relatorioGerado, setRelatorioGerado] = React.useState("");
  const [gerandoRelatorio, setGerandoRelatorio] = React.useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    { role: "assistant", content: "Olá! Sou o assistente do Smart Obra. Posso ajudar com informações sobre suas obras, despesas, clientes e muito mais. O que gostaria de saber?" },
  ]);
  const [chatInput, setChatInput] = React.useState("");
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Resumo state
  const [resumo, setResumo] = React.useState("");
  const [gerandoResumo, setGerandoResumo] = React.useState(false);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleGerarRelatorio = () => {
    if (!diarioTexto.trim()) {
      toast({ title: "Erro", description: "Escreva algo no diário primeiro", variant: "destructive" });
      return;
    }
    setGerandoRelatorio(true);
    setTimeout(() => {
      const resultado = gerarRelatorioFormal(diarioTexto);
      setRelatorioGerado(resultado.relatorio);
      // Salvar no storage
      diariosStorage.create({
        obraId: "",
        data: new Date().toISOString().split("T")[0],
        textoInformal: diarioTexto,
        relatorioFormal: resultado.relatorio,
        clima: resultado.clima,
        trabalhadores: resultado.trabalhadores,
        atividades: resultado.atividades,
      });
      setGerandoRelatorio(false);
      toast({ title: "Relatório gerado!", description: "Diário salvo com sucesso", variant: "success" });
    }, 1500);
  };

  const handleGerarResumo = () => {
    setGerandoResumo(true);
    setTimeout(() => {
      setResumo(gerarResumoSemanal());
      setGerandoResumo(false);
    }, 1500);
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      const resposta = processarPergunta(userMsg);
      setChatMessages((prev) => [...prev, { role: "assistant", content: resposta }]);
    }, 800);
  };

  const tabs = [
    { id: "diario" as Tab, label: "Diário Inteligente", icon: BookOpen },
    { id: "resumo" as Tab, label: "Resumo Semanal", icon: BarChart3 },
    { id: "chat" as Tab, label: "Chat da Obra", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="h-7 w-7 text-purple-600" />
          Inteligência Artificial
        </h1>
        <p className="text-sm text-gray-500 mt-1">Ferramentas inteligentes para sua obra</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap min-h-[44px]",
              activeTab === tab.id
                ? "bg-purple-100 text-purple-700"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Diário Inteligente */}
      {activeTab === "diario" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Registro Informal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Escreva de forma livre o que aconteceu hoje na obra. A IA vai transformar em um relatório formal.
              </p>
              <Textarea
                value={diarioTexto}
                onChange={(e) => setDiarioTexto(e.target.value)}
                placeholder="Ex: Hoje estava sol forte, 8 trabalhadores no canteiro. Fizemos concretagem da laje do segundo andar e começamos o reboco na sala..."
                className="min-h-[200px]"
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setDiarioTexto((prev) => prev + " tempo ensolarado")}>
                  <CloudSun className="mr-1 h-3 w-3" /> Clima
                </Badge>
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setDiarioTexto((prev) => prev + " trabalhadores presentes")}>
                  <Users className="mr-1 h-3 w-3" /> Efetivo
                </Badge>
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setDiarioTexto((prev) => prev + " atividade realizada: ")}>
                  <Hammer className="mr-1 h-3 w-3" /> Atividade
                </Badge>
              </div>
              <Button onClick={handleGerarRelatorio} disabled={gerandoRelatorio} className="w-full bg-purple-600 hover:bg-purple-700">
                {gerandoRelatorio ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Relatório Formal</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Relatório Gerado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatorioGerado ? (
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 rounded-lg p-4 border max-h-[400px] overflow-y-auto font-mono text-gray-800">
                  {relatorioGerado}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-8 w-8 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">O relatório aparecerá aqui após ser gerado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo Semanal */}
      {activeTab === "resumo" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Resumo dos Últimos 7 Dias
              </CardTitle>
              <Button onClick={handleGerarResumo} disabled={gerandoResumo} className="bg-purple-600 hover:bg-purple-700">
                {gerandoResumo ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar Resumo</>}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {resumo ? (
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 rounded-lg p-4 border font-mono text-gray-800">
                {resumo}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-8 w-8 text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Clique em &quot;Gerar Resumo&quot; para ver o resumo semanal baseado nos seus dados</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chat da Obra */}
      {activeTab === "chat" && (
        <Card className="flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Chat da Obra
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </CardContent>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pergunte sobre suas obras, despesas, clientes..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                className="flex-1"
              />
              <Button onClick={handleChat} className="bg-purple-600 hover:bg-purple-700 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => { setChatInput("Quanto gastei no total?"); }} className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-gray-600 transition-colors">Total de gastos</button>
              <button onClick={() => { setChatInput("Qual obra está mais atrasada?"); }} className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-gray-600 transition-colors">Obra mais atrasada</button>
              <button onClick={() => { setChatInput("Quantas obras tenho?"); }} className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-gray-600 transition-colors">Quantidade de obras</button>
              <button onClick={() => { setChatInput("Resumo geral"); }} className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-gray-600 transition-colors">Resumo geral</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}