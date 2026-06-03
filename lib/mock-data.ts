import { generateId } from "./storage";

// Types
export interface Obra {
  id: string;
  nome: string;
  cliente: string;
  clienteId: string;
  endereco: string;
  cidade: string;
  estado: string;
  dataInicio: string;
  previsaoTermino: string;
  orcamento: number;
  gastoReal: number;
  progresso: number;
  status: "PLANEJAMENTO" | "EM_ANDAMENTO" | "PAUSADA" | "CONCLUIDA" | "CANCELADA";
  descricao: string;
  fotoCapa?: string;
  criadoEm: string;
}

export interface DiarioObra {
  id: string;
  obraId: string;
  data: string;
  clima: "ENSOLARADO" | "NUBLADO" | "CHUVOSO" | "TEMPESTADE";
  descricao: string;
  fotos: string[];
  criadoEm: string;
}

export interface FotoObra {
  id: string;
  obraId: string;
  url: string;
  descricao: string;
  criadoEm: string;
}

export interface DocumentoObra {
  id: string;
  obraId: string;
  nome: string;
  tipo: "CONTRATO" | "PROJETO" | "ALVARA" | "ORCAMENTO" | "OUTRO";
  url: string;
  criadoEm: string;
}

export interface TimelineObra {
  id: string;
  obraId: string;
  tipo: "MILESTONE" | "ACTIVITY" | "NOTE";
  titulo: string;
  descricao: string;
  data: string;
  criadoEm: string;
}

export interface ColaboradorObra {
  id: string;
  obraId: string;
  nome: string;
  cargo: string;
  horasTrabalhadas: number;
  avatar?: string;
}

export interface MaterialObra {
  id: string;
  obraId: string;
  nome: string;
  unidade: string;
  quantidade: number;
  custoUnitario: number;
  custoTotal: number;
}

export interface LancamentoFinanceiro {
  id: string;
  obraId?: string;
  tipo: "RECEITA" | "DESPESA";
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  dataPagamento?: string;
  status: "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
  fornecedorCliente?: string;
  observacoes?: string;
  comprovante?: string;
  parcela?: number;
  totalParcelas?: number;
  criadoEm: string;
}

export interface ChecklistItem {
  id: string;
  descricao: string;
  concluido: boolean;
}

export interface MaterialOS {
  id: string;
  materialId: string;
  nome: string;
  quantidade: number;
  unidade: string;
}

export interface OrdemServico {
  id: string;
  numero: number;
  obraId?: string;
  clienteId?: string;
  cliente: string;
  local: string;
  tecnicoId: string;
  tecnico: string;
  tipoServico: string;
  descricao: string;
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
  status: "ABERTA" | "EM_ANDAMENTO" | "AGUARDANDO_MATERIAL" | "FINALIZADA" | "CANCELADA";
  dataAbertura: string;
  dataAgendada?: string;
  dataConclusao?: string;
  valorEstimado: number;
  observacoes?: string;
  checklist: ChecklistItem[];
  materiais: MaterialOS[];
  fotos: string[];
  horaInicio?: string;
  horaFim?: string;
  assinatura?: string;
}

export interface PresencaColaborador {
  id: string;
  colaboradorId: string;
  data: string;
  checkIn: string;
  checkOut?: string;
  horas: number;
  tipo: "NORMAL" | "EXTRA" | "FALTA";
}

export interface PagamentoColaborador {
  id: string;
  colaboradorId: string;
  tipo: "SALARIO" | "ADIANTAMENTO" | "COMISSAO" | "BONUS";
  valor: number;
  data: string;
  status: "PENDENTE" | "PAGO";
  descricao?: string;
}

export interface DocumentoColaborador {
  id: string;
  colaboradorId: string;
  tipo: "RG" | "CPF" | "CNH" | "ASO" | "CTPS" | "CERTIDAO" | "OUTRO";
  nome: string;
  validade?: string;
  url: string;
  criadoEm: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  telefone: string;
  endereco: string;
  status: "ATIVO" | "INATIVO" | "FERIAS";
  salario: number;
  dataAdmissao: string;
  avatar?: string;
}

export interface MaterialEstoque {
  id: string;
  codigo: string;
  nome: string;
  unidade: "un" | "m" | "m2" | "m3" | "kg" | "l" | "pc" | "saco";
  quantidade: number;
  estoqueMinimo: number;
  valorUnitario: number;
  fornecedorId: string;
  fornecedor: string;
}

export interface MovimentacaoEstoque {
  id: string;
  materialId: string;
  materialNome: string;
  tipo: "ENTRADA" | "SAIDA";
  quantidade: number;
  obraId?: string;
  obraNome?: string;
  responsavel: string;
  motivo: string;
  data: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
}

export interface EventoCalendario {
  id: string;
  titulo: string;
  data: string;
  tipo: "VENCIMENTO" | "ENTREGA" | "REUNIAO" | "MANUTENCAO";
  descricao?: string;
}

// === VEICULOS E EQUIPAMENTOS ===

export interface Veiculo {
  id: string;
  nome: string;
  placa: string;
  tipo: "CARRO" | "CAMINHAO" | "MOTO" | "MAQUINA" | "EQUIPAMENTO";
  marca: string;
  modelo: string;
  ano: number;
  kmAtual: number;
  horimetro: number;
  status: "ATIVO" | "MANUTENCAO" | "INATIVO";
  criadoEm: string;
}

export interface ManutencaoVeiculo {
  id: string;
  veiculoId: string;
  tipo: "PREVENTIVA" | "CORRETIVA" | "REVISAO";
  descricao: string;
  data: string;
  custo: number;
  kmNaManutencao: number;
  proximaKm?: number;
  criadoEm: string;
}

export interface AbastecimentoVeiculo {
  id: string;
  veiculoId: string;
  data: string;
  litros: number;
  precoLitro: number;
  total: number;
  km: number;
  criadoEm: string;
}

export interface DocumentoVeiculo {
  id: string;
  veiculoId: string;
  tipo: "CRLV" | "SEGURO" | "IPVA" | "LICENCIAMENTO" | "OUTRO";
  nome: string;
  validade: string;
  url: string;
  criadoEm: string;
}

// === ORCAMENTOS ===

export interface ComposicaoDetalhe {
  tipo: "material" | "maoDeObra" | "equipamento";
  descricao: string;
  unidade: string;
  coeficiente: number;
  precoUnitario: number;
}

export interface ItemOrcamento {
  id: string;
  codigo: string;
  descricao: string;
  fonte: "SINAPI" | "SICRO" | "TCPO";
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  composicao?: ComposicaoDetalhe[];
}

export interface CapituloOrcamento {
  id: string;
  nome: string;
  itens: ItemOrcamento[];
}

export interface BDIBreakdown {
  administracaoCentral: number;
  seguro: number;
  garantia: number;
  risco: number;
  despesasFinanceiras: number;
  lucro: number;
  pis: number;
  cofins: number;
  iss: number;
  cprb: number;
}

export interface Orcamento {
  id: string;
  nome: string;
  obraId: string;
  obraNome: string;
  clienteNome: string;
  uf: string;
  bdi: number;
  bdiBreakdown?: BDIBreakdown;
  areaM2: number;
  basePadrao: "SINAPI" | "SICRO" | "TCPO";
  status: "RASCUNHO" | "APROVADO";
  capitulos: CapituloOrcamento[];
  encargosHorista?: number;
  encargosMensalista?: number;
  tipoEncargo?: "horista" | "mensalista";
  fatorRegional?: number;
  contingencia?: number;
  subtotal: number;
  valorBdi: number;
  valorEncargos?: number;
  valorContingencia?: number;
  total: number;
  criadoEm: string;
}

// === CLIENTES ===

export interface Cliente {
  id: string;
  tipo: "PF" | "PJ";
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  observacoes?: string;
  criadoEm: string;
}

export interface DocumentoCliente {
  id: string;
  clienteId: string;
  tipo: "CONTRATO" | "PROPOSTA" | "ORCAMENTO" | "OUTRO";
  nome: string;
  url: string;
  criadoEm: string;
}

// Seed Data
export const obrasIniciais: Obra[] = [
  {
    id: "obra-1",
    nome: "Residencial Aurora",
    cliente: "Maria Oliveira",
    clienteId: "cli-1",
    endereco: "Rua das Flores, 234",
    cidade: "Sao Paulo",
    estado: "SP",
    dataInicio: "2024-03-15",
    previsaoTermino: "2024-12-20",
    orcamento: 450000,
    gastoReal: 287500,
    progresso: 75,
    status: "EM_ANDAMENTO",
    descricao: "Construcao de residencia de alto padrao com 3 pavimentos, piscina e area gourmet.",
    fotoCapa: "",
    criadoEm: "2024-03-10",
  },
  {
    id: "obra-2",
    nome: "Comercial Plaza Tower",
    cliente: "Tech Corp Ltda",
    clienteId: "cli-2",
    endereco: "Av. Paulista, 1500",
    cidade: "Campinas",
    estado: "SP",
    dataInicio: "2024-01-10",
    previsaoTermino: "2025-06-30",
    orcamento: 1200000,
    gastoReal: 480000,
    progresso: 45,
    status: "EM_ANDAMENTO",
    descricao: "Construcao de edificio comercial com 8 andares, estacionamento e centro de convencoes.",
    fotoCapa: "",
    criadoEm: "2024-01-05",
  },
  {
    id: "obra-3",
    nome: "Reforma Escritorio Central",
    cliente: "Startup Innovation",
    clienteId: "cli-3",
    endereco: "Rua do Comercio, 45",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    dataInicio: "2024-06-01",
    previsaoTermino: "2024-09-15",
    orcamento: 85000,
    gastoReal: 72000,
    progresso: 90,
    status: "EM_ANDAMENTO",
    descricao: "Reforma completa de escritorio de 200m2 com novo layout open space e salas de reuniao.",
    fotoCapa: "",
    criadoEm: "2024-05-25",
  },
  {
    id: "obra-4",
    nome: "Condominio Solar das Palmeiras",
    cliente: "Invest Group SA",
    clienteId: "cli-4",
    endereco: "Rod. BR-040, Km 12",
    cidade: "Belo Horizonte",
    estado: "MG",
    dataInicio: "2024-08-01",
    previsaoTermino: "2026-03-31",
    orcamento: 3500000,
    gastoReal: 420000,
    progresso: 20,
    status: "PLANEJAMENTO",
    descricao: "Condominio residencial com 24 unidades, clube, piscina olimpica e quadra poliesportiva.",
    fotoCapa: "",
    criadoEm: "2024-07-20",
  },
];

