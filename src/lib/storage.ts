import { Obra, Cliente, Contrato, Despesa, Orcamento, Documento, Compra, OrdemServico, DiarioObra } from "@/types";

function getItems<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setItems<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generic CRUD
function createItem<T extends { id: string; createdAt: string }>(key: string, item: Omit<T, "id" | "createdAt">): T {
  const items = getItems<T>(key);
  const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() } as T;
  items.push(newItem);
  setItems(key, items);
  return newItem;
}

function updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null {
  const items = getItems<T>(key);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setItems(key, items);
  return items[index];
}

function deleteItem<T extends { id: string }>(key: string, id: string): boolean {
  const items = getItems<T>(key);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  setItems(key, filtered);
  return true;
}

function getItem<T extends { id: string }>(key: string, id: string): T | null {
  const items = getItems<T>(key);
  return items.find((item) => item.id === id) || null;
}

// Storage keys
const KEYS = {
  obras: "smart-obra-obras",
  clientes: "smart-obra-clientes",
  contratos: "smart-obra-contratos",
  despesas: "smart-obra-despesas",
  orcamentos: "smart-obra-orcamentos",
  documentos: "smart-obra-documentos",
  compras: "smart-obra-compras",
  ordens: "smart-obra-ordens",
  diarios: "smart-obra-diarios",
} as const;

// Obras
export const obrasStorage = {
  getAll: () => getItems<Obra>(KEYS.obras),
  getById: (id: string) => getItem<Obra>(KEYS.obras, id),
  create: (obra: Omit<Obra, "id" | "createdAt">) => createItem<Obra>(KEYS.obras, obra),
  update: (id: string, updates: Partial<Obra>) => updateItem<Obra>(KEYS.obras, id, updates),
  delete: (id: string) => deleteItem<Obra>(KEYS.obras, id),
};

// Clientes
export const clientesStorage = {
  getAll: () => getItems<Cliente>(KEYS.clientes),
  getById: (id: string) => getItem<Cliente>(KEYS.clientes, id),
  create: (cliente: Omit<Cliente, "id" | "createdAt">) => createItem<Cliente>(KEYS.clientes, cliente),
  update: (id: string, updates: Partial<Cliente>) => updateItem<Cliente>(KEYS.clientes, id, updates),
  delete: (id: string) => deleteItem<Cliente>(KEYS.clientes, id),
};

// Contratos
export const contratosStorage = {
  getAll: () => getItems<Contrato>(KEYS.contratos),
  getById: (id: string) => getItem<Contrato>(KEYS.contratos, id),
  create: (contrato: Omit<Contrato, "id" | "createdAt">) => createItem<Contrato>(KEYS.contratos, contrato),
  update: (id: string, updates: Partial<Contrato>) => updateItem<Contrato>(KEYS.contratos, id, updates),
  delete: (id: string) => deleteItem<Contrato>(KEYS.contratos, id),
};

// Despesas
export const despesasStorage = {
  getAll: () => getItems<Despesa>(KEYS.despesas),
  getById: (id: string) => getItem<Despesa>(KEYS.despesas, id),
  create: (despesa: Omit<Despesa, "id" | "createdAt">) => createItem<Despesa>(KEYS.despesas, despesa),
  update: (id: string, updates: Partial<Despesa>) => updateItem<Despesa>(KEYS.despesas, id, updates),
  delete: (id: string) => deleteItem<Despesa>(KEYS.despesas, id),
};

// Orcamentos
export const orcamentosStorage = {
  getAll: () => getItems<Orcamento>(KEYS.orcamentos),
  getById: (id: string) => getItem<Orcamento>(KEYS.orcamentos, id),
  create: (orcamento: Omit<Orcamento, "id" | "createdAt">) => createItem<Orcamento>(KEYS.orcamentos, orcamento),
  update: (id: string, updates: Partial<Orcamento>) => updateItem<Orcamento>(KEYS.orcamentos, id, updates),
  delete: (id: string) => deleteItem<Orcamento>(KEYS.orcamentos, id),
};

// Documentos
export const documentosStorage = {
  getAll: () => getItems<Documento>(KEYS.documentos),
  getById: (id: string) => getItem<Documento>(KEYS.documentos, id),
  create: (doc: Omit<Documento, "id" | "createdAt">) => createItem<Documento>(KEYS.documentos, doc),
  update: (id: string, updates: Partial<Documento>) => updateItem<Documento>(KEYS.documentos, id, updates),
  delete: (id: string) => deleteItem<Documento>(KEYS.documentos, id),
};

// Compras
export const comprasStorage = {
  getAll: () => getItems<Compra>(KEYS.compras),
  getById: (id: string) => getItem<Compra>(KEYS.compras, id),
  create: (compra: Omit<Compra, "id" | "createdAt">) => createItem<Compra>(KEYS.compras, compra),
  update: (id: string, updates: Partial<Compra>) => updateItem<Compra>(KEYS.compras, id, updates),
  delete: (id: string) => deleteItem<Compra>(KEYS.compras, id),
};

// Ordens de Servico
export const ordensStorage = {
  getAll: () => getItems<OrdemServico>(KEYS.ordens),
  getById: (id: string) => getItem<OrdemServico>(KEYS.ordens, id),
  create: (os: Omit<OrdemServico, "id" | "createdAt">) => createItem<OrdemServico>(KEYS.ordens, os),
  update: (id: string, updates: Partial<OrdemServico>) => updateItem<OrdemServico>(KEYS.ordens, id, updates),
  delete: (id: string) => deleteItem<OrdemServico>(KEYS.ordens, id),
};

// Diarios de Obra
export const diariosStorage = {
  getAll: () => getItems<DiarioObra>(KEYS.diarios),
  getById: (id: string) => getItem<DiarioObra>(KEYS.diarios, id),
  create: (diario: Omit<DiarioObra, "id" | "createdAt">) => createItem<DiarioObra>(KEYS.diarios, diario),
  update: (id: string, updates: Partial<DiarioObra>) => updateItem<DiarioObra>(KEYS.diarios, id, updates),
  delete: (id: string) => deleteItem<DiarioObra>(KEYS.diarios, id),
};
