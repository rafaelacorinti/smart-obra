import { createClient } from "@/lib/supabase/client";

// ---- Types ----

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
  obra_id: string;
  status: string;
  capitulos: CapituloOrcamento[];
  subtotal: number;
  valor_bdi: number;
  valor_encargos?: number;
  valor_contingencia?: number;
  total: number;
  fator_regional?: number;
  bdi?: number;
  contingencia?: number;
}

interface SyncLancamento {
  id: string;
  obra_id?: string;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: string;
  fornecedor_cliente?: string;
}

interface CentroCustoItem {
  obra_id: string;
  centro: string;
  orcado: number;
  realizado: number;
}

interface OrcadoRealizadoItem {
  obra_id: string;
  categoria: string;
  planejado: number;
  realizado: number;
}

// ---- Category mappings ----

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

// ---- Helpers ----

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

function computeCentroCustos(
  obraId: string,
  orcamentos: SyncOrcamento[],
  lancamentos: SyncLancamento[]
): CentroCustoItem[] {
  const obraOrcamentos = orcamentos.filter((o) => o.obra_id === obraId);
  const obraLancamentos = lancamentos.filter(
    (l) => l.obra_id === obraId && l.tipo === "DESPESA" && l.status === "PAGO"
  );

  const centroOrcado: Record<string, number> = {};
  obraOrcamentos.forEach((orc) => {
    const fator = orc.fator_regional || 1;
    (orc.capitulos || []).forEach((cap) => {
      const subtotalCap = cap.itens.reduce(
        (s, item) => s + item.quantidade * item.precoUnitario, 0
      );
      const nome = cap.nome;
      centroOrcado[nome] = (centroOrcado[nome] || 0) + subtotalCap * fator;
    });
  });

  const centroRealizado: Record<string, number> = {};
  obraLancamentos.forEach((l) => {
    const centro = FINANCEIRO_TO_CENTRO_CUSTO[l.categoria] || "Outros";
    centroRealizado[centro] = (centroRealizado[centro] || 0) + l.valor;
  });

  const allCentros = new Set([...Object.keys(centroOrcado), ...Object.keys(centroRealizado)]);
  return Array.from(allCentros).map((centro) => ({
    obra_id: obraId,
    centro,
    orcado: Math.round((centroOrcado[centro] || 0) * 100) / 100,
    realizado: Math.round((centroRealizado[centro] || 0) * 100) / 100,
  }));
}

function computeOrcadoRealizado(
  obraId: string,
  orcamentos: SyncOrcamento[],
  lancamentos: SyncLancamento[]
): OrcadoRealizadoItem[] {
  const obraOrcamentos = orcamentos.filter((o) => o.obra_id === obraId);
  const obraLancamentos = lancamentos.filter(
    (l) => l.obra_id === obraId && l.tipo === "DESPESA" && l.status === "PAGO"
  );

  const planejado: Record<string, number> = {};
  CATEGORIAS_ORCADO_REALIZADO.forEach((cat) => { planejado[cat] = 0; });

  obraOrcamentos.forEach((orc) => {
    const fator = orc.fator_regional || 1;
    const breakdown = computeOrcamentoCostBreakdown(orc);
    planejado["Materiais"] += breakdown.custoMateriais * fator;
    planejado["Mao de Obra"] += breakdown.custoMaoDeObra * fator;
    planejado["Equipamentos"] += breakdown.custoEquipamentos * fator;

    const valorEncargos = orc.valor_encargos || 0;
    const valorBdi = orc.valor_bdi || 0;
    const valorContingencia = orc.valor_contingencia || 0;
    planejado["Administracao"] += valorEncargos + valorBdi + valorContingencia;
  });

  const realizado: Record<string, number> = {};
  CATEGORIAS_ORCADO_REALIZADO.forEach((cat) => { realizado[cat] = 0; });

  obraLancamentos.forEach((l) => {
    const cat = FINANCEIRO_TO_ORCADO_REALIZADO[l.categoria] || "Outros";
    realizado[cat] = (realizado[cat] || 0) + l.valor;
  });

  return CATEGORIAS_ORCADO_REALIZADO.map((cat) => ({
    obra_id: obraId,
    categoria: cat,
    planejado: Math.round((planejado[cat] || 0) * 100) / 100,
    realizado: Math.round((realizado[cat] || 0) * 100) / 100,
  }));
}

// ---- Public API ----

export async function syncAllForObra(obraId: string): Promise<void> {
  if (!obraId) return;

  const supabase = createClient();

  // Fetch data from DB
  const [orcRes, lancRes] = await Promise.all([
    supabase.from("orcamentos").select("*").eq("obra_id", obraId),
    supabase.from("lancamentos").select("*"),
  ]);

  const orcamentos = (orcRes.data || []) as unknown as SyncOrcamento[];
  const lancamentos = (lancRes.data || []) as unknown as SyncLancamento[];

  // Compute
  const centros = computeCentroCustos(obraId, orcamentos, lancamentos);
  const orcadoRealizado = computeOrcadoRealizado(obraId, orcamentos, lancamentos);

  // Delete existing for this obra, then insert new
  await supabase.from("centro_custos").delete().eq("obra_id", obraId);
  if (centros.length > 0) {
    await supabase.from("centro_custos").insert(centros);
  }

  await supabase.from("orcado_realizado").delete().eq("obra_id", obraId);
  if (orcadoRealizado.length > 0) {
    await supabase.from("orcado_realizado").insert(orcadoRealizado);
  }
}

export async function syncAll(): Promise<void> {
  const supabase = createClient();

  // Get all obra IDs from multiple sources
  const [obrasRes, orcRes, lancRes] = await Promise.all([
    supabase.from("obras").select("id"),
    supabase.from("orcamentos").select("obra_id"),
    supabase.from("lancamentos").select("obra_id"),
  ]);

  const obraIds = new Set<string>();
  (obrasRes.data || []).forEach((o: any) => obraIds.add(o.id));
  (orcRes.data || []).forEach((o: any) => { if (o.obra_id) obraIds.add(o.obra_id); });
  (lancRes.data || []).forEach((l: any) => { if (l.obra_id) obraIds.add(l.obra_id); });

  // Sync each obra
  for (const obraId of Array.from(obraIds)) {
    await syncAllForObra(obraId);
  }
}