export const lancamentosIniciais: LancamentoFinanceiro[] = [
  // -- JANEIRO 2024
  { id: "fin-1", obraId: "obra-2", tipo: "RECEITA", categoria: "Medicao", descricao: "1a Medicao - Plaza Tower", valor: 240000, data: "2024-01-25", dataPagamento: "2024-01-28", status: "PAGO", fornecedorCliente: "Tech Corp Ltda", criadoEm: "2024-01-20" },
  { id: "fin-2", obraId: "obra-2", tipo: "DESPESA", categoria: "Material", descricao: "Concreto usinado fck30 - Plaza", valor: 98000, data: "2024-01-18", dataPagamento: "2024-01-20", status: "PAGO", fornecedorCliente: "Concretex Ltda", criadoEm: "2024-01-15" },
  { id: "fin-3", tipo: "DESPESA", categoria: "Administrativo", descricao: "Aluguel escritorio sede - Jan", valor: 8500, data: "2024-01-05", dataPagamento: "2024-01-05", status: "PAGO", observacoes: "Parcela 1 de contrato anual", criadoEm: "2024-01-01" },
  { id: "fin-4", tipo: "DESPESA", categoria: "Impostos", descricao: "ISS trimestral - 4T2023", valor: 12400, data: "2024-01-31", dataPagamento: "2024-01-31", status: "PAGO", criadoEm: "2024-01-20" },

  // -- FEVEREIRO 2024
  { id: "fin-5", obraId: "obra-2", tipo: "DESPESA", categoria: "Mao de obra", descricao: "Equipe estrutural - Plaza fev", valor: 62000, data: "2024-02-05", dataPagamento: "2024-02-07", status: "PAGO", fornecedorCliente: "Construtora Estrutural ME", criadoEm: "2024-02-01" },
  { id: "fin-6", obraId: "obra-2", tipo: "DESPESA", categoria: "Equipamento", descricao: "Aluguel grua torre - Plaza", valor: 18500, data: "2024-02-20", dataPagamento: "2024-02-21", status: "PAGO", fornecedorCliente: "LocaEquip Ltda", parcela: 1, totalParcelas: 3, criadoEm: "2024-02-15" },
  { id: "fin-7", tipo: "DESPESA", categoria: "Administrativo", descricao: "Aluguel escritorio sede - Fev", valor: 8500, data: "2024-02-05", dataPagamento: "2024-02-05", status: "PAGO", criadoEm: "2024-02-01" },
  { id: "fin-8", obraId: "obra-1", tipo: "RECEITA", categoria: "Aditivo", descricao: "Aditivo contratual - Varanda Aurora", valor: 22000, data: "2024-02-28", dataPagamento: "2024-03-02", status: "PAGO", fornecedorCliente: "Maria Oliveira", criadoEm: "2024-02-20" },

  // -- MARCO 2024
  { id: "fin-9", obraId: "obra-1", tipo: "RECEITA", categoria: "Medicao", descricao: "1a Medicao - Residencial Aurora", valor: 112500, data: "2024-03-20", dataPagamento: "2024-03-22", status: "PAGO", fornecedorCliente: "Maria Oliveira", criadoEm: "2024-03-15" },
  { id: "fin-10", obraId: "obra-1", tipo: "DESPESA", categoria: "Material", descricao: "Cimento e agregados - Aurora", valor: 45000, data: "2024-03-10", dataPagamento: "2024-03-12", status: "PAGO", fornecedorCliente: "Materiais Paulista Ltda", criadoEm: "2024-03-08" },
  { id: "fin-11", obraId: "obra-2", tipo: "DESPESA", categoria: "Equipamento", descricao: "Aluguel grua torre - Plaza", valor: 18500, data: "2024-03-20", dataPagamento: "2024-03-20", status: "PAGO", fornecedorCliente: "LocaEquip Ltda", parcela: 2, totalParcelas: 3, criadoEm: "2024-03-15" },
  { id: "fin-12", tipo: "DESPESA", categoria: "Administrativo", descricao: "Aluguel escritorio sede - Mar", valor: 8500, data: "2024-03-05", dataPagamento: "2024-03-05", status: "PAGO", criadoEm: "2024-03-01" },
  { id: "fin-13", tipo: "RECEITA", categoria: "Consultoria", descricao: "Consultoria tecnica estrutural - Cliente avulso", valor: 9500, data: "2024-03-15", dataPagamento: "2024-03-18", status: "PAGO", fornecedorCliente: "Engenharia Total SA", criadoEm: "2024-03-10" },

  // -- ABRIL 2024
  { id: "fin-14", obraId: "obra-1", tipo: "DESPESA", categoria: "Mao de obra", descricao: "Equipe pedreiros - Aurora abr", valor: 34000, data: "2024-04-05", dataPagamento: "2024-04-07", status: "PAGO", fornecedorCliente: "Equipe Joao Silva", criadoEm: "2024-04-01" },
  { id: "fin-15", obraId: "obra-1", tipo: "DESPESA", categoria: "Material", descricao: "Aco CA-50 e ferragens - Aurora", valor: 52000, data: "2024-04-18", dataPagamento: "2024-04-19", status: "PAGO", fornecedorCliente: "AcoFlex Distribuidora", criadoEm: "2024-04-12" },
  { id: "fin-16", obraId: "obra-2", tipo: "DESPESA", categoria: "Equipamento", descricao: "Aluguel grua torre - Plaza", valor: 18500, data: "2024-04-20", dataPagamento: "2024-04-22", status: "PAGO", fornecedorCliente: "LocaEquip Ltda", parcela: 3, totalParcelas: 3, criadoEm: "2024-04-15" },
  { id: "fin-17", obraId: "obra-2", tipo: "DESPESA", categoria: "Mao de obra", descricao: "Equipe estrutural - Plaza abr", valor: 68000, data: "2024-04-05", dataPagamento: "2024-04-08", status: "PAGO", fornecedorCliente: "Construtora Estrutural ME", criadoEm: "2024-04-01" },
  { id: "fin-18", tipo: "DESPESA", categoria: "Administrativo", descricao: "Aluguel escritorio sede - Abr", valor: 8500, data: "2024-04-05", dataPagamento: "2024-04-05", status: "PAGO", criadoEm: "2024-04-01" },

  // -- MAIO 2024
  { id: "fin-19", obraId: "obra-1", tipo: "RECEITA", categoria: "Medicao", descricao: "2a Medicao - Residencial Aurora", valor: 112500, data: "2024-05-20", dataPagamento: "2024-05-23", status: "PAGO", fornecedorCliente: "Maria Oliveira", criadoEm: "2024-05-15" },
  { id: "fin-20", obraId: "obra-2", tipo: "RECEITA", categoria: "Medicao", descricao: "2a Medicao - Plaza Tower", valor: 240000, data: "2024-05-22", dataPagamento: "2024-05-25", status: "PAGO", fornecedorCliente: "Tech Corp Ltda", criadoEm: "2024-05-18" },
  { id: "fin-21", obraId: "obra-1", tipo: "DESPESA", categoria: "Combustivel", descricao: "Combustivel maquinas - Aurora mai", valor: 3200, data: "2024-05-28", dataPagamento: "2024-05-28", status: "PAGO", criadoEm: "2024-05-28" },
  { id: "fin-22", obraId: "obra-2", tipo: "DESPESA", categoria: "Material", descricao: "Estrutura metalica perfis W - Plaza", valor: 95000, data: "2024-05-12", dataPagamento: "2024-05-14", status: "PAGO", fornecedorCliente: "MetalPro Distribuidora", criadoEm: "2024-05-08" },
  { id: "fin-23", tipo: "DESPESA", categoria: "Administrativo", descricao: "Aluguel escritorio sede - Mai", valor: 8500, data: "2024-05-05", dataPagamento: "2024-05-05", status: "PAGO", criadoEm: "2024-05-01" },
  { id: "fin-24", tipo: "DESPESA", categoria: "Impostos", descricao: "ISS trimestral - 1T2024", valor: 14800, data: "2024-05-31", dataPagamento: "2024-05-31", status: "PAGO", criadoEm: "2024-05-20" },

  // -- JUNHO 2024
  { id: "fin-25", obraId: "obra-3", tipo: "RECEITA", categoria: "Medicao", descricao: "1a Medicao - Reforma Escritorio", valor: 42500, data: "2024-06-20", dataPagamento: "2024-06-22", status: "PAGO", fornecedorCliente: "Startup Innovation", criadoEm: "2024-06-15" },
  { id: "fin-26", obraId: "obra-3", tipo: "DESPESA", categoria: "Material", descricao: "Drywall, perfis e acabamentos", valor: 28000, data: "2024-06-10", dataPagamento: "2024-06-12", status: "PAGO", fornecedorCliente: "Drywall Express Ltda", criadoEm: "2024-06-05" },
  { id: "fin-27", obraId: "obra-1", tipo: "DESPESA", categoria: "Material", descricao: "Impermeabilizante e argamassa - Aurora", valor: 18500, data: "2024-06-25", dataPagamento: "2024-06-26", status: "PAGO", fornecedorCliente: "Materiais Paulista Ltda", criadoEm: "2024-06-20" },
  { id: "fin-28", tipo: "DESPESA", categoria: "Administrativo", descricao: "Aluguel escritorio sede - Jun", valor: 8500, data: "2024-06-05", dataPagamento: "2024-06-05", status: "PAGO", criadoEm: "2024-06-01" },

  // -- JULHO 2024
  { id: "fin-29", obraId: "obra-3", tipo: "RECEITA", categoria: "Medicao", descricao: "2a Medicao - Reforma Escritorio", valor: 42500, data: "2024-07-20", dataPagamento: "2024-07-23", status: "PAGO", fornecedorCliente: "Startup Innovation", criadoEm: "2024-07-15" },
  { id: "fin-30", obraId: "obra-3", tipo: "DESPESA", categoria: "Mao de obra", descricao: "Equipe reforma - Escritorio jul", valor: 35000, data: "2024-07-05", dataPagamento: "2024-07-07", status: "PAGO", fornecedorCliente: "Equipe Andre Martins", criadoEm: "2024-07-01" },
  { id: "fin-31", obraId: "obra-4", tipo: "DESPESA", categoria: "Projeto", descricao: "Projeto arquitetonico - Solar", valor: 85000, data: "2024-07-15", dataPagamento: "2024-07-18", status: "PAGO", fornecedorCliente: "Arq. Ana Paula Costa", criadoEm: "2024-07-10" },
  { id: "fin-32", tipo: "RECEITA", categoria: "Consultoria", descricao: "Laudo tecnico - Cliente avulso", valor: 8000, data: "2024-07-10", dataPagamento: "2024-07-12", status: "PAGO", fornecedorCliente: "Construtora Horizonte", criadoEm: "2024-07-08" },
  { id: "fin-33", tipo: "DESPESA", categoria: "Administrativo", descricao: "Aluguel escritorio sede - Jul", valor: 8500, data: "2024-07-05", dataPagamento: "2024-07-05", status: "PAGO", criadoEm: "2024-07-01" },
  { id: "fin-34", obraId: "obra-1", tipo: "DESPESA", categoria: "Alimentacao", descricao: "Refeicoes equipe - Aurora jul", valor: 4200, data: "2024-07-31", dataPagamento: "2024-07-31", status: "PAGO", criadoEm: "2024-07-25" },

  // -- AGOSTO 2024
  { id: "fin-35", obraId: "obra-4", tipo: "RECEITA", categoria: "Entrada", descricao: "Sinal contrato - Condominio Solar", valor: 350000, data: "2024-08-05", dataPagamento: "2024-08-07", status: "PAGO", fornecedorCliente: "Invest Group SA", criadoEm: "2024-08-01" },
  { id: "fin-36", obraId: "obra-4", tipo: "DESPESA", categoria: "Topografia", descricao: "Levantamento topografico - Solar", valor: 15000, data: "2024-08-10", dataPagamento: "2024-08-12", status: "PAGO", fornecedorCliente: "GeoTop Topografia", criadoEm: "2024-08-05" },
  { id: "fin-37", obraId: "obra-1", tipo: "RECEITA", categoria: "Medicao", descricao: "3a Medicao - Residencial Aurora", valor: 112500, data: "2024-08-20", dataPagamento: "2024-08-22", status: "PAGO", fornecedorCliente: "Maria Oliveira", criadoEm: "2024-08-15" },
  { id: "fin-38", obraId: "obra-1", tipo: "DESPESA", categoria: "Material", descricao: "Material eletrico - Aurora", valor: 38000, data: "2024-08-15", status: "VENCIDO", fornecedorCliente: "EletroMais Distribuidora", observacoes: "Fatura vencida aguardando liberacao financeira", criadoEm: "2024-08-10" },
  { id: "fin-39", obraId: "obra-2", tipo: "DESPESA", categoria: "Mao de obra", descricao: "Equipe estrutural - Plaza ago", valor: 55000, data: "2024-08-05", status: "VENCIDO", fornecedorCliente: "Construtora Estrutural ME", observacoes: "Aguardando aprovacao do gestor", criadoEm: "2024-08-01" },
  { id: "fin-40", obraId: "obra-3", tipo: "DESPESA", categoria: "Manutencao", descricao: "Correcao infiltracao - Escritorio", valor: 6500, data: "2024-08-18", status: "VENCIDO", fornecedorCliente: "HidroFix Ltda", criadoEm: "2024-08-14" },
  { id: "fin-41", tipo: "DESPESA", categoria: "Administrativo", descricao: "Aluguel escritorio sede - Ago", valor: 8500, data: "2024-08-05", status: "VENCIDO", observacoes: "Em negociacao de reajuste", criadoEm: "2024-08-01" },
  { id: "fin-42", obraId: "obra-4", tipo: "DESPESA", categoria: "Material", descricao: "Material terraplanagem - Solar", valor: 32000, data: "2024-08-28", status: "VENCIDO", fornecedorCliente: "TerraMove Equipamentos", criadoEm: "2024-08-22" },
  { id: "fin-43", obraId: "obra-2", tipo: "RECEITA", categoria: "Medicao", descricao: "3a Medicao - Plaza Tower", valor: 240000, data: "2024-09-10", status: "PENDENTE", fornecedorCliente: "Tech Corp Ltda", criadoEm: "2024-08-25" },
  { id: "fin-44", obraId: "obra-1", tipo: "RECEITA", categoria: "Medicao", descricao: "4a Medicao - Residencial Aurora", valor: 112500, data: "2024-09-20", status: "PENDENTE", fornecedorCliente: "Maria Oliveira", criadoEm: "2024-08-28" },
  { id: "fin-45", obraId: "obra-4", tipo: "RECEITA", categoria: "Medicao", descricao: "1a Medicao - Condominio Solar", valor: 175000, data: "2024-09-30", status: "PENDENTE", fornecedorCliente: "Invest Group SA", criadoEm: "2024-08-28" },
  { id: "fin-46", obraId: "obra-2", tipo: "DESPESA", categoria: "Equipamento", descricao: "Aluguel guindaste - Plaza set", valor: 25000, data: "2024-09-05", status: "PENDENTE", fornecedorCliente: "LocaEquip Ltda", criadoEm: "2024-08-20" },
  { id: "fin-47", tipo: "DESPESA", categoria: "Administrativo", descricao: "Aluguel escritorio sede - Set", valor: 8500, data: "2024-09-05", status: "PENDENTE", criadoEm: "2024-08-25" },
  { id: "fin-48", obraId: "obra-4", tipo: "DESPESA", categoria: "Mao de obra", descricao: "Servicos terraplanagem - Solar", valor: 48000, data: "2024-09-15", status: "PENDENTE", fornecedorCliente: "TerraMove Equipamentos", parcela: 1, totalParcelas: 2, criadoEm: "2024-08-28" },
  { id: "fin-49", obraId: "obra-3", tipo: "RECEITA", categoria: "Reembolso", descricao: "Reembolso materiais extras - Escritorio", valor: 4800, data: "2024-09-01", status: "PENDENTE", fornecedorCliente: "Startup Innovation", criadoEm: "2024-08-25" },
  { id: "fin-50", obraId: "obra-1", tipo: "DESPESA", categoria: "Transporte", descricao: "Frete materiais - Aurora set", valor: 2800, data: "2024-09-08", status: "PENDENTE", criadoEm: "2024-08-28" },
];

