export interface ItemTcpo {
  codigo: string;
  descricao: string;
  unidade: string;
  grupo: string;
  precos: Record<string, number>; // UF -> price
  mesReferencia: string;
  produtividade?: string; // e.g., "0.5 h/m2"
}

// Helper to generate state prices from a SP base price with ±15% variation per state
// Variations are fixed (deterministic) per state, not random.
const stateFactors: Record<string, number> = {
  SP: 1.000,
  RJ: 1.080,
  MG: 0.960,
  RS: 0.970,
  SC: 0.975,
  PR: 0.965,
  ES: 0.985,
  GO: 0.950,
  DF: 1.050,
  MS: 0.945,
  MT: 0.955,
  BA: 0.920,
  CE: 0.915,
  PE: 0.910,
  MA: 0.900,
  PI: 0.895,
  RN: 0.905,
  PB: 0.908,
  SE: 0.912,
  AL: 0.903,
  PA: 0.930,
  AM: 0.940,
  AP: 0.935,
  RO: 0.938,
  RR: 0.932,
  AC: 0.928,
  TO: 0.942,
};

function makePrecos(spBase: number): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [uf, factor] of Object.entries(stateFactors)) {
    result[uf] = Math.round(spBase * factor * 100) / 100;
  }
  return result;
}

