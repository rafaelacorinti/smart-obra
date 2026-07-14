// Conversor: Quantitativos extraidos do DXF -> formato de capitulos de orcamento
// Reutiliza as tabelas de precos SINAPI/TCPO ja embarcadas no projeto

import { sinapiData } from "./sinapi-data";
import { tcpoData } from "./tcpo-data";
import type { ResultadoQuantitativos } from "./dxf-quantitativos";

interface ItemOrcamentoGerado {
  id: string;
  codigo: string;
  descricao: string;
  fonte: "SINAPI" | "SICRO" | "TCPO";
  unidade: string;
  quantidade: number;
  precoUnitario: number;
}

interface CapituloGerado {
  id: string;
  nome: string;
  itens: ItemOrcamentoGerado[];
}

function genId(): string {
  return "cq_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 6);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buscarSinapi(codigo: string, uf: string): { descricao: string; preco: number; unidade: string } | null {
  const item = sinapiData.find((i: any) => i.codigo === codigo);
  if (!item) return null;
  const preco = item.precos[uf] || item.precos["SP"] || 0;
  return { descricao: item.descricao, preco, unidade: item.unidade };
}

function buscarTcpo(codigo: string, uf: string): { descricao: string; preco: number; unidade: string } | null {
  const item = tcpoData.find((i: any) => i.codigo === codigo);
  if (!item) return null;
  const preco = item.precos[uf] || item.precos["SP"] || 0;
  return { descricao: item.descricao, preco, unidade: item.unidade };
}

function buscarMelhorPreco(
  codigoSinapi: string,
  codigoTcpo: string,
  uf: string,
  descFallback: string,
  unidade: string
): { fonte: "SINAPI" | "TCPO"; codigo: string; descricao: string; preco: number; unidade: string } {
  const sinapi = buscarSinapi(codigoSinapi, uf);
  if (sinapi && sinapi.preco > 0) {
    return { fonte: "SINAPI", codigo: codigoSinapi, descricao: sinapi.descricao, preco: sinapi.preco, unidade: sinapi.unidade };
  }
  const tcpo = buscarTcpo(codigoTcpo, uf);
  if (tcpo && tcpo.preco > 0) {
    return { fonte: "TCPO", codigo: codigoTcpo, descricao: tcpo.descricao, preco: tcpo.preco, unidade: tcpo.unidade };
  }
  const fallbackItem = sinapiData.find((i: any) => i.unidade === unidade);
  const fallbackPreco = fallbackItem ? (fallbackItem.precos[uf] || fallbackItem.precos["SP"] || 100) : 100;
  return { fonte: "SINAPI", codigo: codigoSinapi || "00000", descricao: descFallback, preco: fallbackPreco, unidade };
}

// Mapeamento categoria quantitativo -> itens de orcamento SINAPI/TCPO
interface MapeamentoCategoria {
  capitulo: string;
  codigoSinapi: string;
  codigoTcpo: string;
  descFallback: string;
  unidade: string;
}

const MAPEAMENTO_CATEGORIAS: Record<string, MapeamentoCategoria[]> = {
  Alvenaria: [
    {
      capitulo: "Alvenaria",
      codigoSinapi: "87504",
      codigoTcpo: "04010.1.1.1",
      descFallback: "Alvenaria de vedacao com bloco ceramico 14x19x29cm",
      unidade: "m2",
    },
  ],
  Esquadrias_Porta: [
    {
      capitulo: "Esquadrias",
      codigoSinapi: "91312",
      codigoTcpo: "12010.1.1.1",
      descFallback: "Porta interna de madeira completa 80x210cm",
      unidade: "un",
    },
  ],
  Esquadrias_Janela: [
    {
      capitulo: "Esquadrias",
      codigoSinapi: "91318",
      codigoTcpo: "12020.1.1.1",
      descFallback: "Janela de aluminio com vidro",
      unidade: "un",
    },
  ],
  Pisos: [
    {
      capitulo: "Pisos",
      codigoSinapi: "87264",
      codigoTcpo: "11010.1.1.1",
      descFallback: "Piso ceramico assentado com argamassa",
      unidade: "m2",
    },
  ],
  Hidrossanitario: [
    {
      capitulo: "Inst. Hidrossanitarias",
      codigoSinapi: "89709",
      codigoTcpo: "07010.1.1.1",
      descFallback: "Louca sanitaria / peca hidraulica instalada",
      unidade: "un",
    },
  ],
  Estrutura: [
    {
      capitulo: "Estrutura",
      codigoSinapi: "87530",
      codigoTcpo: "03020.1.1.1",
      descFallback: "Pilar de concreto armado",
      unidade: "un",
    },
  ],
};

export function converterQuantitativosParaOrcamento(
  resultado: ResultadoQuantitativos,
  uf: string,
  nomeArquivo: string
): { capitulos: CapituloGerado[]; subtotal: number } {
  const capitulosMap = new Map<string, ItemOrcamentoGerado[]>();

  resultado.itens.forEach((item) => {
    let categoriaMapa = item.categoria as string;

    // Diferenciar portas de janelas
    if (item.categoria === "Esquadrias") {
      if (item.item.toLowerCase().includes("porta")) {
        categoriaMapa = "Esquadrias_Porta";
      } else {
        categoriaMapa = "Esquadrias_Janela";
      }
    }

    // Para Alvenaria, usar apenas o item de area (m2), nao comprimento
    if (item.categoria === "Alvenaria" && item.unidade === "m") {
      return; // Pular comprimento linear, usar somente area
    }

    const mapeamentos = MAPEAMENTO_CATEGORIAS[categoriaMapa];
    if (!mapeamentos || mapeamentos.length === 0) return;

    const map = mapeamentos[0];
    const melhor = buscarMelhorPreco(map.codigoSinapi, map.codigoTcpo, uf, map.descFallback, map.unidade);

    const itemOrc: ItemOrcamentoGerado = {
      id: genId(),
      codigo: melhor.codigo,
      descricao: `${item.item} - ${melhor.descricao}`,
      fonte: melhor.fonte,
      unidade: item.unidade || melhor.unidade,
      quantidade: item.quantidade,
      precoUnitario: melhor.preco,
    };

    const capNome = map.capitulo;
    if (!capitulosMap.has(capNome)) {
      capitulosMap.set(capNome, []);
    }
    capitulosMap.get(capNome)!.push(itemOrc);
  });

  const capitulos: CapituloGerado[] = [];
  let subtotal = 0;

  capitulosMap.forEach((itens, nome) => {
    capitulos.push({ id: genId(), nome, itens });
    itens.forEach((i) => {
      subtotal += round2(i.quantidade * i.precoUnitario);
    });
  });

  return { capitulos, subtotal: round2(subtotal) };
}