export const ordensServicoIniciais: OrdemServico[] = [
  { id: "os-1", numero: 1001, obraId: "obra-1", clienteId: "cli-1", cliente: "Maria Oliveira", local: "Rua das Flores, 234 - Sao Paulo/SP", tecnicoId: "col-7", tecnico: "Lucas Ferreira", tipoServico: "Instalacao Eletrica", descricao: "Instalacao eletrica 2o pavimento", prioridade: "ALTA", status: "EM_ANDAMENTO", dataAbertura: "2024-08-10", dataAgendada: "2024-08-12", valorEstimado: 8500, checklist: [{id: "ck-1", descricao: "Passar tubulacao", concluido: true}, {id: "ck-2", descricao: "Instalar quadro de distribuicao", concluido: true}, {id: "ck-3", descricao: "Passar fiacao", concluido: false}, {id: "ck-4", descricao: "Instalar tomadas e interruptores", concluido: false}], materiais: [{id: "mos-1", materialId: "est-5", nome: "Fio 2.5mm", quantidade: 200, unidade: "m"}], fotos: [], horaInicio: "08:00", observacoes: "Priorizar suite master" },
  { id: "os-2", numero: 1002, obraId: "obra-1", clienteId: "cli-1", cliente: "Maria Oliveira", local: "Rua das Flores, 234 - Sao Paulo/SP", tecnicoId: "col-2", tecnico: "Carlos Santos", tipoServico: "Hidraulica", descricao: "Hidraulica banheiros", prioridade: "MEDIA", status: "ABERTA", dataAbertura: "2024-08-12", dataAgendada: "2024-08-20", valorEstimado: 6200, checklist: [{id: "ck-5", descricao: "Instalar tubulacao agua fria", concluido: false}, {id: "ck-6", descricao: "Instalar tubulacao agua quente", concluido: false}, {id: "ck-7", descricao: "Instalar loucas", concluido: false}], materiais: [{id: "mos-2", materialId: "est-7", nome: "Tubo PVC 25mm", quantidade: 50, unidade: "m"}], fotos: [], observacoes: "" },
  { id: "os-3", numero: 1003, obraId: "obra-2", clienteId: "cli-2", cliente: "Tech Corp Ltda", local: "Av. Paulista, 1500 - Campinas/SP", tecnicoId: "col-3", tecnico: "Pedro Lima", tipoServico: "Estrutura Metalica", descricao: "Montagem estrutura metalica 5o andar", prioridade: "ALTA", status: "EM_ANDAMENTO", dataAbertura: "2024-08-05", dataAgendada: "2024-08-06", valorEstimado: 45000, checklist: [{id: "ck-8", descricao: "Montar pilares", concluido: true}, {id: "ck-9", descricao: "Soldar vigas principais", concluido: true}, {id: "ck-10", descricao: "Soldar vigas secundarias", concluido: false}, {id: "ck-11", descricao: "Fixar contraventamentos", concluido: false}], materiais: [{id: "mos-3", materialId: "est-6", nome: "Perfil metalico W200", quantidade: 20, unidade: "un"}], fotos: [], horaInicio: "07:00", observacoes: "Guindaste reservado" },
  { id: "os-4", numero: 1004, obraId: "obra-2", clienteId: "cli-2", cliente: "Tech Corp Ltda", local: "Av. Paulista, 1500 - Campinas/SP", tecnicoId: "col-4", tecnico: "Roberto Costa", tipoServico: "Concretagem", descricao: "Concretagem laje 4o andar", prioridade: "URGENTE", status: "AGUARDANDO_MATERIAL", dataAbertura: "2024-08-08", dataAgendada: "2024-08-15", valorEstimado: 32000, checklist: [{id: "ck-12", descricao: "Montar formas", concluido: true}, {id: "ck-13", descricao: "Armar ferragem", concluido: true}, {id: "ck-14", descricao: "Conferir nivel", concluido: true}, {id: "ck-15", descricao: "Concretar", concluido: false}], materiais: [{id: "mos-4", materialId: "est-1", nome: "Concreto usinado fck30", quantidade: 45, unidade: "m3"}], fotos: [], observacoes: "Aguardando entrega do concreto" },
  { id: "os-5", numero: 1005, obraId: "obra-3", clienteId: "cli-3", cliente: "Startup Innovation", local: "Rua do Comercio, 45 - Rio de Janeiro/RJ", tecnicoId: "col-5", tecnico: "Andre Martins", tipoServico: "Pintura", descricao: "Pintura final escritorios", prioridade: "MEDIA", status: "ABERTA", dataAbertura: "2024-08-15", dataAgendada: "2024-08-22", valorEstimado: 12000, checklist: [{id: "ck-16", descricao: "Lixar paredes", concluido: false}, {id: "ck-17", descricao: "Aplicar massa corrida", concluido: false}, {id: "ck-18", descricao: "Aplicar selador", concluido: false}, {id: "ck-19", descricao: "Pintura 1a demao", concluido: false}, {id: "ck-20", descricao: "Pintura 2a demao", concluido: false}], materiais: [{id: "mos-5", materialId: "est-10", nome: "Tinta acrilica branca", quantidade: 40, unidade: "l"}], fotos: [], observacoes: "" },
  { id: "os-6", numero: 1006, obraId: "obra-3", clienteId: "cli-3", cliente: "Startup Innovation", local: "Rua do Comercio, 45 - Rio de Janeiro/RJ", tecnicoId: "col-5", tecnico: "Andre Martins", tipoServico: "Piso", descricao: "Instalacao piso vinilico", prioridade: "BAIXA", status: "FINALIZADA", dataAbertura: "2024-07-20", dataAgendada: "2024-07-25", dataConclusao: "2024-08-01", valorEstimado: 18500, checklist: [{id: "ck-21", descricao: "Nivelar contrapiso", concluido: true}, {id: "ck-22", descricao: "Instalar piso vinilico", concluido: true}, {id: "ck-23", descricao: "Instalar rodapes", concluido: true}], materiais: [{id: "mos-6", materialId: "est-11", nome: "Piso vinilico", quantidade: 200, unidade: "m2"}], fotos: [], horaInicio: "07:30", horaFim: "17:00", observacoes: "Entrega realizada com sucesso" },
  { id: "os-7", numero: 1007, obraId: "obra-1", clienteId: "cli-1", cliente: "Maria Oliveira", local: "Rua das Flores, 234 - Sao Paulo/SP", tecnicoId: "col-1", tecnico: "Joao Silva", tipoServico: "Revestimento", descricao: "Revestimento fachada", prioridade: "MEDIA", status: "FINALIZADA", dataAbertura: "2024-07-01", dataAgendada: "2024-07-05", dataConclusao: "2024-07-28", valorEstimado: 28000, checklist: [{id: "ck-24", descricao: "Chapisco fachada", concluido: true}, {id: "ck-25", descricao: "Reboco", concluido: true}, {id: "ck-26", descricao: "Textura acrilica", concluido: true}], materiais: [], fotos: [], horaInicio: "07:00", horaFim: "16:30", observacoes: "Concluido antes do prazo" },
  { id: "os-8", numero: 1008, obraId: "obra-4", clienteId: "cli-4", cliente: "Invest Group SA", local: "Rod. BR-040, Km 12 - Belo Horizonte/MG", tecnicoId: "col-6", tecnico: "Marcos Alves", tipoServico: "Terraplanagem", descricao: "Terraplanagem area construcao", prioridade: "ALTA", status: "ABERTA", dataAbertura: "2024-08-18", dataAgendada: "2024-08-25", valorEstimado: 55000, checklist: [{id: "ck-27", descricao: "Limpar terreno", concluido: false}, {id: "ck-28", descricao: "Corte e aterro", concluido: false}, {id: "ck-29", descricao: "Compactar solo", concluido: false}, {id: "ck-30", descricao: "Conferir nivelamento", concluido: false}], materiais: [], fotos: [], observacoes: "Maquinario ja disponivel" },
];