export const tcpoData: ItemTcpo[] = [
  // ─────────────────────────────────────────────
  // SERVIÇOS PRELIMINARES (5 items)
  // ─────────────────────────────────────────────
  {
    codigo: '01010.1.1.1',
    descricao: 'Limpeza e preparo do terreno com motoniveladora, inclusive carga e transporte',
    unidade: 'm2',
    grupo: 'Servicos Preliminares',
    precos: makePrecos(4.85),
    mesReferencia: '04/2026',
    produtividade: '0.02 h/m2',
  },
  {
    codigo: '01020.2.1.1',
    descricao: 'Locação da obra com gabaritos de madeira, inclusive nivelamento',
    unidade: 'm2',
    grupo: 'Servicos Preliminares',
    precos: makePrecos(8.20),
    mesReferencia: '04/2026',
    produtividade: '0.12 h/m2',
  },
  {
    codigo: '01030.1.2.1',
    descricao: 'Tapume de madeira compensada, altura 2,20 m, inclusive fundação e retirada',
    unidade: 'm',
    grupo: 'Servicos Preliminares',
    precos: makePrecos(95.40),
    mesReferencia: '04/2026',
    produtividade: '1.50 h/m',
  },
  {
    codigo: '01050.1.1.1',
    descricao: 'Instalação de canteiro de obras, barracão administrativo e almoxarifado',
    unidade: 'vb',
    grupo: 'Servicos Preliminares',
    precos: makePrecos(4850.00),
    mesReferencia: '04/2026',
    produtividade: '48.00 h/vb',
  },

  // ─────────────────────────────────────────────
  // FUNDAÇÕES (5 items)
  // ─────────────────────────────────────────────
  {
    codigo: '02010.4.1.1',
    descricao: 'Escavação manual de vala para fundação, profundidade até 1,50 m em solo de 1ª categoria',
    unidade: 'm3',
    grupo: 'Fundacoes',
    precos: makePrecos(38.60),
    mesReferencia: '04/2026',
    produtividade: '3.20 h/m3',
  },
  {
    codigo: '02020.2.2.1',
    descricao: 'Lastro de concreto simples fck=10 MPa, espessura 5 cm, para fundações',
    unidade: 'm3',
    grupo: 'Fundacoes',
    precos: makePrecos(420.00),
    mesReferencia: '04/2026',
    produtividade: '6.00 h/m3',
  },
  {
    codigo: '02030.5.1.1',
    descricao: 'Sapata isolada de concreto armado fck=25 MPa, inclusive fôrma e armação',
    unidade: 'm3',
    grupo: 'Fundacoes',
    precos: makePrecos(1180.00),
    mesReferencia: '04/2026',
    produtividade: '14.00 h/m3',
  },
  {
    codigo: '02040.6.1.1',
    descricao: 'Estaca raiz, diâmetro 31 cm, em solo de 1ª a 3ª categoria, inclusive perfuração e concretagem',
    unidade: 'm',
    grupo: 'Fundacoes',
    precos: makePrecos(185.00),
    mesReferencia: '04/2026',
    produtividade: '0.80 h/m',
  },

  // ─────────────────────────────────────────────
  // ESTRUTURA (6 items)
  // ─────────────────────────────────────────────
  {
    codigo: '03010.5.2.1',
    descricao: 'Pilares de concreto armado fck=25 MPa, seção 20x30 cm, inclusive fôrma de madeira e armação CA-50',
    unidade: 'm3',
    grupo: 'Estrutura',
    precos: makePrecos(2250.00),
    mesReferencia: '04/2026',
    produtividade: '22.00 h/m3',
  },
  {
    codigo: '03020.5.2.2',
    descricao: 'Vigas de concreto armado fck=25 MPa, seção 15x40 cm, inclusive fôrma de madeira e armação CA-50',
    unidade: 'm3',
    grupo: 'Estrutura',
    precos: makePrecos(2180.00),
    mesReferencia: '04/2026',
    produtividade: '20.00 h/m3',
  },
  {
    codigo: '03030.5.3.1',
    descricao: 'Laje maciça de concreto armado fck=25 MPa, espessura 12 cm, inclusive fôrma e armação',
    unidade: 'm2',
    grupo: 'Estrutura',
    precos: makePrecos(115.40),
    mesReferencia: '04/2026',
    produtividade: '2.80 h/m2',
  },
  {
    codigo: '03040.4.1.1',
    descricao: 'Laje pré-moldada tipo nervurada com lajotas cerâmicas, vão até 4,00 m, sobrecarga 200 kgf/m2',
    unidade: 'm2',
    grupo: 'Estrutura',
    precos: makePrecos(92.80),
    mesReferencia: '04/2026',
    produtividade: '1.60 h/m2',
  },
  {
    codigo: '03050.6.1.1',
    descricao: 'Escada de concreto armado fck=25 MPa, inclusive fôrma, armação e degraus de concreto',
    unidade: 'm2',
    grupo: 'Estrutura',
    precos: makePrecos(320.00),
    mesReferencia: '04/2026',
    produtividade: '8.50 h/m2',
  },
  // ─────────────────────────────────────────────
  // ALVENARIA (5 items)
  // ─────────────────────────────────────────────
  {
    codigo: '04120.3.1.1',
    descricao: 'Alvenaria de tijolo cerâmico furado 9x19x19 cm, espessura 19 cm, com argamassa traço 1:2:8 (cimento, cal e areia)',
    unidade: 'm2',
    grupo: 'Alvenaria',
    precos: makePrecos(58.90),
    mesReferencia: '04/2026',
    produtividade: '1.20 h/m2',
  },
  {
    codigo: '04130.2.1.1',
    descricao: 'Alvenaria de tijolo cerâmico furado 9x14x19 cm, espessura 14 cm, com argamassa traço 1:2:8',
    unidade: 'm2',
    grupo: 'Alvenaria',
    precos: makePrecos(48.50),
    mesReferencia: '04/2026',
    produtividade: '1.10 h/m2',
  },
  {
    codigo: '04140.5.1.1',
    descricao: 'Alvenaria de bloco de concreto 14x19x39 cm, com argamassa traço 1:4 (cimento e areia)',
    unidade: 'm2',
    grupo: 'Alvenaria',
    precos: makePrecos(72.30),
    mesReferencia: '04/2026',
    produtividade: '1.35 h/m2',
  },
  {
    codigo: '04150.1.1.1',
    descricao: 'Verga e contraverga de concreto pré-moldado 10x10 cm, inclusive colocação',
    unidade: 'm',
    grupo: 'Alvenaria',
    precos: makePrecos(22.40),
    mesReferencia: '04/2026',
    produtividade: '0.40 h/m',
  },
  // ─────────────────────────────────────────────
  // REVESTIMENTO (6 items)
  // ─────────────────────────────────────────────
  {
    codigo: '05010.2.1.1',
    descricao: 'Chapisco com argamassa traço 1:3 (cimento e areia grossa), aplicado em paredes internas',
    unidade: 'm2',
    grupo: 'Revestimento',
    precos: makePrecos(8.75),
    mesReferencia: '04/2026',
    produtividade: '0.25 h/m2',
  },
  {
    codigo: '05020.3.1.1',
    descricao: 'Emboço paulista para paredes internas com argamassa traço 1:2:9 (cimento, cal e areia), espessura 2 cm',
    unidade: 'm2',
    grupo: 'Revestimento',
    precos: makePrecos(28.40),
    mesReferencia: '04/2026',
    produtividade: '0.65 h/m2',
  },
  {
    codigo: '05030.3.2.1',
    descricao: 'Reboco com pasta de cal, espessura 5 mm, sobre emboço em paredes internas',
    unidade: 'm2',
    grupo: 'Revestimento',
    precos: makePrecos(18.90),
    mesReferencia: '04/2026',
    produtividade: '0.45 h/m2',
  },
  {
    codigo: '05040.4.1.1',
    descricao: 'Revestimento cerâmico de paredes com azulejo 20x20 cm, assentado com argamassa colante AC-I, rejuntamento incluso',
    unidade: 'm2',
    grupo: 'Revestimento',
    precos: makePrecos(72.50),
    mesReferencia: '04/2026',
    produtividade: '1.30 h/m2',
  },
  {
    codigo: '05050.5.1.1',
    descricao: 'Revestimento externo com argamassa industrializada monocamada, e=2,5 cm, textura rústica',
    unidade: 'm2',
    grupo: 'Revestimento',
    precos: makePrecos(45.80),
    mesReferencia: '04/2026',
    produtividade: '0.90 h/m2',
  },
  // ─────────────────────────────────────────────
  // PINTURA (4 items)
  // ─────────────────────────────────────────────
  {
    codigo: '06010.1.1.1',
    descricao: 'Pintura interna com tinta látex PVA, 2 demãos, sobre massa corrida, paredes e tetos',
    unidade: 'm2',
    grupo: 'Pintura',
    precos: makePrecos(14.20),
    mesReferencia: '04/2026',
    produtividade: '0.18 h/m2',
  },
  {
    codigo: '06020.2.1.1',
    descricao: 'Pintura interna com tinta acrílica semi-brilho, 2 demãos, sobre massa corrida',
    unidade: 'm2',
    grupo: 'Pintura',
    precos: makePrecos(18.60),
    mesReferencia: '04/2026',
    produtividade: '0.22 h/m2',
  },
  {
    codigo: '06030.3.1.1',
    descricao: 'Pintura externa com tinta acrílica premium, 2 demãos, sobre selador acrílico',
    unidade: 'm2',
    grupo: 'Pintura',
    precos: makePrecos(22.80),
    mesReferencia: '04/2026',
    produtividade: '0.28 h/m2',
  },
  {
    codigo: '06040.1.2.1',
    descricao: 'Aplicação de massa corrida PVA em paredes internas, 2 demãos, lixamento incluso',
    unidade: 'm2',
    grupo: 'Pintura',
    precos: makePrecos(12.40),
    mesReferencia: '04/2026',
    produtividade: '0.20 h/m2',
  },

  // ─────────────────────────────────────────────
  // INSTALAÇÕES HIDRÁULICAS (4 items)
  // ─────────────────────────────────────────────
  {
    codigo: '07010.4.1.1',
    descricao: 'Tubulação de PVC soldável para água fria, diâmetro 25 mm (3/4"), inclusive conexões e suportes',
    unidade: 'm',
    grupo: 'Inst. Hidraulicas',
    precos: makePrecos(32.40),
    mesReferencia: '04/2026',
    produtividade: '0.55 h/m',
  },
  {
    codigo: '07020.4.2.1',
    descricao: 'Tubulação de PVC série esgoto, diâmetro 100 mm (4"), inclusive conexões e suportes',
    unidade: 'm',
    grupo: 'Inst. Hidraulicas',
    precos: makePrecos(48.60),
    mesReferencia: '04/2026',
    produtividade: '0.70 h/m',
  },
  {
    codigo: '07030.2.1.1',
    descricao: 'Instalação de caixa d\'água em polietileno 1000 L, inclusive base de apoio e interligação',
    unidade: 'un',
    grupo: 'Inst. Hidraulicas',
    precos: makePrecos(1250.00),
    mesReferencia: '04/2026',
    produtividade: '8.00 h/un',
  },
  {
    codigo: '07040.3.1.1',
    descricao: 'Ponto de água fria para bacia sanitária com registro de gaveta 1/2", incluindo tubulação e conexões',
    unidade: 'un',
    grupo: 'Inst. Hidraulicas',
    precos: makePrecos(185.00),
    mesReferencia: '04/2026',
    produtividade: '2.50 h/un',
  },

  // ─────────────────────────────────────────────
  // INSTALAÇÕES ELÉTRICAS (4 items)
  // ─────────────────────────────────────────────
  {
    codigo: '08010.3.1.1',
    descricao: 'Eletroduto corrugado flexível de PVC, diâmetro 25 mm, embutido em alvenaria ou laje',
    unidade: 'm',
    grupo: 'Inst. Eletricas',
    precos: makePrecos(12.80),
    mesReferencia: '04/2026',
    produtividade: '0.18 h/m',
  },
  {
    codigo: '08020.4.1.1',
    descricao: 'Fiação com cabo de cobre 2,5 mm2 (750 V), inclusive passagem e fixação',
    unidade: 'm',
    grupo: 'Inst. Eletricas',
    precos: makePrecos(8.40),
    mesReferencia: '04/2026',
    produtividade: '0.10 h/m',
  },
  {
    codigo: '08030.2.1.1',
    descricao: 'Quadro de distribuição de embutir com disjuntor geral 63A e 12 circuitos, incluindo instalação',
    unidade: 'un',
    grupo: 'Inst. Eletricas',
    precos: makePrecos(1480.00),
    mesReferencia: '04/2026',
    produtividade: '12.00 h/un',
  },
  {
    codigo: '08040.1.2.1',
    descricao: 'Ponto de tomada 2P+T, 10A/250V, embutido em alvenaria, com caixa 4x2", placa e interligação',
    unidade: 'un',
    grupo: 'Inst. Eletricas',
    precos: makePrecos(98.50),
    mesReferencia: '04/2026',
    produtividade: '1.20 h/un',
  },

  // ─────────────────────────────────────────────
  // COBERTURA (4 items)
  // ─────────────────────────────────────────────
  {
    codigo: '09010.3.1.1',
    descricao: 'Estrutura de madeira para telhado com caibros e ripas, vão até 5,00 m, inclinação 30%',
    unidade: 'm2',
    grupo: 'Cobertura',
    precos: makePrecos(68.40),
    mesReferencia: '04/2026',
    produtividade: '1.80 h/m2',
  },
  {
    codigo: '09020.2.2.1',
    descricao: 'Telha cerâmica colonial tipo capa-canal, assentada sobre estrutura de madeira, incluso cumeeira',
    unidade: 'm2',
    grupo: 'Cobertura',
    precos: makePrecos(58.20),
    mesReferencia: '04/2026',
    produtividade: '1.40 h/m2',
  },
  {
    codigo: '09311.8.2.1',
    descricao: 'Telha de fibrocimento ondulada, espessura 6 mm, inclusive fixação com parafusos e arruelas',
    unidade: 'm2',
    grupo: 'Cobertura',
    precos: makePrecos(42.60),
    mesReferencia: '04/2026',
    produtividade: '0.85 h/m2',
  },
  {
    codigo: '09040.4.1.1',
    descricao: 'Calha de zinco desenvolvida 33 cm, inclusive suporte e pingadeira',
    unidade: 'm',
    grupo: 'Cobertura',
    precos: makePrecos(52.80),
    mesReferencia: '04/2026',
    produtividade: '0.90 h/m',
  },

  // ─────────────────────────────────────────────
  // PISO (4 items)
  // ─────────────────────────────────────────────
  {
    codigo: '10010.3.1.1',
    descricao: 'Piso cerâmico PEI-4, 45x45 cm, assentado com argamassa colante AC-II, rejuntamento incluso',
    unidade: 'm2',
    grupo: 'Piso',
    precos: makePrecos(62.40),
    mesReferencia: '04/2026',
    produtividade: '1.25 h/m2',
  },
  {
    codigo: '10020.4.1.1',
    descricao: 'Piso em porcelanato polido 60x60 cm, assentado com argamassa colante AC-III, rejuntamento incluso',
    unidade: 'm2',
    grupo: 'Piso',
    precos: makePrecos(115.80),
    mesReferencia: '04/2026',
    produtividade: '1.60 h/m2',
  },
  {
    codigo: '10030.2.1.1',
    descricao: 'Piso de concreto desempenado, fck=20 MPa, espessura 8 cm, com tela soldada Q-92',
    unidade: 'm2',
    grupo: 'Piso',
    precos: makePrecos(58.60),
    mesReferencia: '04/2026',
    produtividade: '1.10 h/m2',
  },
  {
    codigo: '10040.5.1.1',
    descricao: 'Piso vinílico em placas 30x30 cm, espessura 1,6 mm, assentado com adesivo específico',
    unidade: 'm2',
    grupo: 'Piso',
    precos: makePrecos(48.20),
    mesReferencia: '04/2026',
    produtividade: '0.80 h/m2',
  },

  // ─────────────────────────────────────────────
  // ESQUADRIAS (4 items)
  // ─────────────────────────────────────────────
  {
    codigo: '11010.2.1.1',
    descricao: 'Porta de madeira maciça com batente e ferragens, 0,80x2,10 m, inclusive colocação',
    unidade: 'un',
    grupo: 'Esquadrias',
    precos: makePrecos(620.00),
    mesReferencia: '04/2026',
    produtividade: '4.00 h/un',
  },
  {
    codigo: '11020.3.1.1',
    descricao: 'Janela de alumínio anodizado, tipo de correr, 1,20x1,20 m, 2 folhas, com vidro liso 4 mm incluso',
    unidade: 'un',
    grupo: 'Esquadrias',
    precos: makePrecos(980.00),
    mesReferencia: '04/2026',
    produtividade: '3.50 h/un',
  },
  {
    codigo: '11030.4.1.1',
    descricao: 'Porta de ferro para garagem, basculante, 2,50x2,20 m, chapa 18, inclusive trilhos e motorização',
    unidade: 'un',
    grupo: 'Esquadrias',
    precos: makePrecos(3850.00),
    mesReferencia: '04/2026',
    produtividade: '12.00 h/un',
  },
  {
    codigo: '11040.2.2.1',
    descricao: 'Guarda-corpo de ferro quadrado 20x20 mm, altura 1,10 m, com pintura anticorrosiva e esmalte',
    unidade: 'm',
    grupo: 'Esquadrias',
    precos: makePrecos(185.00),
    mesReferencia: '04/2026',
    produtividade: '3.20 h/m',
  },

  // ─────────────────────────────────────────────
  // IMPERMEABILIZAÇÃO (4 items)
  // ─────────────────────────────────────────────
  {
    codigo: '12010.3.1.1',
    descricao: 'Impermeabilização de laje com manta asfáltica APP 4 mm, inclusive primer, 2 demãos',
    unidade: 'm2',
    grupo: 'Impermeabilizacao',
    precos: makePrecos(68.40),
    mesReferencia: '04/2026',
    produtividade: '0.95 h/m2',
  },
  {
    codigo: '12020.2.1.1',
    descricao: 'Impermeabilização de caixa d\'água com argamassa polimérica, 3 demãos, espessura mínima 3 mm',
    unidade: 'm2',
    grupo: 'Impermeabilizacao',
    precos: makePrecos(42.80),
    mesReferencia: '04/2026',
    produtividade: '0.60 h/m2',
  },
  {
    codigo: '12030.4.1.1',
    descricao: 'Impermeabilização de banheiro com membrana líquida elastomérica, 2 demãos, nas paredes e piso',
    unidade: 'm2',
    grupo: 'Impermeabilizacao',
    precos: makePrecos(38.50),
    mesReferencia: '04/2026',
    produtividade: '0.55 h/m2',
  },
  {
    codigo: '12040.5.1.1',
    descricao: 'Impermeabilização de fundação com emulsão asfáltica, 2 demãos, aplicação sobre bloco e viga',
    unidade: 'm2',
    grupo: 'Impermeabilizacao',
    precos: makePrecos(22.60),
    mesReferencia: '04/2026',
    produtividade: '0.30 h/m2',
  },
];
