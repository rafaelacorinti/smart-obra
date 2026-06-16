export interface Obra {
  id: string;
  nome: string;
  cliente: string;
  endereco: string;
  status: "em_andamento" | "pausada" | "concluida" | "cancelada";
  dataInicio: string;
  dataPrevisao: string;
  orcamento: number;
  progresso: number;
  descricao: string;
  createdAt: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpfCnpj: string;
  endereco: string;
  createdAt: string;
}

export interface Contrato {
  id: string;
  obraId: string;
  clienteId: string;
  valor: number;
  dataInicio: string;
  dataFim: string;
  status: "ativo" | "encerrado" | "cancelado";
  descricao: string;
  createdAt: string;
}

export interface Despesa {
  id: string;
  obraId: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  comprovante?: string;
  createdAt: string;
}

export interface Orcamento {
  id: string;
  obraId: string;
  clienteId: string;
  itens: OrcamentoItem[];
  valorTotal: number;
  status: "pendente" | "aprovado" | "recusado";
  dataValidade: string;
  createdAt: string;
}

export interface OrcamentoItem {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Documento {
  id: string;
  obraId: string;
  nome: string;
  tipo: string;
  url: string;
  createdAt: string;
}

export interface Compra {
  id: string;
  obraId: string;
  fornecedor: string;
  itens: CompraItem[];
  valorTotal: number;
  status: "pendente" | "aprovada" | "entregue" | "cancelada";
  dataPedido: string;
  dataEntrega?: string;
  createdAt: string;
}

export interface CompraItem {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface OrdemServico {
  id: string;
  obraId: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  status: "aberta" | "em_execucao" | "concluida" | "cancelada";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  dataAbertura: string;
  dataConclusao?: string;
  createdAt: string;
}

export interface DiarioObra {
  id: string;
  obraId: string;
  data: string;
  textoInformal: string;
  relatorioFormal?: string;
  clima?: string;
  trabalhadores?: number;
  atividades?: string[];
  createdAt: string;
}

export type SearchResultType = "obra" | "cliente" | "contrato" | "despesa" | "orcamento" | "documento" | "compra" | "os";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  url: string;
}