export const colaboradoresIniciais: Colaborador[] = [
  { id: "col-1", nome: "Joao Silva", cpf: "123.456.789-00", cargo: "Mestre de Obras", telefone: "(11) 99123-4567", endereco: "Rua A, 100 - Sao Paulo/SP", status: "ATIVO", salario: 6500, dataAdmissao: "2022-03-15" },
  { id: "col-2", nome: "Carlos Santos", cpf: "234.567.890-11", cargo: "Encanador", telefone: "(11) 99234-5678", endereco: "Rua B, 200 - Sao Paulo/SP", status: "ATIVO", salario: 4200, dataAdmissao: "2022-06-01" },
  { id: "col-3", nome: "Pedro Lima", cpf: "345.678.901-22", cargo: "Soldador", telefone: "(11) 99345-6789", endereco: "Rua C, 300 - Campinas/SP", status: "ATIVO", salario: 4800, dataAdmissao: "2023-01-10" },
  { id: "col-4", nome: "Roberto Costa", cpf: "456.789.012-33", cargo: "Pedreiro", telefone: "(11) 99456-7890", endereco: "Rua D, 400 - Sao Paulo/SP", status: "ATIVO", salario: 3800, dataAdmissao: "2023-03-20" },
  { id: "col-5", nome: "Andre Martins", cpf: "567.890.123-44", cargo: "Pintor", telefone: "(21) 99567-8901", endereco: "Rua E, 500 - Rio de Janeiro/RJ", status: "ATIVO", salario: 3500, dataAdmissao: "2023-05-15" },
  { id: "col-6", nome: "Marcos Alves", cpf: "678.901.234-55", cargo: "Operador de Maquinas", telefone: "(31) 99678-9012", endereco: "Rua F, 600 - Belo Horizonte/MG", status: "ATIVO", salario: 5200, dataAdmissao: "2022-09-01" },
  { id: "col-7", nome: "Lucas Ferreira", cpf: "789.012.345-66", cargo: "Eletricista", telefone: "(11) 99789-0123", endereco: "Rua G, 700 - Sao Paulo/SP", status: "ATIVO", salario: 4500, dataAdmissao: "2023-02-01" },
  { id: "col-8", nome: "Rafael Souza", cpf: "890.123.456-77", cargo: "Engenheiro Civil", telefone: "(11) 99890-1234", endereco: "Rua H, 800 - Sao Paulo/SP", status: "ATIVO", salario: 12000, dataAdmissao: "2021-06-01" },
  { id: "col-9", nome: "Ana Paula Costa", cpf: "901.234.567-88", cargo: "Arquiteta", telefone: "(11) 99901-2345", endereco: "Rua I, 900 - Sao Paulo/SP", status: "ATIVO", salario: 10000, dataAdmissao: "2022-01-15" },
  { id: "col-10", nome: "Fernando Dias", cpf: "012.345.678-99", cargo: "Pedreiro", telefone: "(11) 99012-3456", endereco: "Rua J, 1000 - Sao Paulo/SP", status: "FERIAS", salario: 3800, dataAdmissao: "2022-08-10" },
];

