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
