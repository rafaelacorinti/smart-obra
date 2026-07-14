// Motor de Extracao de Quantitativos Reais de Arquivos DXF por Camadas
// Usa dxf-parser (npm) para parsing robusto e extrai quantitativos por categoria

import DxfParser from "dxf-parser";

// === MAPA CONFIGURAVEL DE LAYERS ===

export const LAYER_MAP_DEFAULT: Record<string, string[]> = {
  PAREDES: [
    "A-WALL", "A-WALL-FULL", "A-WALL-INT", "A-WALL-EXT",
    "WALL", "PAREDES", "ALVENARIA", "PAREDE",
    "A-WALL-____", "WALLS",
  ],
  PORTAS: [
    "A-DOOR", "DOOR", "PORTAS", "PORTA",
    "ESQUADRIA-PORTA", "A-DOOR-____",
  ],
  JANELAS: [
    "A-GLAZ", "A-GLAZ-SILL", "GLAZ", "WINDOW",
    "JANELAS", "JANELA", "ESQUADRIA-JANELA",
  ],
  AREA_PISO: [
    "A-AREA-IDEN", "A-AREA", "A-FLOR", "PISO",
    "FLOOR", "A-FLOR-____", "AREA",
  ],
  HIDROSSANITARIO: [
    "P-SANR-FIXT", "PLUMBING", "HIDRAULICA", "HIDRO",
    "SANITARY", "P-FIXT", "HIDR", "LOUÇAS",
  ],
  ESTRUTURA: [
    "S-COLS", "S-BEAM", "ESTRUTURA", "PILARES",
    "COLUMNS", "PILAR", "VIGA", "S-COLS-____",
  ],
  HACHURA_IGNORAR: [
    "PATT", "HATCH", "A-WALL-PATT", "HACHURA",
    "A-FLOR-PATT", "A-AREA-PATT",
  ],
};

// === INTERFACES ===

export interface ItemQuantitativo {
  id: string;
  categoria: "Alvenaria" | "Esquadrias" | "Pisos" | "Hidrossanitario" | "Estrutura";
  item: string;
  quantidade: number;
  unidade: string;
  observacao: string;
}

export interface ResultadoQuantitativos {
  itens: ItemQuantitativo[];
  peDireito: number;
  layersEncontrados: string[];
  layersMapeados: Record<string, string>;
  resumo: {
    comprimentoParedes: number;
    areaParedes: number;
    totalPortas: number;
    totalJanelas: number;
    areaPiso: number;
    totalLoucas: number;
    totalPilares: number;
  };
}

// === HELPERS ===

function generateItemId(): string {
  return "qi_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 6);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function limparNomeBloco(nome: string): string {
  // Remove suffixes like -PR01, _REV02, _A1, -DET01
  return nome
    .replace(/[-_](PR|REV|DET|FL|SH)\d{0,3}$/i, "")
    .replace(/[-_][A-Z]\d{1,2}$/i, "")
    .replace(/\s*\(.*\)\s*$/, "")
    .trim();
}

function matchLayer(entityLayer: string, patterns: string[]): boolean {
  if (!entityLayer) return false;
  const upper = entityLayer.toUpperCase().trim();
  for (const pattern of patterns) {
    const p = pattern.toUpperCase().trim();
    if (p.includes("____")) {
      // Wildcard: A-WALL-____ matches A-WALL-INT, A-WALL-EXT, etc.
      const prefix = p.replace("____", "");
      if (upper.startsWith(prefix)) return true;
    } else {
      if (upper === p) return true;
    }
  }
  return false;
}

function isIgnoredLayer(entityLayer: string, layerMap: Record<string, string[]>): boolean {
  return matchLayer(entityLayer, layerMap.HACHURA_IGNORAR || []);
}

function classifyLayer(entityLayer: string, layerMap: Record<string, string[]>): string | null {
  if (!entityLayer) return null;
  for (const [categoria, patterns] of Object.entries(layerMap)) {
    if (categoria === "HACHURA_IGNORAR") continue;
    if (matchLayer(entityLayer, patterns)) return categoria;
  }
  return null;
}