export const colaboradoresObraIniciais: ColaboradorObra[] = [
  { id: "co-1", obraId: "obra-1", nome: "Joao Silva", cargo: "Mestre de Obras", horasTrabalhadas: 320 },
  { id: "co-2", obraId: "obra-1", nome: "Carlos Santos", cargo: "Encanador", horasTrabalhadas: 180 },
  { id: "co-3", obraId: "obra-1", nome: "Lucas Ferreira", cargo: "Eletricista", horasTrabalhadas: 160 },
  { id: "co-4", obraId: "obra-1", nome: "Roberto Costa", cargo: "Pedreiro", horasTrabalhadas: 280 },
  { id: "co-5", obraId: "obra-2", nome: "Pedro Lima", cargo: "Soldador", horasTrabalhadas: 240 },
  { id: "co-6", obraId: "obra-2", nome: "Roberto Costa", cargo: "Pedreiro", horasTrabalhadas: 200 },
  { id: "co-7", obraId: "obra-2", nome: "Marcos Alves", cargo: "Operador de Maquinas", horasTrabalhadas: 160 },
  { id: "co-8", obraId: "obra-2", nome: "Rafael Souza", cargo: "Engenheiro Civil", horasTrabalhadas: 120 },
  { id: "co-9", obraId: "obra-3", nome: "Andre Martins", cargo: "Pintor", horasTrabalhadas: 140 },
  { id: "co-10", obraId: "obra-3", nome: "Lucas Ferreira", cargo: "Eletricista", horasTrabalhadas: 80 },
  { id: "co-11", obraId: "obra-4", nome: "Ana Paula Costa", cargo: "Arquiteta", horasTrabalhadas: 60 },
  { id: "co-12", obraId: "obra-4", nome: "Rafael Souza", cargo: "Engenheiro Civil", horasTrabalhadas: 40 },
];

export const materiaisObraIniciais: MaterialObra[] = [
  { id: "mat-1", obraId: "obra-1", nome: "Cimento CP-II", unidade: "saco 50kg", quantidade: 200, custoUnitario: 32, custoTotal: 6400 },
  { id: "mat-2", obraId: "obra-1", nome: "Aco CA-50 10mm", unidade: "barra 12m", quantidade: 150, custoUnitario: 45, custoTotal: 6750 },
  { id: "mat-3", obraId: "obra-1", nome: "Areia media", unidade: "m3", quantidade: 30, custoUnitario: 120, custoTotal: 3600 },
  { id: "mat-4", obraId: "obra-1", nome: "Tijolo ceramico", unidade: "milheiro", quantidade: 15, custoUnitario: 680, custoTotal: 10200 },
  { id: "mat-5", obraId: "obra-2", nome: "Concreto usinado fck30", unidade: "m3", quantidade: 450, custoUnitario: 380, custoTotal: 171000 },
  { id: "mat-6", obraId: "obra-2", nome: "Perfil metalico W200", unidade: "barra 6m", quantidade: 80, custoUnitario: 890, custoTotal: 71200 },
  { id: "mat-7", obraId: "obra-3", nome: "Placa drywall ST", unidade: "placa", quantidade: 120, custoUnitario: 48, custoTotal: 5760 },
  { id: "mat-8", obraId: "obra-3", nome: "Piso vinilico", unidade: "m2", quantidade: 200, custoUnitario: 65, custoTotal: 13000 },
  { id: "mat-9", obraId: "obra-4", nome: "Brita n1", unidade: "m3", quantidade: 50, custoUnitario: 95, custoTotal: 4750 },
];

export const diarioObraIniciais: DiarioObra[] = [
  { id: "diario-1", obraId: "obra-1", data: "2024-08-19", clima: "ENSOLARADO", descricao: "Inicio da montagem das formas para concretagem da laje do 2o pavimento. Equipe completa presente. Recebimento de 50 sacos de cimento.", fotos: [], criadoEm: "2024-08-19" },
  { id: "diario-2", obraId: "obra-1", data: "2024-08-18", clima: "NUBLADO", descricao: "Continuacao da instalacao eletrica do 1o pavimento. Eletricista finalizou circuitos da suite master. Aguardando material para banheiro.", fotos: [], criadoEm: "2024-08-18" },
  { id: "diario-3", obraId: "obra-1", data: "2024-08-17", clima: "CHUVOSO", descricao: "Trabalho interno apenas devido a chuva. Equipe focada em revestimentos internos e instalacoes hidraulicas.", fotos: [], criadoEm: "2024-08-17" },
  { id: "diario-4", obraId: "obra-2", data: "2024-08-19", clima: "ENSOLARADO", descricao: "Montagem da estrutura metalica do 5o andar em andamento. Guindaste operando normalmente. Previsao de finalizacao em 3 dias.", fotos: [], criadoEm: "2024-08-19" },
  { id: "diario-5", obraId: "obra-2", data: "2024-08-18", clima: "ENSOLARADO", descricao: "Concretagem finalizada na laje do 4o andar. Resultado satisfatorio nos testes de slump. Cura iniciada.", fotos: [], criadoEm: "2024-08-18" },
  { id: "diario-6", obraId: "obra-3", data: "2024-08-19", clima: "NUBLADO", descricao: "Pintura das paredes internas quase finalizada. Faltam apenas salas de reuniao. Instalacao do piso vinilico comecou na recepcao.", fotos: [], criadoEm: "2024-08-19" },
];

export const timelineObraIniciais: TimelineObra[] = [
  { id: "tl-1", obraId: "obra-1", tipo: "MILESTONE", titulo: "Fundacao concluida", descricao: "Fundacao radier finalizada com sucesso", data: "2024-04-10", criadoEm: "2024-04-10" },
  { id: "tl-2", obraId: "obra-1", tipo: "MILESTONE", titulo: "Estrutura 1o pav. concluida", descricao: "Estrutura do primeiro pavimento finalizada e desformada", data: "2024-06-15", criadoEm: "2024-06-15" },
  { id: "tl-3", obraId: "obra-1", tipo: "ACTIVITY", titulo: "Inicio instalacoes eletricas", descricao: "Equipe de eletricistas iniciou os trabalhos no 1o pavimento", data: "2024-07-01", criadoEm: "2024-07-01" },
  { id: "tl-4", obraId: "obra-1", tipo: "NOTE", titulo: "Reuniao com cliente", descricao: "Cliente solicitou alteracao no projeto da varanda. Aprovado ajuste.", data: "2024-07-20", criadoEm: "2024-07-20" },
  { id: "tl-5", obraId: "obra-1", tipo: "MILESTONE", titulo: "Estrutura 2o pav. concluida", descricao: "Estrutura do segundo pavimento finalizada", data: "2024-08-10", criadoEm: "2024-08-10" },
  { id: "tl-6", obraId: "obra-2", tipo: "MILESTONE", titulo: "Fundacao concluida", descricao: "Estacas e blocos de fundacao concluidos", data: "2024-02-20", criadoEm: "2024-02-20" },
  { id: "tl-7", obraId: "obra-2", tipo: "MILESTONE", titulo: "Estrutura ate 3o andar", descricao: "Conclusao da estrutura de concreto ate o 3o andar", data: "2024-05-30", criadoEm: "2024-05-30" },
  { id: "tl-8", obraId: "obra-2", tipo: "ACTIVITY", titulo: "Montagem estrutura metalica", descricao: "Inicio da montagem dos perfis metalicos a partir do 4o andar", data: "2024-07-15", criadoEm: "2024-07-15" },
];

export const documentosObraIniciais: DocumentoObra[] = [
  { id: "doc-1", obraId: "obra-1", nome: "Contrato de Prestacao de Servicos", tipo: "CONTRATO", url: "#", criadoEm: "2024-03-10" },
  { id: "doc-2", obraId: "obra-1", nome: "Projeto Arquitetonico", tipo: "PROJETO", url: "#", criadoEm: "2024-03-05" },
  { id: "doc-3", obraId: "obra-1", nome: "Alvara de Construcao", tipo: "ALVARA", url: "#", criadoEm: "2024-03-12" },
  { id: "doc-4", obraId: "obra-2", nome: "Contrato Comercial Plaza", tipo: "CONTRATO", url: "#", criadoEm: "2024-01-05" },
  { id: "doc-5", obraId: "obra-2", nome: "Projeto Estrutural", tipo: "PROJETO", url: "#", criadoEm: "2024-01-03" },
  { id: "doc-6", obraId: "obra-3", nome: "Contrato de Reforma", tipo: "CONTRATO", url: "#", criadoEm: "2024-05-25" },
  { id: "doc-7", obraId: "obra-3", nome: "Orcamento Aprovado", tipo: "ORCAMENTO", url: "#", criadoEm: "2024-05-20" },
];

export const eventosCalendarioIniciais: EventoCalendario[] = [
  { id: "ev-1", titulo: "Pagamento equipe Aurora", data: "2024-09-05", tipo: "VENCIMENTO", descricao: "Folha de pagamento equipe Residencial Aurora" },
  { id: "ev-2", titulo: "Entrega medicao Plaza", data: "2024-09-10", tipo: "ENTREGA", descricao: "Entrega da 3a medicao ao cliente" },
  { id: "ev-3", titulo: "Reuniao cliente Solar", data: "2024-09-08", tipo: "REUNIAO", descricao: "Apresentacao do projeto executivo" },
  { id: "ev-4", titulo: "Manutencao guindaste", data: "2024-09-12", tipo: "MANUTENCAO", descricao: "Manutencao preventiva guindaste Plaza" },
  { id: "ev-5", titulo: "Vencimento aluguel sede", data: "2024-09-05", tipo: "VENCIMENTO", descricao: "Pagamento aluguel escritorio sede" },
  { id: "ev-6", titulo: "Entrega final Escritorio", data: "2024-09-15", tipo: "ENTREGA", descricao: "Entrega da reforma ao cliente Startup Innovation" },
  { id: "ev-7", titulo: "Reuniao equipe semanal", data: "2024-09-09", tipo: "REUNIAO", descricao: "Planejamento semanal com mestres de obra" },
  { id: "ev-8", titulo: "Pagamento fornecedores", data: "2024-09-15", tipo: "VENCIMENTO", descricao: "Pagamento fornecedores de material" },
];

