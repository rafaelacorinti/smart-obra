"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  Building2,
  Users,
  FileText,
  DollarSign,
  Calculator,
  FolderOpen,
  ShoppingCart,
  ClipboardList,
} from "lucide-react";
import { obrasStorage, clientesStorage, contratosStorage, despesasStorage, orcamentosStorage, documentosStorage, comprasStorage, ordensStorage } from "@/lib/storage";
import type { SearchResult, SearchResultType } from "@/types";

const typeConfig: Record<SearchResultType, { icon: React.ElementType; label: string; color: string }> = {
  obra: { icon: Building2, label: "Obras", color: "text-orange-600 bg-orange-50" },
  cliente: { icon: Users, label: "Clientes", color: "text-blue-600 bg-blue-50" },
  contrato: { icon: FileText, label: "Contratos", color: "text-purple-600 bg-purple-50" },
  despesa: { icon: DollarSign, label: "Despesas", color: "text-red-600 bg-red-50" },
  orcamento: { icon: Calculator, label: "Orçamentos", color: "text-green-600 bg-green-50" },
  documento: { icon: FolderOpen, label: "Documentos", color: "text-yellow-600 bg-yellow-50" },
  compra: { icon: ShoppingCart, label: "Compras", color: "text-indigo-600 bg-indigo-50" },
  os: { icon: ClipboardList, label: "Ordens de Serviço", color: "text-teal-600 bg-teal-50" },
};

function searchAllData(query: string): Map<SearchResultType, SearchResult[]> {
  const q = query.toLowerCase().trim();
  if (!q) return new Map();

  const results = new Map<SearchResultType, SearchResult[]>();
  const MAX_PER_CATEGORY = 5;

  // Obras
  const obras = obrasStorage.getAll().filter((o) => o.nome.toLowerCase().includes(q) || o.endereco.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q)).slice(0, MAX_PER_CATEGORY).map((o) => ({ id: o.id, type: "obra" as const, title: o.nome, subtitle: `${o.cliente} - ${o.status}`, url: "/obras" }));
  if (obras.length) results.set("obra", obras);

  // Clientes
  const clientes = clientesStorage.getAll().filter((c) => c.nome.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.telefone.includes(q)).slice(0, MAX_PER_CATEGORY).map((c) => ({ id: c.id, type: "cliente" as const, title: c.nome, subtitle: c.email || c.telefone, url: "/clientes" }));
  if (clientes.length) results.set("cliente", clientes);

  // Contratos
  const contratos = contratosStorage.getAll().filter((c) => c.descricao.toLowerCase().includes(q) || c.status.toLowerCase().includes(q)).slice(0, MAX_PER_CATEGORY).map((c) => ({ id: c.id, type: "contrato" as const, title: `Contrato #${c.id.slice(0, 6)}`, subtitle: `R$ ${c.valor.toLocaleString("pt-BR")} - ${c.status}`, url: "/contratos" }));
  if (contratos.length) results.set("contrato", contratos);

  // Despesas
  const despesas = despesasStorage.getAll().filter((d) => d.descricao.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q)).slice(0, MAX_PER_CATEGORY).map((d) => ({ id: d.id, type: "despesa" as const, title: d.descricao, subtitle: `R$ ${d.valor.toLocaleString("pt-BR")} - ${d.categoria}`, url: "/despesas" }));
  if (despesas.length) results.set("despesa", despesas);

  // Orcamentos
  const orcamentos = orcamentosStorage.getAll().filter((o) => o.status.toLowerCase().includes(q) || o.valorTotal.toString().includes(q)).slice(0, MAX_PER_CATEGORY).map((o) => ({ id: o.id, type: "orcamento" as const, title: `Orçamento #${o.id.slice(0, 6)}`, subtitle: `R$ ${o.valorTotal.toLocaleString("pt-BR")} - ${o.status}`, url: "/orcamentos" }));
  if (orcamentos.length) results.set("orcamento", orcamentos);

  // Documentos
  const documentos = documentosStorage.getAll().filter((d) => d.nome.toLowerCase().includes(q) || d.tipo.toLowerCase().includes(q)).slice(0, MAX_PER_CATEGORY).map((d) => ({ id: d.id, type: "documento" as const, title: d.nome, subtitle: d.tipo, url: "/documentos" }));
  if (documentos.length) results.set("documento", documentos);

  // Compras
  const compras = comprasStorage.getAll().filter((c) => c.fornecedor.toLowerCase().includes(q) || c.status.toLowerCase().includes(q)).slice(0, MAX_PER_CATEGORY).map((c) => ({ id: c.id, type: "compra" as const, title: `Compra - ${c.fornecedor}`, subtitle: `R$ ${c.valorTotal.toLocaleString("pt-BR")} - ${c.status}`, url: "/compras" }));
  if (compras.length) results.set("compra", compras);

  // Ordens de Servico
  const ordens = ordensStorage.getAll().filter((o) => o.titulo.toLowerCase().includes(q) || o.responsavel.toLowerCase().includes(q) || o.descricao.toLowerCase().includes(q)).slice(0, MAX_PER_CATEGORY).map((o) => ({ id: o.id, type: "os" as const, title: o.titulo, subtitle: `${o.responsavel} - ${o.status}`, url: "/os" }));
  if (ordens.length) results.set("os", ordens);

  return results;
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Map<SearchResultType, SearchResult[]>>(new Map());
  const router = useRouter();
  const debounceRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setResults(searchAllData(query));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(result.url);
  };

  const totalResults = Array.from(results.values()).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors w-full max-w-sm"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-500">
          Ctrl+K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
          <div className="flex items-center border-b px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
            <input
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-500"
              placeholder="Buscar obras, clientes, despesas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {query && totalResults === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                Nenhum resultado encontrado para &quot;{query}&quot;
              </div>
            )}
            {Array.from(results.entries()).map(([type, items]) => {
              const config = typeConfig[type];
              const Icon = config.icon;
              return (
                <div key={type}>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    {config.label}
                  </div>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className={`rounded-lg p-2 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
            {!query && (
              <div className="py-8 text-center text-sm text-gray-500">
                Digite para buscar em obras, clientes, contratos...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}