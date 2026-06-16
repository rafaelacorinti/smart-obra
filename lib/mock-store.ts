import { AccessRequest } from "@/types";

// In-memory store for mock data (resets on server restart)
let accessRequests: AccessRequest[] = [
  {
    id: "req-1",
    name: "Joao Silva",
    email: "joao@construtora.com",
    phone: "(11) 99999-1234",
    companyName: "Construtora Silva",
    cnpj: "12.345.678/0001-90",
    status: "PENDING",
    createdAt: "2024-03-01T10:00:00Z",
  },
  {
    id: "req-2",
    name: "Ana Santos",
    email: "ana@engenharia.com",
    phone: "(21) 98888-5678",
    companyName: "Santos Engenharia",
    cnpj: "98.765.432/0001-10",
    status: "PENDING",
    createdAt: "2024-03-05T14:30:00Z",
  },
];

// Registered users (approved via access request system)
interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  companyName: string;
  active: boolean;
}

let registeredUsers: RegisteredUser[] = [];

export function getRegisteredUsers(): RegisteredUser[] {
  return registeredUsers;
}

export function registerUser(data: { name: string; email: string; password: string; companyName: string }): RegisteredUser {
  const user: RegisteredUser = {
    id: `user-${Date.now()}`,
    name: data.name,
    email: data.email,
    password: data.password,
    role: "GESTOR",
    companyName: data.companyName,
    active: true,
  };
  registeredUsers.push(user);
  return user;
}

export function getAccessRequests(): AccessRequest[] {
  return accessRequests;
}

export function getPendingAccessRequests(): AccessRequest[] {
  return accessRequests.filter((r) => r.status === "PENDING");
}

export function addAccessRequest(data: Omit<AccessRequest, "id" | "status" | "createdAt">): AccessRequest {
  const newRequest: AccessRequest = {
    ...data,
    id: `req-${Date.now()}`,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  accessRequests.push(newRequest);
  return newRequest;
}

export function approveAccessRequest(id: string): AccessRequest | null {
  const request = accessRequests.find((r) => r.id === id);
  if (request) {
    request.status = "APPROVED";
    return request;
  }
  return null;
}

export function rejectAccessRequest(id: string): AccessRequest | null {
  const request = accessRequests.find((r) => r.id === id);
  if (request) {
    request.status = "REJECTED";
    return request;
  }
  return null;
}