export const fotosObraIniciais: FotoObra[] = [
  { id: "foto-1", obraId: "obra-1", url: "", descricao: "Fundacao concluida", criadoEm: "2024-04-10" },
  { id: "foto-2", obraId: "obra-1", url: "", descricao: "Estrutura 1o pavimento", criadoEm: "2024-06-15" },
  { id: "foto-3", obraId: "obra-1", url: "", descricao: "Vista lateral", criadoEm: "2024-07-20" },
  { id: "foto-4", obraId: "obra-2", url: "", descricao: "Canteiro de obras", criadoEm: "2024-02-01" },
  { id: "foto-5", obraId: "obra-2", url: "", descricao: "Estrutura de concreto", criadoEm: "2024-05-30" },
  { id: "foto-6", obraId: "obra-3", url: "", descricao: "Antes da reforma", criadoEm: "2024-06-01" },
  { id: "foto-7", obraId: "obra-3", url: "", descricao: "Durante a reforma", criadoEm: "2024-07-15" },
];

export const presencasIniciais: PresencaColaborador[] = [
  { id: "pres-1", colaboradorId: "col-1", data: "2024-08-19", checkIn: "07:00", checkOut: "17:00", horas: 9, tipo: "NORMAL" },
  { id: "pres-2", colaboradorId: "col-1", data: "2024-08-18", checkIn: "07:00", checkOut: "17:00", horas: 9, tipo: "NORMAL" },
  { id: "pres-3", colaboradorId: "col-1", data: "2024-08-17", checkIn: "07:00", checkOut: "19:00", horas: 11, tipo: "EXTRA" },
  { id: "pres-4", colaboradorId: "col-2", data: "2024-08-19", checkIn: "07:30", checkOut: "16:30", horas: 8, tipo: "NORMAL" },
  { id: "pres-5", colaboradorId: "col-2", data: "2024-08-18", checkIn: "07:30", checkOut: "16:30", horas: 8, tipo: "NORMAL" },
  { id: "pres-6", colaboradorId: "col-3", data: "2024-08-19", checkIn: "07:00", checkOut: "17:00", horas: 9, tipo: "NORMAL" },
  { id: "pres-7", colaboradorId: "col-4", data: "2024-08-19", checkIn: "07:00", checkOut: "17:00", horas: 9, tipo: "NORMAL" },
  { id: "pres-8", colaboradorId: "col-4", data: "2024-08-16", checkIn: "", checkOut: "", horas: 0, tipo: "FALTA" },
  { id: "pres-9", colaboradorId: "col-5", data: "2024-08-19", checkIn: "08:00", checkOut: "18:00", horas: 9, tipo: "NORMAL" },
  { id: "pres-10", colaboradorId: "col-6", data: "2024-08-19", checkIn: "06:00", checkOut: "16:00", horas: 9, tipo: "NORMAL" },
  { id: "pres-11", colaboradorId: "col-7", data: "2024-08-19", checkIn: "07:00", checkOut: "17:00", horas: 9, tipo: "NORMAL" },
  { id: "pres-12", colaboradorId: "col-8", data: "2024-08-19", checkIn: "08:00", checkOut: "18:00", horas: 9, tipo: "NORMAL" },
];

export const pagamentosIniciais: PagamentoColaborador[] = [
  { id: "pag-1", colaboradorId: "col-1", tipo: "SALARIO", valor: 6500, data: "2024-08-05", status: "PAGO", descricao: "Salario agosto/2024" },
  { id: "pag-2", colaboradorId: "col-2", tipo: "SALARIO", valor: 4200, data: "2024-08-05", status: "PAGO", descricao: "Salario agosto/2024" },
  { id: "pag-3", colaboradorId: "col-3", tipo: "SALARIO", valor: 4800, data: "2024-08-05", status: "PAGO", descricao: "Salario agosto/2024" },
  { id: "pag-4", colaboradorId: "col-4", tipo: "SALARIO", valor: 3800, data: "2024-08-05", status: "PAGO", descricao: "Salario agosto/2024" },
  { id: "pag-5", colaboradorId: "col-5", tipo: "SALARIO", valor: 3500, data: "2024-08-05", status: "PAGO", descricao: "Salario agosto/2024" },
  { id: "pag-6", colaboradorId: "col-1", tipo: "BONUS", valor: 1500, data: "2024-08-15", status: "PAGO", descricao: "Bonus produtividade" },
  { id: "pag-7", colaboradorId: "col-3", tipo: "ADIANTAMENTO", valor: 2000, data: "2024-08-10", status: "PAGO", descricao: "Adiantamento quinzenal" },
  { id: "pag-8", colaboradorId: "col-6", tipo: "SALARIO", valor: 5200, data: "2024-09-05", status: "PENDENTE", descricao: "Salario setembro/2024" },
  { id: "pag-9", colaboradorId: "col-7", tipo: "SALARIO", valor: 4500, data: "2024-09-05", status: "PENDENTE", descricao: "Salario setembro/2024" },
  { id: "pag-10", colaboradorId: "col-8", tipo: "SALARIO", valor: 12000, data: "2024-09-05", status: "PENDENTE", descricao: "Salario setembro/2024" },
];

export const documentosColaboradorIniciais: DocumentoColaborador[] = [
  { id: "docol-1", colaboradorId: "col-1", tipo: "RG", nome: "RG - Joao Silva", url: "#", criadoEm: "2022-03-15" },
  { id: "docol-2", colaboradorId: "col-1", tipo: "ASO", nome: "ASO Admissional", validade: "2025-03-15", url: "#", criadoEm: "2022-03-15" },
  { id: "docol-3", colaboradorId: "col-2", tipo: "CNH", nome: "CNH - Carlos Santos", validade: "2026-06-01", url: "#", criadoEm: "2022-06-01" },
  { id: "docol-4", colaboradorId: "col-3", tipo: "ASO", nome: "ASO Periodico", validade: "2025-01-10", url: "#", criadoEm: "2024-01-10" },
  { id: "docol-5", colaboradorId: "col-8", tipo: "CTPS", nome: "CTPS - Rafael Souza", url: "#", criadoEm: "2021-06-01" },
];

export const fornecedoresIniciais: Fornecedor[] = [
  { id: "forn-1", nome: "Materiais Paulista Ltda", cnpj: "12.345.678/0001-01", telefone: "(11) 3333-1111", email: "contato@materialspaulista.com.br", endereco: "Rua dos Materiais, 100 - Sao Paulo/SP" },
  { id: "forn-2", nome: "Concretex Ltda", cnpj: "23.456.789/0001-02", telefone: "(11) 3333-2222", email: "vendas@concretex.com.br", endereco: "Rod. Anhanguera, Km 20 - Campinas/SP" },
  { id: "forn-3", nome: "AcoFlex Distribuidora", cnpj: "34.567.890/0001-03", telefone: "(11) 3333-3333", email: "comercial@acoflex.com.br", endereco: "Av. Industrial, 500 - Guarulhos/SP" },
  { id: "forn-4", nome: "EletroMais Distribuidora", cnpj: "45.678.901/0001-04", telefone: "(11) 3333-4444", email: "vendas@eletromais.com.br", endereco: "Rua da Eletrica, 200 - Sao Paulo/SP" },
  { id: "forn-5", nome: "MetalPro Distribuidora", cnpj: "56.789.012/0001-05", telefone: "(19) 3333-5555", email: "contato@metalpro.com.br", endereco: "Distrito Industrial, 300 - Campinas/SP" },
];

export const materiaisEstoqueIniciais: MaterialEstoque[] = [
  { id: "est-1", codigo: "MAT-001", nome: "Concreto usinado fck30", unidade: "m3", quantidade: 120, estoqueMinimo: 30, valorUnitario: 380, fornecedorId: "forn-2", fornecedor: "Concretex Ltda" },
  { id: "est-2", codigo: "MAT-002", nome: "Cimento CP-II 50kg", unidade: "saco", quantidade: 450, estoqueMinimo: 100, valorUnitario: 32, fornecedorId: "forn-1", fornecedor: "Materiais Paulista Ltda" },
  { id: "est-3", codigo: "MAT-003", nome: "Aco CA-50 10mm", unidade: "kg", quantidade: 2500, estoqueMinimo: 500, valorUnitario: 8.5, fornecedorId: "forn-3", fornecedor: "AcoFlex Distribuidora" },
  { id: "est-4", codigo: "MAT-004", nome: "Areia media", unidade: "m3", quantidade: 45, estoqueMinimo: 15, valorUnitario: 120, fornecedorId: "forn-1", fornecedor: "Materiais Paulista Ltda" },
  { id: "est-5", codigo: "MAT-005", nome: "Fio eletrico 2.5mm", unidade: "m", quantidade: 800, estoqueMinimo: 200, valorUnitario: 3.5, fornecedorId: "forn-4", fornecedor: "EletroMais Distribuidora" },
  { id: "est-6", codigo: "MAT-006", nome: "Perfil metalico W200", unidade: "un", quantidade: 35, estoqueMinimo: 10, valorUnitario: 890, fornecedorId: "forn-5", fornecedor: "MetalPro Distribuidora" },
  { id: "est-7", codigo: "MAT-007", nome: "Tubo PVC 25mm", unidade: "m", quantidade: 180, estoqueMinimo: 50, valorUnitario: 12, fornecedorId: "forn-1", fornecedor: "Materiais Paulista Ltda" },
  { id: "est-8", codigo: "MAT-008", nome: "Tijolo ceramico 6 furos", unidade: "un", quantidade: 8000, estoqueMinimo: 2000, valorUnitario: 0.68, fornecedorId: "forn-1", fornecedor: "Materiais Paulista Ltda" },
  { id: "est-9", codigo: "MAT-009", nome: "Brita n1", unidade: "m3", quantidade: 30, estoqueMinimo: 10, valorUnitario: 95, fornecedorId: "forn-2", fornecedor: "Concretex Ltda" },
  { id: "est-10", codigo: "MAT-010", nome: "Tinta acrilica branca 18L", unidade: "un", quantidade: 25, estoqueMinimo: 8, valorUnitario: 289, fornecedorId: "forn-1", fornecedor: "Materiais Paulista Ltda" },
  { id: "est-11", codigo: "MAT-011", nome: "Piso vinilico", unidade: "m2", quantidade: 150, estoqueMinimo: 50, valorUnitario: 65, fornecedorId: "forn-1", fornecedor: "Materiais Paulista Ltda" },
  { id: "est-12", codigo: "MAT-012", nome: "Vergalhao 8mm", unidade: "kg", quantidade: 180, estoqueMinimo: 200, valorUnitario: 7.8, fornecedorId: "forn-3", fornecedor: "AcoFlex Distribuidora" },
  { id: "est-13", codigo: "MAT-013", nome: "Argamassa AC-III", unidade: "saco", quantidade: 60, estoqueMinimo: 20, valorUnitario: 42, fornecedorId: "forn-1", fornecedor: "Materiais Paulista Ltda" },
  { id: "est-14", codigo: "MAT-014", nome: "Disjuntor 20A", unidade: "un", quantidade: 15, estoqueMinimo: 20, valorUnitario: 28, fornecedorId: "forn-4", fornecedor: "EletroMais Distribuidora" },
  { id: "est-15", codigo: "MAT-015", nome: "Impermeabilizante 18L", unidade: "un", quantidade: 12, estoqueMinimo: 5, valorUnitario: 320, fornecedorId: "forn-1", fornecedor: "Materiais Paulista Ltda" },
];

