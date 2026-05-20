"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Building2,
  ClipboardList,
  Users,
  UserCircle,
  Package,
  ArrowRight,
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
} from "@/hooks/use-storage-data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  category: "Obras" | "OS" | "Colaboradores" | "Clientes" | "Materiais";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  route: string;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_ORDER: SearchResult["category"][] = [
  "Obras",
  "OS",
  "Colaboradores",
  "Clientes",
  "Materiais",
];

const CATEGORY_ICONS: Record<SearchResult["category"], React.ReactNode> = {
  Obras: <Building2 className="h-4 w-4 text-orange-500" />,
  OS: <ClipboardList className="h-4 w-4 text-blue-500" />,
  Colaboradores: <Users className="h-4 w-4 text-green-500" />,
  Clientes: <UserCircle className="h-4 w-4 text-purple-500" />,
  Materiais: <Package className="h-4 w-4 text-yellow-500" />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const router = useRouter();

  const { obras } = useObras();
  const { ordens } = useOrdensServico();
  const { colaboradores } = useColaboradores();
  const { clientes } = useClientes();
  const { materiais } = useMateriaisEstoque();

  // ── Keyboard shortcut to open ──────────────────────────────────────────────
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

  // ── Reset state when dialog closes ────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  // ── Build search results ───────────────────────────────────────────────────
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const hits: SearchResult[] = [];

    // Obras
    (obras ?? [])
      .filter(
        (o) =>
          o.nome?.toLowerCase().includes(q) ||
          o.cliente?.toLowerCase().includes(q) ||
          o.endereco?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((o) =>
        hits.push({
          id: `obra-${o.id}`,
          category: "Obras",
          icon: CATEGORY_ICONS["Obras"],
          title: o.nome ?? "Sem nome",
          subtitle: [o.cliente, o.status].filter(Boolean).join(" · "),
          route: `/obras/${o.id}`,
        })
      );

    // Ordens de Serviço
    (ordens ?? [])
      .filter(
        (o) =>
          o.numero?.toString().toLowerCase().includes(q) ||
          o.cliente?.toLowerCase().includes(q) ||
          o.tipoServico?.toLowerCase().includes(q) ||
          o.descricao?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((o) =>
        hits.push({
          id: `os-${o.id}`,
          category: "OS",
          icon: CATEGORY_ICONS["OS"],
          title: `OS #${o.numero}`,
          subtitle: [o.cliente, o.tipoServico, o.status].filter(Boolean).join(" · "),
          route: `/ordens-servico`,
        })
      );

    // Colaboradores
    (colaboradores ?? [])
      .filter(
        (c) =>
          c.nome?.toLowerCase().includes(q) ||
          c.cargo?.toLowerCase().includes(q) ||
          c.telefone?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((c) =>
        hits.push({
          id: `colab-${c.id}`,
          category: "Colaboradores",
          icon: CATEGORY_ICONS["Colaboradores"],
          title: c.nome ?? "Sem nome",
          subtitle: [c.cargo, c.status].filter(Boolean).join(" · "),
          route: `/colaboradores/${c.id}`,
        })
      );

    // Clientes
    (clientes ?? [])
      .filter(
        (c) =>
          c.nome?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.cidade?.toLowerCase().includes(q) ||
          c.cpfCnpj?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((c) =>
        hits.push({
          id: `cliente-${c.id}`,
          category: "Clientes",
          icon: CATEGORY_ICONS["Clientes"],
          title: c.nome ?? "Sem nome",
          subtitle: [c.cidade, c.telefone].filter(Boolean).join(" · "),
          route: `/clientes/${c.id}`,
        })
      );

    // Materiais
    (materiais ?? [])
      .filter(
        (m) =>
          m.nome?.toLowerCase().includes(q) ||
          m.codigo?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((m) =>
        hits.push({
          id: `mat-${m.id}`,
          category: "Materiais",
          icon: CATEGORY_ICONS["Materiais"],
          title: m.nome ?? "Sem nome",
          subtitle: [m.codigo, `${m.quantidade ?? 0} ${m.unidade ?? ""}`.trim()]
            .filter(Boolean)
            .join(" · "),
          route: `/estoque`,
        })
      );

    return hits;
  }, [query, obras, ordens, colaboradores, clientes, materiais]);

  // ── Group results by category ──────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<SearchResult["category"], SearchResult[]>();
    for (const cat of CATEGORY_ORDER) {
      const items = results.filter((r) => r.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [results]);

  // ── Flat list for keyboard navigation ────────────────────────────────────
  const flatResults = useMemo(
    () => CATEGORY_ORDER.flatMap((cat) => grouped.get(cat) ?? []),
    [grouped]
  );

  // ── Navigate to result ─────────────────────────────────────────────────────
  const navigate = useCallback(
    (route: string) => {
      setOpen(false);
      router.push(route);
    },
    [router]
  );

  // ── Keyboard navigation inside dialog ────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (flatResults.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flatResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const active = flatResults[activeIndex];
        if (active) navigate(active.route);
      }
    },
    [flatResults, activeIndex, navigate]
  );

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // ── Flat index helper ─────────────────────────────────────────────────────
  const getFlatIndex = (result: SearchResult) =>
    flatResults.findIndex((r) => r.id === result.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger badge — renders inline wherever <GlobalSearch /> is placed */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors shadow-sm"
        aria-label="Abrir busca global"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar...</span>
        <Badge
          variant="outline"
          className="ml-1 px-1.5 py-0 text-[10px] font-mono leading-5 border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500"
        >
          Ctrl+K
        </Badge>
      </button>

      {/* Modal */}
      <DialogContent
        className="p-0 gap-0 overflow-hidden max-w-xl w-full rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xl backdrop-blur-sm bg-white dark:bg-zinc-900"
        // Hide the default DialogContent close button title
        aria-describedby={undefined}
      >
        {/* Search input ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="h-5 w-5 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar obras, OS, colaboradores, clientes, materiais..."
            className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent text-base text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 p-0 h-auto"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Limpar busca"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Results area ───────────────────────────────────────────────────── */}
        <div className="overflow-y-auto max-h-[420px] py-2">
          {query.trim() === "" && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400 dark:text-zinc-500">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm">Digite para buscar em toda a plataforma</p>
            </div>
          )}

          {query.trim() !== "" && flatResults.length === 0 && (
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
                {/* Category header */}
                <p className="px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                  {category}
                </p>

                {/* Items */}
                {items.map((result) => {
                  const flatIdx = getFlatIndex(result);
                  const isActive = flatIdx === activeIndex;

                  return (
                    <button
                      key={result.id}
                      onClick={() => navigate(result.route)}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      {/* Icon */}
                      <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                        {result.icon}
                      </span>

                      {/* Text */}
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                          {result.title}
                        </span>
                        {result.subtitle && (
                          <span className="block text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                            {result.subtitle}
                          </span>
                        )}
                      </span>

                      {/* Arrow hint */}
                      <ArrowRight
                        className={`h-3.5 w-3.5 flex-shrink-0 transition-opacity ${
                          isActive
                            ? "opacity-60 text-zinc-500 dark:text-zinc-400"
                            : "opacity-0"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint ────────────────────────────────────────────────────── */}
        {flatResults.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-[10px]">
                ↑↓
              </kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-[10px]">
                ↵
              </kbd>
              abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-[10px]">
                Esc
              </kbd>
              fechar
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
