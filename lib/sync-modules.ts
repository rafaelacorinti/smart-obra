// Synchronization layer: derives Centro de Custos and Orçado x Realizado
// from Orçamentos (budget) and Financeiro (actual expenses).

// ─── Types ───────────────────────────────────────────────────────────────────

interface ComposicaoDetalhe {
  tipo: "material" | "maoDeObra" | "equipamento";
  descricao: string;
  unidade: string;
  coeficiente: number;
  precoUnitario: number;
}

interface ItemOrcamento {
  id: string;
  codigo: string;
  descricao: string;
  fonte: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  composicao?: ComposicaoDetalhe[];
}

interface CapituloOrcamento {
  id: string;
  nome: string;
  itens: ItemOrcamento[];
}

interface SyncOrcamento {
  id: string;
  obraId: string;
  status: string;
  capitulos: CapituloOrcamento[];
  subtotal: number;
  valorBdi: number;
  valorEncargos?: number;
  valorContingencia?: number;
  total: number;
  fatorRegional?: number;
  bdi?: number;
  contingencia?: number;
  [key: string]: any;
}

interface SyncLancamento {
  id: string;
  obraId?: string;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: string;
  fornecedorCliente?: string;
  [key: string]: any;
}

interface CentroCustoItem {
  obraId: string;
  centro: string;
  orcado: number;
  realizado: number;
}

interface DespesaDetalhe {
  id: string;
  obraId: string;
  centro: string;
  descricao: string;
  valor: number;
  data: string;
  fornecedor: string;
}

interface OrcadoRealizadoItem {
  obraId: string;
  categoria: string;
  planejado: number;
  realizado: number;
}

interface SyncObra {
  id: string;
  [key: string]: any;
}

// ─── Category mappings ───────────────────────────────────────────────────────

const FINANCEIRO_TO_ORCADO_REALIZADO: Record<string, string> = {
  "Material": "Materiais",
  "Mao de obra": "Mao de Obra",
  "Equipamento": "Equipamentos",
  "Combustivel": "Terceiros",
  "Alimentacao": "Terceiros",
  "Transporte": "Terceiros",
  "Projeto": "Terceiros",
  "Topografia": "Terceiros",
  "Impostos": "Administracao",
  "Aluguel": "Administracao",
  "Manutencao": "Administracao",
  "Administrativo": "Administracao",
  "Outros": "Outros",
};

const FINANCEIRO_TO_CENTRO_CUSTO: Record<string, string> = {
  "Material": "Materiais",
  "Mao de obra": "Mao de Obra",
  "Equipamento": "Equipamentos",
  "Combustivel": "Equipamentos",
  "Alimentacao": "Administracao",
  "Transporte": "Equipamentos",
  "Projeto": "Administracao",
  "Topografia": "Administracao",
  "Impostos": "Administracao",
  "Aluguel": "Administracao",
  "Manutencao": "Administracao",
  "Administrativo": "Administracao",
  "Outros": "Outros",
};

const CATEGORIAS_ORCADO_REALIZADO = [
  "Materiais", "Mao de Obra", "Equipamentos", "Terceiros", "Administracao", "Outros",
];

// ─── Storage keys ────────────────────────────────────────────────────────────

const ORCAMENTOS_KEY = "smart-obra-orcamentos";
const LANCAMENTOS_KEY = "smart-obra-lancamentos";
const CENTRO_CUSTOS_KEY = "smart-obra-centro-custos";
const ORCADO_REALIZADO_KEY = "smart-obra-orcado-realizado";
const OBRAS_KEY = "smart-obra-obras";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, data: any): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function getOrcamentos(): SyncOrcamento[] {
  return readStorage<SyncOrcamento[]>(ORCAMENTOS_KEY) || [];
}

function getLancamentos(): SyncLancamento[] {
  return readStorage<SyncLancamento[]>(LANCAMENTOS_KEY) || [];
}

function getObras(): SyncObra[] {
  return readStorage<SyncObra[]>(OBRAS_KEY) || [];
}

// ─── Compute budget breakdown from an orcamento ─────────────────────────────

function computeOrcamentoCostBreakdown(orc: SyncOrcamento) {
  let custoMateriais = 0;
  let custoMaoDeObra = 0;
  let custoEquipamentos = 0;

  (orc.capitulos || []).forEach((cap) => {
    (cap.itens || []).forEach((item) => {
      if (item.composicao && item.composicao.length > 0) {
        item.composicao.forEach((c) => {
          const valor = c.coeficiente * c.precoUnitario * item.quantidade;
          if (c.tipo === "material") custoMateriais += valor;
          else if (c.tipo === "maoDeObra") custoMaoDeObra += valor;
          else if (c.tipo === "equipamento") custoEquipamentos += valor;
        });
      } else {
        const total = item.quantidade * item.precoUnitario;
        custoMateriais += total * 0.5;
        custoMaoDeObra += total * 0.35;
        custoEquipamentos += total * 0.15;
      }
    });
  });

  return { custoMateriais, custoMaoDeObra, custoEquipamentos };
}

// ─── Sync Centro de Custos for a single obra ────────────────────────────────