export const movimentacoesIniciais: MovimentacaoEstoque[] = [
  { id: "mov-1", materialId: "est-2", materialNome: "Cimento CP-II 50kg", tipo: "ENTRADA", quantidade: 200, responsavel: "Joao Silva", motivo: "Compra mensal", data: "2024-08-01" },
  { id: "mov-2", materialId: "est-2", materialNome: "Cimento CP-II 50kg", tipo: "SAIDA", quantidade: 80, obraId: "obra-1", obraNome: "Residencial Aurora", responsavel: "Roberto Costa", motivo: "Uso em obra", data: "2024-08-05" },
  { id: "mov-3", materialId: "est-3", materialNome: "Aco CA-50 10mm", tipo: "ENTRADA", quantidade: 1500, responsavel: "Rafael Souza", motivo: "Compra fornecedor", data: "2024-08-02" },
  { id: "mov-4", materialId: "est-3", materialNome: "Aco CA-50 10mm", tipo: "SAIDA", quantidade: 600, obraId: "obra-2", obraNome: "Comercial Plaza Tower", responsavel: "Pedro Lima", motivo: "Estrutura 5o andar", data: "2024-08-06" },
  { id: "mov-5", materialId: "est-1", materialNome: "Concreto usinado fck30", tipo: "ENTRADA", quantidade: 80, responsavel: "Rafael Souza", motivo: "Pedido programado", data: "2024-08-03" },
  { id: "mov-6", materialId: "est-1", materialNome: "Concreto usinado fck30", tipo: "SAIDA", quantidade: 45, obraId: "obra-2", obraNome: "Comercial Plaza Tower", responsavel: "Roberto Costa", motivo: "Concretagem laje", data: "2024-08-08" },
  { id: "mov-7", materialId: "est-5", materialNome: "Fio eletrico 2.5mm", tipo: "ENTRADA", quantidade: 500, responsavel: "Lucas Ferreira", motivo: "Reposicao estoque", data: "2024-08-04" },
  { id: "mov-8", materialId: "est-5", materialNome: "Fio eletrico 2.5mm", tipo: "SAIDA", quantidade: 200, obraId: "obra-1", obraNome: "Residencial Aurora", responsavel: "Lucas Ferreira", motivo: "Instalacao eletrica", data: "2024-08-10" },
  { id: "mov-9", materialId: "est-6", materialNome: "Perfil metalico W200", tipo: "ENTRADA", quantidade: 40, responsavel: "Pedro Lima", motivo: "Pedido especial", data: "2024-08-01" },
  { id: "mov-10", materialId: "est-6", materialNome: "Perfil metalico W200", tipo: "SAIDA", quantidade: 20, obraId: "obra-2", obraNome: "Comercial Plaza Tower", responsavel: "Pedro Lima", motivo: "Montagem estrutura", data: "2024-08-05" },
  { id: "mov-11", materialId: "est-10", materialNome: "Tinta acrilica branca 18L", tipo: "ENTRADA", quantidade: 30, responsavel: "Andre Martins", motivo: "Compra para obra", data: "2024-08-12" },
  { id: "mov-12", materialId: "est-10", materialNome: "Tinta acrilica branca 18L", tipo: "SAIDA", quantidade: 10, obraId: "obra-3", obraNome: "Reforma Escritorio Central", responsavel: "Andre Martins", motivo: "Pintura escritorios", data: "2024-08-15" },
  { id: "mov-13", materialId: "est-7", materialNome: "Tubo PVC 25mm", tipo: "ENTRADA", quantidade: 100, responsavel: "Carlos Santos", motivo: "Reposicao", data: "2024-08-07" },
  { id: "mov-14", materialId: "est-7", materialNome: "Tubo PVC 25mm", tipo: "SAIDA", quantidade: 50, obraId: "obra-1", obraNome: "Residencial Aurora", responsavel: "Carlos Santos", motivo: "Instalacao hidraulica", data: "2024-08-12" },
  { id: "mov-15", materialId: "est-8", materialNome: "Tijolo ceramico 6 furos", tipo: "ENTRADA", quantidade: 5000, responsavel: "Joao Silva", motivo: "Compra grande volume", data: "2024-08-01" },
  { id: "mov-16", materialId: "est-8", materialNome: "Tijolo ceramico 6 furos", tipo: "SAIDA", quantidade: 3000, obraId: "obra-1", obraNome: "Residencial Aurora", responsavel: "Roberto Costa", motivo: "Alvenaria 2o pav", data: "2024-08-10" },
  { id: "mov-17", materialId: "est-4", materialNome: "Areia media", tipo: "ENTRADA", quantidade: 30, responsavel: "Joao Silva", motivo: "Entrega programada", data: "2024-08-05" },
  { id: "mov-18", materialId: "est-4", materialNome: "Areia media", tipo: "SAIDA", quantidade: 15, obraId: "obra-1", obraNome: "Residencial Aurora", responsavel: "Roberto Costa", motivo: "Massa de assentamento", data: "2024-08-08" },
  { id: "mov-19", materialId: "est-12", materialNome: "Vergalhao 8mm", tipo: "SAIDA", quantidade: 100, obraId: "obra-4", obraNome: "Condominio Solar das Palmeiras", responsavel: "Marcos Alves", motivo: "Fundacao", data: "2024-08-18" },
  { id: "mov-20", materialId: "est-14", materialNome: "Disjuntor 20A", tipo: "SAIDA", quantidade: 8, obraId: "obra-1", obraNome: "Residencial Aurora", responsavel: "Lucas Ferreira", motivo: "Quadro distribuicao", data: "2024-08-10" },
];

export const categoriasFinanceiras = {
  receita: ["Medicao", "Aditivo", "Reembolso", "Venda material", "Consultoria", "Entrada", "Outros"],
  despesa: ["Material", "Mao de obra", "Equipamento", "Combustivel", "Alimentacao", "Transporte", "Impostos", "Aluguel", "Manutencao", "Administrativo", "Projeto", "Topografia", "Outros"],
};

export const veiculosIniciais: Veiculo[] = [
  { id: "veic-1", nome: "Caminhonete Obra", placa: "ABC-1234", tipo: "CARRO", marca: "Toyota", modelo: "Hilux", ano: 2022, kmAtual: 45000, horimetro: 0, status: "ATIVO", criadoEm: "2022-03-01" },
  { id: "veic-2", nome: "Caminhao Basculante", placa: "DEF-5678", tipo: "CAMINHAO", marca: "Mercedes-Benz", modelo: "Atego 1719", ano: 2020, kmAtual: 82000, horimetro: 0, status: "ATIVO", criadoEm: "2020-06-15" },
  { id: "veic-3", nome: "Retroescavadeira", placa: "GHI-9012", tipo: "MAQUINA", marca: "Caterpillar", modelo: "416F2", ano: 2021, kmAtual: 0, horimetro: 3200, status: "ATIVO", criadoEm: "2021-01-20" },
  { id: "veic-4", nome: "Betoneira 400L", placa: "", tipo: "EQUIPAMENTO", marca: "CSM", modelo: "CS 400", ano: 2023, kmAtual: 0, horimetro: 850, status: "MANUTENCAO", criadoEm: "2023-02-10" },
  { id: "veic-5", nome: "Moto Mensageiro", placa: "JKL-3456", tipo: "MOTO", marca: "Honda", modelo: "CG 160", ano: 2023, kmAtual: 12000, horimetro: 0, status: "ATIVO", criadoEm: "2023-05-01" },
];

