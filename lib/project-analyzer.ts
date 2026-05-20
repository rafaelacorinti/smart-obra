// Motor de Analise de Projetos CAD
// Gera quantitativos realistas usando coeficientes de engenharia

import { sinapiData } from './sinapi-data';
import { tcpoData } from './tcpo-data';

// === TYPES ===

export type TipoElemento = 
  | 'FUNDACAO' | 'ESTRUTURA' | 'ALVENARIA' | 'REVESTIMENTO' 
  | 'PISO' | 'HIDRAULICA' | 'ELETRICA' | 'COBERTURA' 
  | 'ESQUADRIA' | 'PINTURA' | 'MOVIMENTO_TERRA';

export type TipoObra = 'Residencial' | 'Comercial' | 'Industrial' | 'Infraestrutura';
export type PadraoAcabamento = 'Baixo' | 'Medio' | 'Alto' | 'Luxo';

export interface ConfigAnalise {
  uf: string;
  tipoObra: TipoObra;
  padrao: PadraoAcabamento;
  areaTotal: number;
  pavimentos: number;
}

export interface ElementoConstrutivo {
  tipo: TipoElemento;
  descricao: string;
  quantidade: number;
  unidade: string;
  detalhes: string;
}

export interface ItemOrcamentoSugerido {
  capitulo: string;
  codigoReferencia: string;
  fonte: 'SINAPI' | 'SICRO' | 'TCPO';
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

export interface AnaliseResultado {
  elementos: ElementoConstrutivo[];
  resumo: {
    areaTotal: number;
    areaConstruida: number;
    pavimentos: number;
    tipoEstrutura: string;
    custoEstimadoM2: number;
    custoTotal: number;
  };
  quantitativos: ElementoConstrutivo[];
  orcamentoSugerido: ItemOrcamentoSugerido[];
}

// === COEFICIENTES DE ENGENHARIA ===

const COEFICIENTES_BASE = {
  concretoFundacao: 0.08,    // m3/m2 de area
  concretoEstrutura: 0.12,   // m3/m2 de area
  armacao: 90,               // kg/m3 de concreto
  forma: 12,                 // m2/m3 de concreto
  alvenaria: 2.5,            // m2/m2 de area construida
  revestimentoInterno: 3.0,  // m2/m2 de area
  piso: 1.0,                 // m2/m2 de area
  instHidraulica: 0.5,       // ponto/m2 de area
  instEletrica: 0.8,         // ponto/m2 de area
  pintura: 3.5,              // m2/m2 de area
  cobertura: 1.1,            // m2/m2 do ultimo pavimento
  portasPor15m2: 1,          // 1 porta/15m2
  janelasPor20m2: 1,         // 1 janela/20m2
  movimentoTerra: 0.3,       // m3/m2 de area (escavacao)
  tubulacaoHidraulica: 3.5,  // m/ponto
  fiacaoEletrica: 8.0,       // m/ponto
};

// Fatores de ajuste por padrao de acabamento
const FATORES_PADRAO: Record<PadraoAcabamento, number> = {
  Baixo: 0.80,
  Medio: 1.00,
  Alto: 1.30,
  Luxo: 1.60,
};

// Fatores de ajuste por tipo de obra
const FATORES_TIPO_OBRA: Record<TipoObra, Record<string, number>> = {
  Residencial: {
    concretoFundacao: 1.0,
    concretoEstrutura: 1.0,
    alvenaria: 1.0,
    instHidraulica: 1.2,
    instEletrica: 1.0,
    esquadrias: 1.0,
  },
  Comercial: {
    concretoFundacao: 1.1,
    concretoEstrutura: 1.2,
    alvenaria: 0.7,
    instHidraulica: 0.6,
    instEletrica: 1.4,
    esquadrias: 0.8,
  },
  Industrial: {
    concretoFundacao: 1.3,
    concretoEstrutura: 1.4,
    alvenaria: 0.5,
    instHidraulica: 0.4,
    instEletrica: 1.6,
    esquadrias: 0.5,
  },
  Infraestrutura: {
    concretoFundacao: 1.5,
    concretoEstrutura: 1.6,
    alvenaria: 0.3,
    instHidraulica: 0.3,
    instEletrica: 0.5,
    esquadrias: 0.2,
  },
};

// === MAPEAMENTO PARA TABELAS DE PRECOS ===

interface MapeamentoItem {
  tipo: TipoElemento;
  capitulo: string;
  codigoSinapi: string;
  codigoTcpo: string;
  descricaoFallback: string;
  unidade: string;
}

const MAPEAMENTO_ITENS: MapeamentoItem[] = [
  // Movimento de Terra
  { tipo: 'MOVIMENTO_TERRA', capitulo: 'Servicos Preliminares e Mov. Terra', codigoSinapi: '72130', codigoTcpo: '02010.4.1.1', descricaoFallback: 'Escavacao manual de vala', unidade: 'm3' },
  // Fundacoes
  { tipo: 'FUNDACAO', capitulo: 'Fundacoes', codigoSinapi: '72048', codigoTcpo: '02020.3.1.1', descricaoFallback: 'Concreto para fundacao FCK=20MPa', unidade: 'm3' },
  { tipo: 'FUNDACAO', capitulo: 'Fundacoes', codigoSinapi: '72060', codigoTcpo: '02030.1.1.1', descricaoFallback: 'Aco CA-50 para fundacoes', unidade: 'kg' },
  { tipo: 'FUNDACAO', capitulo: 'Fundacoes', codigoSinapi: '72050', codigoTcpo: '02040.2.1.1', descricaoFallback: 'Forma de madeira para fundacao', unidade: 'm2' },
  // Estrutura
  { tipo: 'ESTRUTURA', capitulo: 'Estrutura', codigoSinapi: '87530', codigoTcpo: '03020.1.1.1', descricaoFallback: 'Concreto usinado FCK=30MPa para estrutura', unidade: 'm3' },
  { tipo: 'ESTRUTURA', capitulo: 'Estrutura', codigoSinapi: '87548', codigoTcpo: '03030.1.1.1', descricaoFallback: 'Aco CA-50 para estrutura', unidade: 'kg' },
  { tipo: 'ESTRUTURA', capitulo: 'Estrutura', codigoSinapi: '87538', codigoTcpo: '03040.1.1.1', descricaoFallback: 'Forma de madeira para estrutura', unidade: 'm2' },
  { tipo: 'ESTRUTURA', capitulo: 'Estrutura', codigoSinapi: '87553', codigoTcpo: '03050.1.1.1', descricaoFallback: 'Laje pre-moldada com capeamento', unidade: 'm2' },
  // Alvenaria
  { tipo: 'ALVENARIA', capitulo: 'Alvenaria', codigoSinapi: '87504', codigoTcpo: '04010.1.1.1', descricaoFallback: 'Alvenaria de vedacao com bloco ceramico', unidade: 'm2' },
  // Revestimento
  { tipo: 'REVESTIMENTO', capitulo: 'Revestimento', codigoSinapi: '87878', codigoTcpo: '05010.1.1.1', descricaoFallback: 'Chapisco + emboco + reboco interno', unidade: 'm2' },
  // Piso
  { tipo: 'PISO', capitulo: 'Piso', codigoSinapi: '87264', codigoTcpo: '11010.1.1.1', descricaoFallback: 'Piso ceramico assentado com argamassa', unidade: 'm2' },
  // Instalacoes Hidraulicas
  { tipo: 'HIDRAULICA', capitulo: 'Inst. Hidraulicas', codigoSinapi: '89709', codigoTcpo: '07010.1.1.1', descricaoFallback: 'Ponto de agua fria com tubulacao PVC', unidade: 'un' },
  // Instalacoes Eletricas
  { tipo: 'ELETRICA', capitulo: 'Inst. Eletricas', codigoSinapi: '91863', codigoTcpo: '08010.1.1.1', descricaoFallback: 'Ponto de luz/tomada com fiacao', unidade: 'un' },
  // Cobertura
  { tipo: 'COBERTURA', capitulo: 'Cobertura', codigoSinapi: '92538', codigoTcpo: '09010.1.1.1', descricaoFallback: 'Cobertura com telha ceramica, inclusive madeiramento', unidade: 'm2' },
  // Esquadrias
  { tipo: 'ESQUADRIA', capitulo: 'Esquadrias', codigoSinapi: '91312', codigoTcpo: '12010.1.1.1', descricaoFallback: 'Porta interna de madeira completa', unidade: 'un' },
  { tipo: 'ESQUADRIA', capitulo: 'Esquadrias', codigoSinapi: '91318', codigoTcpo: '12020.1.1.1', descricaoFallback: 'Janela de aluminio com vidro', unidade: 'un' },
  // Pintura
  { tipo: 'PINTURA', capitulo: 'Pintura', codigoSinapi: '88485', codigoTcpo: '06010.1.1.1', descricaoFallback: 'Pintura latex PVA interna, 2 demaos', unidade: 'm2' },
];

// === FUNCOES AUXILIARES ===

function buscarPrecoSinapi(codigo: string, uf: string): { descricao: string; preco: number; unidade: string } | null {
  const item = sinapiData.find(i => i.codigo === codigo);
  if (!item) return null;
  const preco = item.precos[uf] || item.precos['SP'] || 0;
  return { descricao: item.descricao, preco, unidade: item.unidade };
}

function buscarPrecoTcpo(codigo: string, uf: string): { descricao: string; preco: number; unidade: string } | null {
  const item = tcpoData.find(i => i.codigo === codigo);
  if (!item) return null;
  const preco = item.precos[uf] || item.precos['SP'] || 0;
  return { descricao: item.descricao, preco, unidade: item.unidade };
}

function buscarMelhorPreco(codigoSinapi: string, codigoTcpo: string, uf: string, descFallback: string, unidade: string): { fonte: 'SINAPI' | 'TCPO'; codigo: string; descricao: string; preco: number; unidade: string } {
  const sinapi = buscarPrecoSinapi(codigoSinapi, uf);
  const tcpo = buscarPrecoTcpo(codigoTcpo, uf);

  if (sinapi && sinapi.preco > 0) {
    return { fonte: 'SINAPI', codigo: codigoSinapi, descricao: sinapi.descricao, preco: sinapi.preco, unidade: sinapi.unidade };
  }
  if (tcpo && tcpo.preco > 0) {
    return { fonte: 'TCPO', codigo: codigoTcpo, descricao: tcpo.descricao, preco: tcpo.preco, unidade: tcpo.unidade };
  }

  // Fallback: use first item of same group in SINAPI
  const fallbackItem = sinapiData.find(i => i.unidade === unidade);
  const fallbackPreco = fallbackItem ? (fallbackItem.precos[uf] || fallbackItem.precos['SP'] || 100) : 100;
  return { fonte: 'SINAPI', codigo: codigoSinapi || '00000', descricao: descFallback, preco: fallbackPreco, unidade };
}

// === FUNCAO PRINCIPAL ===

export function analyzeProject(config: ConfigAnalise): AnaliseResultado {
  const { uf, tipoObra, padrao, areaTotal, pavimentos } = config;
  const fatorPadrao = FATORES_PADRAO[padrao];
  const fatoresTipo = FATORES_TIPO_OBRA[tipoObra];

  const areaPorPavimento = areaTotal / pavimentos;
  const areaConstruida = areaTotal;

  // Calcular quantitativos com coeficientes
  const volumeConcretoFundacao = COEFICIENTES_BASE.concretoFundacao * areaPorPavimento * (fatoresTipo.concretoFundacao || 1) * fatorPadrao;
  const volumeConcretoEstrutura = COEFICIENTES_BASE.concretoEstrutura * areaConstruida * (fatoresTipo.concretoEstrutura || 1) * fatorPadrao;
  const pesoArmacaoFundacao = volumeConcretoFundacao * COEFICIENTES_BASE.armacao;
  const pesoArmacaoEstrutura = volumeConcretoEstrutura * COEFICIENTES_BASE.armacao;
  const areaFormaFundacao = volumeConcretoFundacao * COEFICIENTES_BASE.forma;
  const areaFormaEstrutura = volumeConcretoEstrutura * COEFICIENTES_BASE.forma;
  const areaAlvenaria = COEFICIENTES_BASE.alvenaria * areaConstruida * (fatoresTipo.alvenaria || 1) * fatorPadrao;
  const areaRevestimento = COEFICIENTES_BASE.revestimentoInterno * areaConstruida * fatorPadrao;
  const areaPiso = COEFICIENTES_BASE.piso * areaConstruida;
  const pontosHidraulica = Math.round(COEFICIENTES_BASE.instHidraulica * areaConstruida * (fatoresTipo.instHidraulica || 1));
  const pontosEletrica = Math.round(COEFICIENTES_BASE.instEletrica * areaConstruida * (fatoresTipo.instEletrica || 1));
  const areaPintura = COEFICIENTES_BASE.pintura * areaConstruida * fatorPadrao;
  const areaCobertura = COEFICIENTES_BASE.cobertura * areaPorPavimento;
  const numPortas = Math.round(areaConstruida / 15 * (fatoresTipo.esquadrias || 1));
  const numJanelas = Math.round(areaConstruida / 20 * (fatoresTipo.esquadrias || 1));
  const volumeEscavacao = COEFICIENTES_BASE.movimentoTerra * areaPorPavimento * (fatoresTipo.concretoFundacao || 1);
  const areaLaje = areaConstruida;

  // Gerar elementos construtivos
  const elementos: ElementoConstrutivo[] = [
    { tipo: 'MOVIMENTO_TERRA', descricao: 'Escavacao mecanica para fundacoes', quantidade: round2(volumeEscavacao), unidade: 'm3', detalhes: `Escavacao de valas para fundacao. Prof. media 1.0m` },
    { tipo: 'FUNDACAO', descricao: 'Concreto para fundacao (sapatas e baldrames)', quantidade: round2(volumeConcretoFundacao), unidade: 'm3', detalhes: `FCK 20MPa. Coef: ${COEFICIENTES_BASE.concretoFundacao} m3/m2` },
    { tipo: 'FUNDACAO', descricao: 'Armacao de aco para fundacao (CA-50)', quantidade: round2(pesoArmacaoFundacao), unidade: 'kg', detalhes: `Taxa: ${COEFICIENTES_BASE.armacao} kg/m3 de concreto` },
    { tipo: 'FUNDACAO', descricao: 'Forma de madeira para fundacao', quantidade: round2(areaFormaFundacao), unidade: 'm2', detalhes: `Taxa: ${COEFICIENTES_BASE.forma} m2/m3 de concreto` },
    { tipo: 'ESTRUTURA', descricao: 'Concreto usinado para estrutura (pilares/vigas/lajes)', quantidade: round2(volumeConcretoEstrutura), unidade: 'm3', detalhes: `FCK 30MPa. Coef: ${COEFICIENTES_BASE.concretoEstrutura} m3/m2` },
    { tipo: 'ESTRUTURA', descricao: 'Armacao de aco para estrutura (CA-50)', quantidade: round2(pesoArmacaoEstrutura), unidade: 'kg', detalhes: `Taxa: ${COEFICIENTES_BASE.armacao} kg/m3 de concreto` },
    { tipo: 'ESTRUTURA', descricao: 'Forma de madeira para estrutura', quantidade: round2(areaFormaEstrutura), unidade: 'm2', detalhes: `Taxa: ${COEFICIENTES_BASE.forma} m2/m3 de concreto` },
    { tipo: 'ESTRUTURA', descricao: 'Laje (pre-moldada ou macica)', quantidade: round2(areaLaje), unidade: 'm2', detalhes: `Area total de lajes: ${pavimentos} pavimento(s)` },
    { tipo: 'ALVENARIA', descricao: 'Alvenaria de vedacao (bloco ceramico 14x19x29cm)', quantidade: round2(areaAlvenaria), unidade: 'm2', detalhes: `Coef: ${COEFICIENTES_BASE.alvenaria} m2/m2 de area. Tipo: ${tipoObra}` },
    { tipo: 'REVESTIMENTO', descricao: 'Revestimento interno (chapisco + emboco + reboco)', quantidade: round2(areaRevestimento), unidade: 'm2', detalhes: `Coef: ${COEFICIENTES_BASE.revestimentoInterno} m2/m2. Padrao: ${padrao}` },
    { tipo: 'PISO', descricao: 'Piso ceramico (45x45cm ou porcelanato)', quantidade: round2(areaPiso), unidade: 'm2', detalhes: `1.0 m2/m2 de area util` },
    { tipo: 'HIDRAULICA', descricao: 'Pontos de agua fria (PVC soldavel)', quantidade: pontosHidraulica, unidade: 'un', detalhes: `Coef: ${COEFICIENTES_BASE.instHidraulica} pt/m2. Inclui tubulacao ~${round2(pontosHidraulica * COEFICIENTES_BASE.tubulacaoHidraulica)}m` },
    { tipo: 'ELETRICA', descricao: 'Pontos de luz e tomadas', quantidade: pontosEletrica, unidade: 'un', detalhes: `Coef: ${COEFICIENTES_BASE.instEletrica} pt/m2. Inclui fiacao ~${round2(pontosEletrica * COEFICIENTES_BASE.fiacaoEletrica)}m` },
    { tipo: 'COBERTURA', descricao: 'Cobertura com telha ceramica e madeiramento', quantidade: round2(areaCobertura), unidade: 'm2', detalhes: `Coef: ${COEFICIENTES_BASE.cobertura} m2/m2 do ultimo pav.` },
    { tipo: 'ESQUADRIA', descricao: 'Portas internas de madeira (80x210cm)', quantidade: numPortas, unidade: 'un', detalhes: `1 porta a cada 15m2. Total: ${numPortas} un` },
    { tipo: 'ESQUADRIA', descricao: 'Janelas de aluminio com vidro (120x120cm)', quantidade: numJanelas, unidade: 'un', detalhes: `1 janela a cada 20m2. Total: ${numJanelas} un` },
    { tipo: 'PINTURA', descricao: 'Pintura latex PVA interna e externa (2 demaos)', quantidade: round2(areaPintura), unidade: 'm2', detalhes: `Coef: ${COEFICIENTES_BASE.pintura} m2/m2. Padrao: ${padrao}` },
  ];

  // Gerar orcamento sugerido mapeando para tabelas de precos
  const orcamentoSugerido: ItemOrcamentoSugerido[] = [];
  const quantidadesPorMapeamento: Map<string, number> = new Map();

  // Mapear elementos para itens de orcamento
  quantidadesPorMapeamento.set('MOVIMENTO_TERRA_m3', volumeEscavacao);
  quantidadesPorMapeamento.set('FUNDACAO_m3', volumeConcretoFundacao);
  quantidadesPorMapeamento.set('FUNDACAO_kg', pesoArmacaoFundacao);
  quantidadesPorMapeamento.set('FUNDACAO_m2', areaFormaFundacao);
  quantidadesPorMapeamento.set('ESTRUTURA_m3', volumeConcretoEstrutura);
  quantidadesPorMapeamento.set('ESTRUTURA_kg', pesoArmacaoEstrutura);
  quantidadesPorMapeamento.set('ESTRUTURA_m2_forma', areaFormaEstrutura);
  quantidadesPorMapeamento.set('ESTRUTURA_m2_laje', areaLaje);
  quantidadesPorMapeamento.set('ALVENARIA_m2', areaAlvenaria);
  quantidadesPorMapeamento.set('REVESTIMENTO_m2', areaRevestimento);
  quantidadesPorMapeamento.set('PISO_m2', areaPiso);
  quantidadesPorMapeamento.set('HIDRAULICA_un', pontosHidraulica);
  quantidadesPorMapeamento.set('ELETRICA_un', pontosEletrica);
  quantidadesPorMapeamento.set('COBERTURA_m2', areaCobertura);
  quantidadesPorMapeamento.set('ESQUADRIA_porta', numPortas);
  quantidadesPorMapeamento.set('ESQUADRIA_janela', numJanelas);
  quantidadesPorMapeamento.set('PINTURA_m2', areaPintura);

  // Para cada item do mapeamento, buscar preco nas tabelas
  MAPEAMENTO_ITENS.forEach((mapeamento, idx) => {
    let quantidade = 0;

    // Determinar quantidade com base no tipo e unidade
    switch (mapeamento.tipo) {
      case 'MOVIMENTO_TERRA':
        quantidade = volumeEscavacao;
        break;
      case 'FUNDACAO':
        if (mapeamento.unidade === 'm3') quantidade = volumeConcretoFundacao;
        else if (mapeamento.unidade === 'kg') quantidade = pesoArmacaoFundacao;
        else if (mapeamento.unidade === 'm2') quantidade = areaFormaFundacao;
        break;
      case 'ESTRUTURA':
        if (mapeamento.unidade === 'm3') quantidade = volumeConcretoEstrutura;
        else if (mapeamento.unidade === 'kg') quantidade = pesoArmacaoEstrutura;
        else if (mapeamento.unidade === 'm2' && idx === 6) quantidade = areaFormaEstrutura;
        else if (mapeamento.unidade === 'm2' && idx === 7) quantidade = areaLaje;
        break;
      case 'ALVENARIA':
        quantidade = areaAlvenaria;
        break;
      case 'REVESTIMENTO':
        quantidade = areaRevestimento;
        break;
      case 'PISO':
        quantidade = areaPiso;
        break;
      case 'HIDRAULICA':
        quantidade = pontosHidraulica;
        break;
      case 'ELETRICA':
        quantidade = pontosEletrica;
        break;
      case 'COBERTURA':
        quantidade = areaCobertura;
        break;
      case 'ESQUADRIA':
        if (mapeamento.descricaoFallback.includes('Porta')) quantidade = numPortas;
        else quantidade = numJanelas;
        break;
      case 'PINTURA':
        quantidade = areaPintura;
        break;
    }

    if (quantidade <= 0) return;

    const melhor = buscarMelhorPreco(mapeamento.codigoSinapi, mapeamento.codigoTcpo, uf, mapeamento.descricaoFallback, mapeamento.unidade);

    orcamentoSugerido.push({
      capitulo: mapeamento.capitulo,
      codigoReferencia: melhor.codigo,
      fonte: melhor.fonte,
      descricao: melhor.descricao,
      unidade: melhor.unidade,
      quantidade: round2(quantidade),
      precoUnitario: melhor.preco,
      precoTotal: round2(quantidade * melhor.preco),
    });
  });

  const custoTotal = orcamentoSugerido.reduce((sum, item) => sum + item.precoTotal, 0);
  const custoM2 = areaConstruida > 0 ? custoTotal / areaConstruida : 0;

  return {
    elementos,
    resumo: {
      areaTotal,
      areaConstruida,
      pavimentos,
      tipoEstrutura: pavimentos > 4 ? 'Concreto Armado' : tipoObra === 'Industrial' ? 'Metalica/Pre-moldada' : 'Concreto Armado Convencional',
      custoEstimadoM2: round2(custoM2),
      custoTotal: round2(custoTotal),
    },
    quantitativos: elementos,
    orcamentoSugerido,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Gerar capitulos no formato do orcamento existente
export function gerarCapitulosOrcamento(resultado: AnaliseResultado): { id: string; nome: string; itens: { id: string; codigo: string; descricao: string; fonte: 'SINAPI' | 'SICRO' | 'TCPO'; unidade: string; quantidade: number; precoUnitario: number }[] }[] {
  const capitulosMap = new Map<string, { id: string; codigo: string; descricao: string; fonte: 'SINAPI' | 'SICRO' | 'TCPO'; unidade: string; quantidade: number; precoUnitario: number }[]>();

  resultado.orcamentoSugerido.forEach((item) => {
    if (!capitulosMap.has(item.capitulo)) {
      capitulosMap.set(item.capitulo, []);
    }
    capitulosMap.get(item.capitulo)!.push({
      id: generateCapId(),
      codigo: item.codigoReferencia,
      descricao: item.descricao,
      fonte: item.fonte,
      unidade: item.unidade,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
    });
  });

  const capitulos: { id: string; nome: string; itens: { id: string; codigo: string; descricao: string; fonte: 'SINAPI' | 'SICRO' | 'TCPO'; unidade: string; quantidade: number; precoUnitario: number }[] }[] = [];
  
  capitulosMap.forEach((itens, nome) => {
    capitulos.push({ id: generateCapId(), nome, itens });
  });

  return capitulos;
}

let capIdCounter = 0;
function generateCapId(): string {
  capIdCounter++;
  return `cap_${Date.now().toString(36)}_${capIdCounter}_${Math.random().toString(36).substr(2, 4)}`;
}