function syncCentroCustosForObra(
  obraId: string,
  orcamentos: SyncOrcamento[],
  lancamentos: SyncLancamento[]
): { centros: CentroCustoItem[]; despesas: DespesaDetalhe[] } {
  const obraOrcamentos = orcamentos.filter((o) => o.obraId === obraId);
  const obraLancamentos = lancamentos.filter(
    (l) => l.obraId === obraId && l.tipo === "DESPESA" && l.status === "PAGO"
  );

  const centroOrcado: Record<string, number> = {};
  obraOrcamentos.forEach((orc) => {
    const fator = orc.fatorRegional || 1;
    (orc.capitulos || []).forEach((cap) => {
      const subtotalCap = cap.itens.reduce(
        (s, item) => s + item.quantidade * item.precoUnitario, 0
      );
      const nome = cap.nome;
      centroOrcado[nome] = (centroOrcado[nome] || 0) + subtotalCap * fator;
    });
  });

  const centroRealizado: Record<string, number> = {};
  const despesas: DespesaDetalhe[] = [];

  obraLancamentos.forEach((l) => {
    const centro = FINANCEIRO_TO_CENTRO_CUSTO[l.categoria] || "Outros";
    centroRealizado[centro] = (centroRealizado[centro] || 0) + l.valor;
    despesas.push({
      id: l.id,
      obraId: obraId,
      centro: centro,
      descricao: l.descricao,
      valor: l.valor,
      data: l.data,
      fornecedor: l.fornecedorCliente || "",
    });
  });

  const allCentros = new Set([...Object.keys(centroOrcado), ...Object.keys(centroRealizado)]);
  const centros: CentroCustoItem[] = Array.from(allCentros).map((centro) => ({
    obraId,
    centro,
    orcado: Math.round((centroOrcado[centro] || 0) * 100) / 100,
    realizado: Math.round((centroRealizado[centro] || 0) * 100) / 100,
  }));

  return { centros, despesas };
}

// ─── Sync Orçado x Realizado for a single obra ─────────────────────────────

function syncOrcadoRealizadoForObra(
  obraId: string,
  orcamentos: SyncOrcamento[],
  lancamentos: SyncLancamento[]
): OrcadoRealizadoItem[] {
  const obraOrcamentos = orcamentos.filter((o) => o.obraId === obraId);
  const obraLancamentos = lancamentos.filter(
    (l) => l.obraId === obraId && l.tipo === "DESPESA" && l.status === "PAGO"
  );

  const planejado: Record<string, number> = {};
  CATEGORIAS_ORCADO_REALIZADO.forEach((cat) => { planejado[cat] = 0; });

  obraOrcamentos.forEach((orc) => {
    const fator = orc.fatorRegional || 1;
    const breakdown = computeOrcamentoCostBreakdown(orc);

    planejado["Materiais"] += breakdown.custoMateriais * fator;
    planejado["Mao de Obra"] += breakdown.custoMaoDeObra * fator;
    planejado["Equipamentos"] += breakdown.custoEquipamentos * fator;

    const valorEncargos = orc.valorEncargos || 0;
    const valorBdi = orc.valorBdi || 0;
    const valorContingencia = orc.valorContingencia || 0;
    planejado["Administracao"] += valorEncargos + valorBdi + valorContingencia;
  });

  const realizado: Record<string, number> = {};
  CATEGORIAS_ORCADO_REALIZADO.forEach((cat) => { realizado[cat] = 0; });

  obraLancamentos.forEach((l) => {
    const cat = FINANCEIRO_TO_ORCADO_REALIZADO[l.categoria] || "Outros";
    realizado[cat] = (realizado[cat] || 0) + l.valor;
  });

  return CATEGORIAS_ORCADO_REALIZADO.map((cat) => ({
    obraId,
    categoria: cat,
    planejado: Math.round((planejado[cat] || 0) * 100) / 100,
    realizado: Math.round((realizado[cat] || 0) * 100) / 100,
  }));
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function syncAllForObra(obraId: string): void {
  if (typeof window === "undefined" || !obraId) return;

  const orcamentos = getOrcamentos();
  const lancamentos = getLancamentos();

  const existingCC = readStorage<{ centros: CentroCustoItem[]; despesas: DespesaDetalhe[] }>(CENTRO_CUSTOS_KEY);
  const otherCentros = (existingCC?.centros || []).filter((c) => c.obraId !== obraId);
  const otherDespesas = (existingCC?.despesas || []).filter((d) => d.obraId !== obraId);

  const { centros: newCentros, despesas: newDespesas } = syncCentroCustosForObra(obraId, orcamentos, lancamentos);

  writeStorage(CENTRO_CUSTOS_KEY, {
    centros: [...otherCentros, ...newCentros],
    despesas: [...otherDespesas, ...newDespesas],
  });

  const existingOR = readStorage<OrcadoRealizadoItem[]>(ORCADO_REALIZADO_KEY) || [];
  const otherOR = existingOR.filter((item) => item.obraId !== obraId);
  const newOR = syncOrcadoRealizadoForObra(obraId, orcamentos, lancamentos);

  writeStorage(ORCADO_REALIZADO_KEY, [...otherOR, ...newOR]);
}

export function syncAll(): void {
  if (typeof window === "undefined") return;

  const obras = getObras();
  const orcamentos = getOrcamentos();
  const lancamentos = getLancamentos();

  const obraIds = new Set<string>();
  obras.forEach((o) => obraIds.add(o.id));
  orcamentos.forEach((o) => { if (o.obraId) obraIds.add(o.obraId); });
  lancamentos.forEach((l) => { if (l.obraId) obraIds.add(l.obraId); });

  const allCentros: CentroCustoItem[] = [];
  const allDespesas: DespesaDetalhe[] = [];
  const allOR: OrcadoRealizadoItem[] = [];

  obraIds.forEach((obraId) => {
    const { centros, despesas } = syncCentroCustosForObra(obraId, orcamentos, lancamentos);
    allCentros.push(...centros);
    allDespesas.push(...despesas);

    const orItems = syncOrcadoRealizadoForObra(obraId, orcamentos, lancamentos);
    allOR.push(...orItems);
  });

  writeStorage(CENTRO_CUSTOS_KEY, { centros: allCentros, despesas: allDespesas });
  writeStorage(ORCADO_REALIZADO_KEY, allOR);
}
