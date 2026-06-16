"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Building2,
  ClipboardList,
  Users,
  UserCircle,
  Package,
  ArrowRight,
  DollarSign,
  Calculator,
  ShoppingCart,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
  useObras,
  useOrdensServico,
  useColaboradores,
  useClientes,
  useMateriaisEstoque,
  useLancamentos,
  useOrcamentos,
  useFornecedores,
} from "@/hooks/use-storage-data";

type CategoryType =
  | "Obras"
  | "Clientes"
  | "Financeiro"
  | "Orcamentos"
  | "OS"
  | "Colaboradores"
  | "Materiais"
  | "Fornecedores";

interface SearchResult {
  id: string;
  category: CategoryType;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  route: string;
}

const CATEGORY_ORDER: CategoryType[] = [
  "Obras",
  "Clientes",
  "Financeiro",
  "Orcamentos",
  "OS",
  "Colaboradores",
  "Materiais",
  "Fornecedores",
];

const CATEGORY_ICONS: Record<CategoryType, React.ReactNode> = {
  Obras: <Building2 className="h-4 w-4 text-orange-500" />,
  Clientes: <UserCircle className="h-4 w-4 text-purple-500" />,
  Financeiro: <DollarSign className="h-4 w-4 text-emerald-500" />,
  Orcamentos: <Calculator className="h-4 w-4 text-cyan-500" />,
  OS: <ClipboardList className="h-4 w-4 text-blue-500" />,
  Colaboradores: <Users className="h-4 w-4 text-green-500" />,
  Materiais: <Package className="h-4 w-4 text-yellow-500" />,
  Fornecedores: <ShoppingCart className="h-4 w-4 text-rose-500" />,
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { obras } = useObras();
  const { ordens } = useOrdensServico();
  const { colaboradores } = useColaboradores();
  const { clientes } = useClientes();
  const { materiais } = useMateriaisEstoque();
  const { lancamentos } = useLancamentos();
  const { orcamentos } = useOrcamentos();
  const { fornecedores } = useFornecedores();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) { setQuery(""); setDebouncedQuery(""); setActiveIndex(0); }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    const hits: SearchResult[] = [];

    (obras ?? []).filter((o) =>
      o.nome?.toLowerCase().includes(q) || o.status?.toLowerCase().includes(q) ||
      o.endereco?.toLowerCase().includes(q) || o.cliente?.toLowerCase().includes(q)
    ).slice(0, 5).forEach((o) => hits.push({
      id: `obra-${o.id}`, category: "Obras", icon: CATEGORY_ICONS["Obras"],
      title: o.nome ?? "Sem nome", subtitle: [o.cliente, o.status].filter(Boolean).join(" \u00b7 "),
      route: `/obras/${o.id}`,
    }));

    (clientes ?? []).filter((c) =>
      c.nome?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) ||
      c.cidade?.toLowerCase().includes(q) || c.cpfCnpj?.toLowerCase().includes(q)
    ).slice(0, 5).forEach((c) => hits.push({
      id: `cliente-${c.id}`, category: "Clientes", icon: CATEGORY_ICONS["Clientes"],
      title: c.nome ?? "Sem nome", subtitle: [c.cidade, c.telefone].filter(Boolean).join(" \u00b7 "),
      route: `/clientes/${c.id}`,
    }));

    (lancamentos ?? []).filter((l) =>
      l.descricao?.toLowerCase().includes(q) || l.fornecedorCliente?.toLowerCase().includes(q) ||
      l.categoria?.toLowerCase().includes(q)
    ).slice(0, 5).forEach((l) => hits.push({
      id: `fin-${l.id}`, category: "Financeiro", icon: CATEGORY_ICONS["Financeiro"],
      title: l.descricao ?? "Sem descricao",
      subtitle: [l.tipo, `R$ ${Number(l.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, l.fornecedorCliente].filter(Boolean).join(" \u00b7 "),
      route: `/financeiro`,
    }));

    (orcamentos ?? []).filter((o) =>
      o.nome?.toLowerCase().includes(q) || o.obraNome?.toLowerCase().includes(q) ||
      o.clienteNome?.toLowerCase().includes(q)
    ).slice(0, 5).forEach((o) => hits.push({
      id: `orc-${o.id}`, category: "Orcamentos", icon: CATEGORY_ICONS["Orcamentos"],
      title: o.nome ?? "Sem nome", subtitle: [o.obraNome, o.clienteNome, o.status].filter(Boolean).join(" \u00b7 "),
      route: `/orcamentos/${o.id}`,
    }));

    (ordens ?? []).filter((o) =>
      o.numero?.toString().toLowerCase().includes(q) || o.cliente?.toLowerCase().includes(q) ||
      o.tipoServico?.toLowerCase().includes(q) || o.descricao?.toLowerCase().includes(q)
    ).slice(0, 5).forEach((o) => hits.push({
      id: `os-${o.id}`, category: "OS", icon: CATEGORY_ICONS["OS"],
      title: `OS #${o.numero}`, subtitle: [o.cliente, o.tipoServico, o.status].filter(Boolean).join(" \u00b7 "),
      route: `/ordens-servico`,
    }));

    (colaboradores ?? []).filter((c) =>
      c.nome?.toLowerCase().includes(q) || c.cargo?.toLowerCase().includes(q) ||
      c.telefone?.toLowerCase().includes(q)
    ).slice(0, 5).forEach((c) => hits.push({
      id: `colab-${c.id}`, category: "Colaboradores", icon: CATEGORY_ICONS["Colaboradores"],
      title: c.nome ?? "Sem nome", subtitle: [c.cargo, c.status].filter(Boolean).join(" \u00b7 "),
      route: `/colaboradores/${c.id}`,
    }));

    (materiais ?? []).filter((m) =>
      m.nome?.toLowerCase().includes(q) || m.codigo?.toLowerCase().includes(q) ||
      m.fornecedor?.toLowerCase().includes(q)
    ).slice(0, 5).forEach((m) => hits.push({
      id: `mat-${m.id}`, category: "Materiais", icon: CATEGORY_ICONS["Materiais"],
      title: m.nome ?? "Sem nome",
      subtitle: [m.codigo, m.fornecedor, `${m.quantidade ?? 0} ${m.unidade ?? ""}`.trim()].filter(Boolean).join(" \u00b7 "),
      route: `/estoque`,
    }));

    (fornecedores ?? []).filter((f) =>
      f.nome?.toLowerCase().includes(q) || f.cnpj?.toLowerCase().includes(q) ||
      f.email?.toLowerCase().includes(q)
    ).slice(0, 5).forEach((f) => hits.push({
      id: `forn-${f.id}`, category: "Fornecedores", icon: CATEGORY_ICONS["Fornecedores"],
      title: f.nome ?? "Sem nome", subtitle: [f.cnpj, f.telefone].filter(Boolean).join(" \u00b7 "),
      route: `/estoque`,
    }));

    return hits;
  }, [debouncedQuery, obras, ordens, colaboradores, clientes, materiais, lancamentos, orcamentos, fornecedores]);

  const grouped = useMemo(() => {
    const map = new Map<CategoryType, SearchResult[]>();
    for (const cat of CATEGORY_ORDER) {
      const items = results.filter((r) => r.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [results]);

  const flatResults = useMemo(() => CATEGORY_ORDER.flatMap((cat) => grouped.get(cat) ?? []), [grouped]);

  const navigate = useCallback((route: string) => { setOpen(false); router.push(route); }, [router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => (i + 1) % flatResults.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => (i - 1 + flatResults.length) % flatResults.length); }
    else if (e.key === "Enter") { e.preventDefault(); const active = flatResults[activeIndex]; if (active) navigate(active.route); }
  }, [flatResults, activeIndex, navigate]);

  useEffect(() => { setActiveIndex(0); }, [results]);

  const getFlatIndex = (result: SearchResult) => flatResults.findIndex((r) => r.id === result.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors shadow-sm"
        aria-label="Abrir busca global">
        <Search className="h-3.5 w-3.5" /><span>Buscar...</span>
        <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px] font-mono leading-5 border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500">Ctrl+K</Badge>
      </button>
      <button onClick={() => setOpen(true)}
        className="flex md:hidden items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        aria-label="Abrir busca">
        <Search className="h-5 w-5" />
      </button>

      <DialogContent className="p-0 gap-0 overflow-hidden max-w-xl w-[95vw] md:w-full rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl backdrop-blur-sm bg-white dark:bg-zinc-900" aria-describedby={undefined}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="h-5 w-5 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Buscar obras, clientes, despesas, orcamentos, OS..."
            className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent text-base text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 p-0 h-auto" />
          {query && (<button onClick={() => setQuery("")} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" aria-label="Limpar busca">Limpar</button>)}
        </div>

        <div className="overflow-y-auto max-h-[420px] py-2">
          {query.trim() === "" && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400 dark:text-zinc-500">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm">Digite para buscar em toda a plataforma</p>
              <p className="text-xs text-zinc-300 dark:text-zinc-600">Obras, clientes, financeiro, orcamentos, OS, colaboradores, materiais</p>
            </div>
          )}
          {query.trim() !== "" && flatResults.length === 0 && debouncedQuery === query && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400 dark:text-zinc-500">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm font-medium">Nenhum resultado encontrado</p>
              <p className="text-xs">Tente termos diferentes</p>
            </div>
          )}
          {CATEGORY_ORDER.map((category) => {
            const items = grouped.get(category);
            if (!items) return null;
            return (
              <div key={category} className="mb-1">
                <p className="px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">{category}</p>
                {items.map((result) => {
                  const flatIdx = getFlatIndex(result);
                  const isActive = flatIdx === activeIndex;
                  return (
                    <button key={result.id} onClick={() => navigate(result.route)} onMouseEnter={() => setActiveIndex(flatIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${isActive ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"}`}>
                      <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">{result.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{result.title}</span>
                        {result.subtitle && (<span className="block text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{result.subtitle}</span>)}
                      </span>
                      <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 transition-opacity ${isActive ? "opacity-60 text-zinc-500 dark:text-zinc-400" : "opacity-0"}`} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {flatResults.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-[10px]">&uarr;&darr;</kbd>navegar</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-[10px]">&crarr;</kbd>abrir</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-[10px]">Esc</kbd>fechar</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