export const manutencoesVeiculoIniciais: ManutencaoVeiculo[] = [
  { id: "man-1", veiculoId: "veic-1", tipo: "REVISAO", descricao: "Revisao 40.000km - troca oleo, filtros, pastilhas", data: "2024-06-15", custo: 1850, kmNaManutencao: 40000, proximaKm: 50000, criadoEm: "2024-06-15" },
  { id: "man-2", veiculoId: "veic-1", tipo: "CORRETIVA", descricao: "Troca de pneus dianteiros", data: "2024-04-20", custo: 2400, kmNaManutencao: 38000, criadoEm: "2024-04-20" },
  { id: "man-3", veiculoId: "veic-2", tipo: "PREVENTIVA", descricao: "Troca oleo e filtros - revisao programada", data: "2024-07-10", custo: 2200, kmNaManutencao: 80000, proximaKm: 90000, criadoEm: "2024-07-10" },
  { id: "man-4", veiculoId: "veic-3", tipo: "CORRETIVA", descricao: "Reparo no sistema hidraulico", data: "2024-05-22", custo: 4500, kmNaManutencao: 0, criadoEm: "2024-05-22" },
  { id: "man-5", veiculoId: "veic-4", tipo: "CORRETIVA", descricao: "Troca do motor eletrico - queimado", data: "2024-08-01", custo: 3800, kmNaManutencao: 0, criadoEm: "2024-08-01" },
  { id: "man-6", veiculoId: "veic-2", tipo: "CORRETIVA", descricao: "Reparo freio pneumatico", data: "2024-03-05", custo: 1800, kmNaManutencao: 75000, criadoEm: "2024-03-05" },
  { id: "man-7", veiculoId: "veic-5", tipo: "REVISAO", descricao: "Revisao 10.000km", data: "2024-07-20", custo: 450, kmNaManutencao: 10000, proximaKm: 20000, criadoEm: "2024-07-20" },
];

export const abastecimentosVeiculoIniciais: AbastecimentoVeiculo[] = [
  { id: "abast-1", veiculoId: "veic-1", data: "2024-08-15", litros: 55, precoLitro: 5.89, total: 323.95, km: 44500, criadoEm: "2024-08-15" },
  { id: "abast-2", veiculoId: "veic-1", data: "2024-08-01", litros: 52, precoLitro: 5.85, total: 304.20, km: 44000, criadoEm: "2024-08-01" },
  { id: "abast-3", veiculoId: "veic-1", data: "2024-07-18", litros: 54, precoLitro: 5.79, total: 312.66, km: 43500, criadoEm: "2024-07-18" },
  { id: "abast-4", veiculoId: "veic-1", data: "2024-07-03", litros: 50, precoLitro: 5.75, total: 287.50, km: 43000, criadoEm: "2024-07-03" },
  { id: "abast-5", veiculoId: "veic-2", data: "2024-08-12", litros: 150, precoLitro: 5.49, total: 823.50, km: 81500, criadoEm: "2024-08-12" },
  { id: "abast-6", veiculoId: "veic-2", data: "2024-07-28", litros: 145, precoLitro: 5.45, total: 790.25, km: 80800, criadoEm: "2024-07-28" },
  { id: "abast-7", veiculoId: "veic-2", data: "2024-07-14", litros: 148, precoLitro: 5.42, total: 802.16, km: 80000, criadoEm: "2024-07-14" },
  { id: "abast-8", veiculoId: "veic-5", data: "2024-08-10", litros: 12, precoLitro: 5.89, total: 70.68, km: 11800, criadoEm: "2024-08-10" },
  { id: "abast-9", veiculoId: "veic-5", data: "2024-07-25", litros: 11, precoLitro: 5.85, total: 64.35, km: 11400, criadoEm: "2024-07-25" },
  { id: "abast-10", veiculoId: "veic-5", data: "2024-07-10", litros: 12, precoLitro: 5.79, total: 69.48, km: 11000, criadoEm: "2024-07-10" },
];

export const documentosVeiculoIniciais: DocumentoVeiculo[] = [
  { id: "docv-1", veiculoId: "veic-1", tipo: "CRLV", nome: "CRLV 2024 - Hilux", validade: "2025-03-01", url: "#", criadoEm: "2024-03-01" },
  { id: "docv-2", veiculoId: "veic-1", tipo: "SEGURO", nome: "Seguro auto - Porto Seguro", validade: "2025-03-15", url: "#", criadoEm: "2024-03-15" },
  { id: "docv-3", veiculoId: "veic-2", tipo: "CRLV", nome: "CRLV 2024 - Atego", validade: "2025-06-15", url: "#", criadoEm: "2024-06-15" },
  { id: "docv-4", veiculoId: "veic-2", tipo: "SEGURO", nome: "Seguro frota - Bradesco", validade: "2024-12-20", url: "#", criadoEm: "2023-12-20" },
  { id: "docv-5", veiculoId: "veic-5", tipo: "CRLV", nome: "CRLV 2024 - CG 160", validade: "2025-05-01", url: "#", criadoEm: "2024-05-01" },
  { id: "docv-6", veiculoId: "veic-3", tipo: "LICENCIAMENTO", nome: "Licenciamento maquina pesada", validade: "2025-01-20", url: "#", criadoEm: "2024-01-20" },
];

export const clientesIniciais: Cliente[] = [
  { id: "cli-1", tipo: "PF", nome: "Maria Oliveira", cpfCnpj: "123.456.789-00", telefone: "(11) 99876-5432", email: "maria.oliveira@email.com", cep: "01310-100", rua: "Rua das Flores", numero: "234", bairro: "Jardim Paulista", cidade: "Sao Paulo", uf: "SP", criadoEm: "2024-01-10" },
  { id: "cli-2", tipo: "PJ", nome: "Tech Corp Ltda", cpfCnpj: "12.345.678/0001-90", telefone: "(19) 3333-8888", email: "contato@techcorp.com.br", cep: "13015-001", rua: "Av. Paulista", numero: "1500", bairro: "Centro", cidade: "Campinas", uf: "SP", criadoEm: "2023-11-05" },
  { id: "cli-3", tipo: "PJ", nome: "Startup Innovation", cpfCnpj: "23.456.789/0001-01", telefone: "(21) 99777-6666", email: "contato@startupinnovation.com", cep: "20040-020", rua: "Rua do Comercio", numero: "45", bairro: "Centro", cidade: "Rio de Janeiro", uf: "RJ", criadoEm: "2024-02-20" },
  { id: "cli-4", tipo: "PJ", nome: "Invest Group SA", cpfCnpj: "34.567.890/0001-12", telefone: "(31) 3555-4444", email: "projetos@investgroup.com.br", cep: "30130-000", rua: "Rod. BR-040", numero: "Km 12", bairro: "Industrial", cidade: "Belo Horizonte", uf: "MG", criadoEm: "2024-04-15" },
  { id: "cli-5", tipo: "PF", nome: "Carlos Eduardo Mendes", cpfCnpj: "234.567.890-11", telefone: "(11) 98765-4321", email: "carlos.mendes@gmail.com", cep: "04543-011", rua: "Av. Brigadeiro Faria Lima", numero: "1200", bairro: "Itaim Bibi", cidade: "Sao Paulo", uf: "SP", criadoEm: "2024-03-01" },
  { id: "cli-6", tipo: "PF", nome: "Ana Paula Rodrigues", cpfCnpj: "345.678.901-22", telefone: "(11) 97654-3210", email: "ana.rodrigues@outlook.com", cep: "01311-200", rua: "Rua Augusta", numero: "890", bairro: "Consolacao", cidade: "Sao Paulo", uf: "SP", criadoEm: "2024-05-10" },
  { id: "cli-7", tipo: "PJ", nome: "Construtora Horizonte Ltda", cpfCnpj: "45.678.901/0001-23", telefone: "(11) 3222-1111", email: "comercial@horizonteconstrutora.com.br", cep: "09541-100", rua: "Rua Industrial", numero: "500", bairro: "Diadema", cidade: "Sao Bernardo do Campo", uf: "SP", criadoEm: "2024-01-25" },
  { id: "cli-8", tipo: "PF", nome: "Roberto Almeida Santos", cpfCnpj: "456.789.012-33", telefone: "(19) 98888-7777", email: "roberto.santos@yahoo.com", cep: "13025-320", rua: "Rua Conceicao", numero: "320", bairro: "Botafogo", cidade: "Campinas", uf: "SP", observacoes: "Cliente indicado pelo Carlos Mendes", criadoEm: "2024-06-01" },
];

export const documentosClienteIniciais: DocumentoCliente[] = [
  { id: "doccli-1", clienteId: "cli-1", tipo: "CONTRATO", nome: "Contrato Residencial Aurora", url: "#", criadoEm: "2024-03-10" },
  { id: "doccli-2", clienteId: "cli-2", tipo: "CONTRATO", nome: "Contrato Comercial Plaza", url: "#", criadoEm: "2024-01-05" },
  { id: "doccli-3", clienteId: "cli-2", tipo: "PROPOSTA", nome: "Proposta ampliacao estacionamento", url: "#", criadoEm: "2024-07-10" },
  { id: "doccli-4", clienteId: "cli-3", tipo: "CONTRATO", nome: "Contrato Reforma Escritorio", url: "#", criadoEm: "2024-05-25" },
  { id: "doccli-5", clienteId: "cli-4", tipo: "CONTRATO", nome: "Contrato Condominio Solar", url: "#", criadoEm: "2024-07-20" },
  { id: "doccli-6", clienteId: "cli-4", tipo: "ORCAMENTO", nome: "Orcamento fase 2 - Solar", url: "#", criadoEm: "2024-08-01" },
  { id: "doccli-7", clienteId: "cli-5", tipo: "PROPOSTA", nome: "Proposta reforma residencial", url: "#", criadoEm: "2024-03-15" },
  { id: "doccli-8", clienteId: "cli-7", tipo: "CONTRATO", nome: "Contrato parceria obras", url: "#", criadoEm: "2024-02-01" },
];

