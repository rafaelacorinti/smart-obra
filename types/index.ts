export type UserRole = "ADMIN" | "FINANCEIRO" | "GESTOR" | "TECNICO" | "VISUALIZADOR";
export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "CANCELLED";
export type ServiceOrderStatus = "OPEN" | "IN_PROGRESS" | "WAITING_MATERIAL" | "COMPLETED" | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type FinancialType = "PAYABLE" | "RECEIVABLE";
export type FinancialStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type Plan = "FREE" | "PRO" | "ENTERPRISE";
export type AccessRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalRevenue: number;
  totalExpenses: number;
  pendingOrders: number;
  totalEmployees: number;
  overduePayments: number;
  lowStockItems: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  companyName: string;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  cnpj: string;
  status: AccessRequestStatus;
  createdAt: string;
}

// Types used by dashboard modules
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

export type SearchResultType = "obra" | "cliente" | "contrato" | "despesa" | "orcamento" | "documento" | "compra" | "os";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  url: string;
}
