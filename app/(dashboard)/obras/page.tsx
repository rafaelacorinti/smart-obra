"use client";

import { useState, useMemo } from "react";
import { Plus, Search, MapPin, LayoutGrid, List, Filter, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useObras, useClientes } from "@/hooks/use-storage-data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string }> = {
  PLANEJAMENTO: { label: "Planejamento", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  EM_ANDAMENTO: { label: "Em Andamento", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PAUSADA: { label: "Pausada", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CONCLUIDA: { label: "Concluida", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function ObrasPage() {
  const { obras, loading } = useObras();
  const { clientes } = useClientes();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  const obrasFiltradas = useMemo(() => {
    return obras.filter((obra) => {
      const matchBusca = obra.nome.toLowerCase().includes(busca.toLowerCase()) ||
        obra.cliente.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === "TODOS" || obra.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  }, [obras, busca, filtroStatus]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Obras" breadcrumbs={[{ label: "Obras" }]} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Obras"
        breadcrumbs={[{ label: "Obras" }]}
        actions={
          <Link href="/obras/nova">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Obra
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar obras..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="rounded-md border-0 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-0"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PLANEJAMENTO">Planejamento</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="PAUSADA">Pausada</option>
              <option value="CONCLUIDA">Concluida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
          <div className="flex rounded-lg border bg-background p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "cards" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {obrasFiltradas.length} obra(s) encontrada(s)
      </p>

      {/* Cards View */}
      {viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obrasFiltradas.map((obra) => (
            <Link key={obra.id} href={`/obras/${obra.id}`}>
              <div className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer">
                {/* Cover placeholder */}
                <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                  <Building2 className="h-12 w-12 text-primary/40" />
                </div>

                <div className="flex items-start justify-between">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{obra.nome}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[obra.status]?.color}`}>
                    {statusConfig[obra.status]?.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{clientes.find((c) => c.id === obra.clienteId)?.nome || obra.cliente || "Sem cliente"}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {obra.cidade}, {obra.estado}
                </div>
                <p className="mt-2 text-sm font-semibold">{formatCurrency(obra.orcamento)}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{obra.progresso}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                      style={{ width: `${obra.progresso}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Obra</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Local</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Orcamento</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Progresso</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {obrasFiltradas.map((obra) => (
                <tr key={obra.id} className="hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/obras/${obra.id}`} className="font-medium hover:text-primary">{obra.nome}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{clientes.find((c) => c.id === obra.clienteId)?.nome || obra.cliente || "Sem cliente"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{obra.cidade}, {obra.estado}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[obra.status]?.color}`}>
                      {statusConfig[obra.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium hidden lg:table-cell">{formatCurrency(obra.orcamento)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${obra.progresso}%` }} />
                      </div>
                      <span className="text-xs font-medium">{obra.progresso}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {obrasFiltradas.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Nenhuma obra encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tente ajustar os filtros ou criar uma nova obra.</p>
        </div>
      )}
    </div>
  );
}