function calcularComprimentoLinha(v1: any, v2: any): number {
  const dx = (v2.x || 0) - (v1.x || 0);
  const dy = (v2.y || 0) - (v1.y || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function calcularComprimentoPolyline(vertices: any[]): number {
  if (!vertices || vertices.length < 2) return 0;
  let comprimento = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    comprimento += calcularComprimentoLinha(vertices[i], vertices[i + 1]);
  }
  return comprimento;
}

function calcularAreaPolyline(vertices: any[]): number {
  if (!vertices || vertices.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += (vertices[i].x || 0) * (vertices[j].y || 0);
    area -= (vertices[j].x || 0) * (vertices[i].y || 0);
  }
  return Math.abs(area) / 2;
}

function extrairDimensoesDoNome(nome: string): { largura: number; altura: number } | null {
  // Patterns: P80x210, J120x150, 80x210, 0.80x2.10
  const match = nome.match(/(\d+(?:[.,]\d+)?)\s*[xX]\s*(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  let w = parseFloat(match[1].replace(",", "."));
  let h = parseFloat(match[2].replace(",", "."));
  // If values seem to be in cm (>10), convert to m
  if (w > 10) w = w / 100;
  if (h > 10) h = h / 100;
  return { largura: w, altura: h };
}

function identificarTipoLouca(nome: string): string {
  const upper = nome.toUpperCase();
  if (/VASO|WC|BACIA|TOILET/.test(upper)) return "Vaso sanitario";
  if (/CUBA|LAVATORIO|SINK|PIA/.test(upper)) return "Cuba/Lavatorio";
  if (/TANQUE|LAUNDRY/.test(upper)) return "Tanque";
  if (/CHUVEIRO|SHOWER/.test(upper)) return "Chuveiro";
  if (/BANHEIRA|BATH/.test(upper)) return "Banheira";
  if (/BIDÊ|BIDET/.test(upper)) return "Bide";
  return "Louca sanitaria";
}

// === FUNCAO PRINCIPAL DE EXTRACAO ===

export function extrairQuantitativos(
  dxfContent: string,
  peDireito: number = 2.80,
  layerMapCustom?: Record<string, string[]>
): ResultadoQuantitativos {
  const layerMap = layerMapCustom || LAYER_MAP_DEFAULT;
  const parser = new DxfParser();
  let dxf: any;

  try {
    dxf = parser.parseSync(dxfContent);
  } catch (err) {
    // Fallback: retornar resultado vazio se parsing falhar
    return {
      itens: [],
      peDireito,
      layersEncontrados: [],
      layersMapeados: {},
      resumo: {
        comprimentoParedes: 0,
        areaParedes: 0,
        totalPortas: 0,
        totalJanelas: 0,
        areaPiso: 0,
        totalLoucas: 0,
        totalPilares: 0,
      },
    };
  }

  if (!dxf || !dxf.entities) {
    return {
      itens: [],
      peDireito,
      layersEncontrados: [],
      layersMapeados: {},
      resumo: {
        comprimentoParedes: 0,
        areaParedes: 0,
        totalPortas: 0,
        totalJanelas: 0,
        areaPiso: 0,
        totalLoucas: 0,
        totalPilares: 0,
      },
    };
  }

  const entities = dxf.entities as any[];
  const itens: ItemQuantitativo[] = [];

  // Coletar todos os layers encontrados no arquivo
  const layerSet = new Set<string>();
  entities.forEach((e: any) => {
    if (e.layer) layerSet.add(e.layer);
  });
  const layersEncontrados = Array.from(layerSet).sort();

  // Mapeamento: layer -> categoria
  const layersMapeados: Record<string, string> = {};
  layersEncontrados.forEach((layer) => {
    const cat = classifyLayer(layer, layerMap);
    if (cat) layersMapeados[layer] = cat;
  });

  // Filtrar entidades ignoradas (hachura)
  const entidadesValidas = entities.filter(
    (e: any) => !isIgnoredLayer(e.layer || "", layerMap)
  );

  // --- 1. PAREDES (Alvenaria) ---
  let comprimentoParedes = 0;
  const paredesEntities = entidadesValidas.filter(
    (e: any) => classifyLayer(e.layer || "", layerMap) === "PAREDES"
  );

  paredesEntities.forEach((e: any) => {
    if (e.type === "LINE") {
      const v = e.vertices || [];
      if (v.length >= 2) {
        comprimentoParedes += calcularComprimentoLinha(v[0], v[1]);
      } else if (e.startPoint && e.endPoint) {
        comprimentoParedes += calcularComprimentoLinha(e.startPoint, e.endPoint);
      }
    } else if (e.type === "LWPOLYLINE" || e.type === "POLYLINE") {
      const verts = e.vertices || [];
      comprimentoParedes += calcularComprimentoPolyline(verts);
      // Se for fechada, adicionar o fechamento
      if (e.shape === true || e.closed === true) {
        if (verts.length >= 2) {
          comprimentoParedes += calcularComprimentoLinha(
            verts[verts.length - 1],
            verts[0]
          );
        }
      }
    }
  });

  // Converter para unidade razoavel (DXFs podem estar em mm, cm ou m)
  // Heuristica: se comprimento > 10000, provavelmente em mm
  let fatorConversao = 1;
  if (comprimentoParedes > 100000) {
    fatorConversao = 0.001; // mm -> m
  } else if (comprimentoParedes > 10000) {
    fatorConversao = 0.01; // cm -> m
  }
  comprimentoParedes *= fatorConversao;

  const areaParedes = comprimentoParedes * peDireito;

  if (comprimentoParedes > 0) {
    itens.push({
      id: generateItemId(),
      categoria: "Alvenaria",
      item: "Comprimento linear de paredes",
      quantidade: round2(comprimentoParedes),
      unidade: "m",
      observacao: `Soma de linhas/polilinhas em layers de paredes`,
    });
    itens.push({
      id: generateItemId(),
      categoria: "Alvenaria",
      item: "Area bruta de alvenaria",
      quantidade: round2(areaParedes),
      unidade: "m2",
      observacao: `Comprimento (${round2(comprimentoParedes)}m) x pe-direito (${peDireito}m)`,
    });
  }

  // --- 2. ESQUADRIAS (Portas e Janelas) ---
  const portasEntities = entidadesValidas.filter(
    (e: any) =>
      e.type === "INSERT" && classifyLayer(e.layer || "", layerMap) === "PORTAS"
  );
  const janelasEntities = entidadesValidas.filter(
    (e: any) =>
      e.type === "INSERT" &&
      classifyLayer(e.layer || "", layerMap) === "JANELAS"
  );

  // Agrupar portas por nome de bloco
  const portasPorTipo = new Map<string, number>();
  portasEntities.forEach((e: any) => {
    const nome = limparNomeBloco(e.name || e.blockName || "Porta");
    portasPorTipo.set(nome, (portasPorTipo.get(nome) || 0) + 1);
  });

  let totalPortas = 0;
  portasPorTipo.forEach((qtd, nome) => {
    totalPortas += qtd;
    const dims = extrairDimensoesDoNome(nome);
    const obsStr = dims
      ? `${round2(dims.largura * 100)}x${round2(dims.altura * 100)}cm`
      : "Dimensoes no nome do bloco";
    itens.push({
      id: generateItemId(),
      categoria: "Esquadrias",
      item: `Porta - ${nome}`,
      quantidade: qtd,
      unidade: "un",
      observacao: obsStr,
    });
  });

  // Agrupar janelas por nome de bloco
  const janelasPorTipo = new Map<string, number>();
  janelasEntities.forEach((e: any) => {
    const nome = limparNomeBloco(e.name || e.blockName || "Janela");
    janelasPorTipo.set(nome, (janelasPorTipo.get(nome) || 0) + 1);
  });

  let totalJanelas = 0;
  janelasPorTipo.forEach((qtd, nome) => {
    totalJanelas += qtd;
    const dims = extrairDimensoesDoNome(nome);
    const obsStr = dims
      ? `${round2(dims.largura * 100)}x${round2(dims.altura * 100)}cm`
      : "Dimensoes no nome do bloco";
    itens.push({
      id: generateItemId(),
      categoria: "Esquadrias",
      item: `Janela - ${nome}`,
      quantidade: qtd,
      unidade: "un",
      observacao: obsStr,
    });
  });

  // --- 3. AREAS DE PISO ---
  let areaPiso = 0;
  const pisoEntities = entidadesValidas.filter(
    (e: any) => classifyLayer(e.layer || "", layerMap) === "AREA_PISO"
  );

  // Prioridade 1: Textos com valores em m2
  const textosPiso = pisoEntities.filter(
    (e: any) => e.type === "TEXT" || e.type === "MTEXT"
  );
  const areasDoTexto: { nome: string; area: number }[] = [];
  const areaRegex = /(\d+[.,]\d+)\s*m[²2]/i;

  textosPiso.forEach((e: any) => {
    const texto = e.text || "";
    const match = texto.match(areaRegex);
    if (match) {
      const valor = parseFloat(match[1].replace(",", "."));
      if (valor > 0.5 && valor < 10000) {
        areasDoTexto.push({ nome: texto.split(/\d/)[0].trim() || "Ambiente", area: valor });
        areaPiso += valor;
      }
    }
  });

  if (areasDoTexto.length > 0) {
    areasDoTexto.forEach((a) => {
      itens.push({
        id: generateItemId(),
        categoria: "Pisos",
        item: `Area - ${a.nome}`,
        quantidade: round2(a.area),
        unidade: "m2",
        observacao: "Extraido de texto no DXF",
      });
    });
  } else {
    // Fallback: calcular de polilinhas fechadas
    const polysPiso = pisoEntities.filter(
      (e: any) =>
        (e.type === "LWPOLYLINE" || e.type === "POLYLINE") &&
        (e.shape === true || e.closed === true) &&
        e.vertices &&
        e.vertices.length >= 3
    );
    polysPiso.forEach((e: any, idx: number) => {
      let a = calcularAreaPolyline(e.vertices);
      a *= fatorConversao * fatorConversao; // converter area (m2)
      if (a > 0.5 && a < 100000) {
        areaPiso += a;
        itens.push({
          id: generateItemId(),
          categoria: "Pisos",
          item: `Area piso - Ambiente ${idx + 1}`,
          quantidade: round2(a),
          unidade: "m2",
          observacao: `Calculado de polilinha fechada em layer ${e.layer || "?"}`,
        });
      }
    });
  }

  if (areaPiso > 0 && areasDoTexto.length === 0) {
    // Nao duplicar se ja tem itens individuais
  }

  // --- 4. HIDROSSANITARIO / LOUCAS ---
  const hidroEntities = entidadesValidas.filter(
    (e: any) =>
      e.type === "INSERT" &&
      classifyLayer(e.layer || "", layerMap) === "HIDROSSANITARIO"
  );

  const loucasPorTipo = new Map<string, number>();
  hidroEntities.forEach((e: any) => {
    const nomeRaw = e.name || e.blockName || "Peca sanitaria";
    const nome = limparNomeBloco(nomeRaw);
    const tipo = identificarTipoLouca(nome);
    const chave = `${tipo} (${nome})`;
    loucasPorTipo.set(chave, (loucasPorTipo.get(chave) || 0) + 1);
  });

  let totalLoucas = 0;
  loucasPorTipo.forEach((qtd, nome) => {
    totalLoucas += qtd;
    itens.push({
      id: generateItemId(),
      categoria: "Hidrossanitario",
      item: nome,
      quantidade: qtd,
      unidade: "un",
      observacao: "Bloco identificado no DXF",
    });
  });

  // --- 5. ESTRUTURA (Pilares) ---
  const estruturaEntities = entidadesValidas.filter(
    (e: any) =>
      e.type === "INSERT" &&
      classifyLayer(e.layer || "", layerMap) === "ESTRUTURA"
  );

  const pilaresPorTipo = new Map<string, number>();
  estruturaEntities.forEach((e: any) => {
    const nome = limparNomeBloco(e.name || e.blockName || "Pilar");
    pilaresPorTipo.set(nome, (pilaresPorTipo.get(nome) || 0) + 1);
  });

  let totalPilares = 0;
  pilaresPorTipo.forEach((qtd, nome) => {
    totalPilares += qtd;
    itens.push({
      id: generateItemId(),
      categoria: "Estrutura",
      item: `Pilar - ${nome}`,
      quantidade: qtd,
      unidade: "un",
      observacao: "Bloco de pilar identificado no DXF",
    });
  });

  return {
    itens,
    peDireito,
    layersEncontrados,
    layersMapeados,
    resumo: {
      comprimentoParedes: round2(comprimentoParedes),
      areaParedes: round2(areaParedes),
      totalPortas,
      totalJanelas,
      areaPiso: round2(areaPiso),
      totalLoucas,
      totalPilares,
    },
  };
}