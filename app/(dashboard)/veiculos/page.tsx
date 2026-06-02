"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Truck, LayoutGrid, List, Wrench, Fuel, CheckCircle, XCircle, AlertTriangle, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVeiculos, useManutencoesVeiculo, useAbastecimentosVeiculo } from "@/hooks/use-storage-data";
import { Veiculo } from "@/lib/mock-data";
import Link from "next/link";

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const tipoConfig: Record<string, { label: string; color: string }> = {
  CARRO: { label: "Carro", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  CAMINHAO: { label: "Caminhao", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  MOTO: { label: "Moto", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  MAQUINA: { label: "Maquina", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  EQUIPAMENTO: { label: "Equipamento", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ATIVO: { label: "Disponivel", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  MANUTENCAO: { label: "Manutencao", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <Wrench className="h-3.5 w-3.5" /> },
  INATIVO: { label: "Inativo", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function VeiculosPage() {
  const { veiculos, loading, createVeiculo } = useVeiculos();
  const { manutencoes } = useManutencoesVeiculo();
  const { abastecimentos } = useAbastecimentosVeiculo();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [showDialog, setShowDialog] = useState(false);

  const [form, setForm] = useState({
    nome: "", placa: "", tipo: "CARRO" as Veiculo["tipo"], marca: "", modelo: "",
    ano: new Date().getFullYear(), kmAtual: 0, horimetro: 0, status: "ATIVO" as Veiculo["status"],
  });

  const kpis = useMemo(() => {
    const custoManutencao = manutencoes.reduce((s, m) => s + m.custo, 0);
    const custoAbastecimento = abastecimentos.reduce((s, a) => s + a.total, 0);
    return {
      total: veiculos.length,
      disponiveis: veiculos.filter((v) => v.status === "ATIVO").length,
      emManutencao: veiculos.filter((v) => v.status === "MANUTENCAO").length,
      custoTotal: custoManutencao + custoAbastecimento,
    };
  }, [veiculos, manutencoes, abastecimentos]);

  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter((v) => {
      const matchBusca = v.nome.toLowerCase().includes(busca.toLowerCase()) ||
        v.placa.toLowerCase().includes(busca.toLowerCase()) ||
        v.marca.toLowerCase().includes(busca.toLowerCase());
      const matchTipo = filtroTipo === "TODOS" || v.tipo === filtroTipo;
      const matchStatus = filtroStatus === "TODOS" || v.status === filtroStatus;
      return matchBusca && matchTipo && matchStatus;
    });
  }, [veiculos, busca, filtroTipo, filtroStatus]);

  function getVeiculoCusto(veiculoId: string) {
    const cm = manutencoes.filter((m) => m.veiculoId === veiculoId).reduce((s, m) => s + m.custo, 0);
    const ca = abastecimentos.filter((a) => a.veiculoId === veiculoId).reduce((s, a) => s + a.total, 0);
    return cm + ca;
  }

  function isManutencaoVencida(veiculoId: string, kmAtual: number) {
    return manutencoes.some(
      (m) => m.veiculoId === veiculoId && m.proximaKm != null && kmAtual > m.proximaKm
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.marca || !form.modelo) return;
    createVeiculo(form);
    setForm({ nome: "", placa: "", tipo: "CARRO", marca: "", modelo: "", ano: new Date().getFullYear(), kmAtual: 0, horimetro: 0, status: "ATIVO" });
    setShowDialog(false);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Veiculos e Equipamentos" breadcrumbs={[{ label: "Veiculos" }]} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[180px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Veiculos e Equipamentos"
        breadcrumbs={[{ label: "Veiculos" }]}
        actions={
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Veiculo
          </Button>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Veiculos" value={kpis.total} icon={Truck} />
        <StatCard title="Disponiveis" value={kpis.disponiveis} icon={CheckCircle} />
        <StatCard title="Em Manutencao" value={kpis.emManutencao} icon={Wrench} />
        <StatCard title="Custo Total" value={fmt(kpis.custoTotal)} icon={DollarSign} />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar veiculos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="TODOS">Todos os Tipos</option>
            <option value="CARRO">Carro</option>
            <option value="CAMINHAO">Caminhao</option>
            <option value="MOTO">Moto</option>
            <option value="MAQUINA">Maquina</option>
            <option value="EQUIPAMENTO">Equipamento</option>
          </select>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVO">Disponivel</option>
            <option value="MANUTENCAO">Manutencao</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <div className="flex rounded-lg border bg-background p-1">
            <button onClick={() => setViewMode("cards")} className={`rounded-md p-1.5 transition-colors ${viewMode === "cards" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{veiculosFiltrados.length} veiculo(s) encontrado(s)</p>

      {/* Cards View */}
      {viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {veiculosFiltrados.map((veiculo) => {
            const manutVencida = isManutencaoVencida(veiculo.id, veiculo.kmAtual);
            const custo = getVeiculoCusto(veiculo.id);
            return (
              <Link key={veiculo.id} href={`/veiculos/${veiculo.id}`}>
                <div className={`group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer ${manutVencida ? "border-red-300 dark:border-red-800" : ""}`}>
                  <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 relative">
                    <Truck className="h-10 w-10 text-primary/40" />
                    {manutVencida && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3" />
                        Vencida
                      </span>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold group-hover:text-primary transition-colors truncate">{veiculo.nome}</h3>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[veiculo.status]?.color}`}>
                      {statusConfig[veiculo.status]?.icon}
                      {statusConfig[veiculo.status]?.label}
                    </span>
                  </div>
                  {veiculo.placa && <p className="mt-1 text-sm font-mono text-muted-foreground">{veiculo.placa}</p>}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipoConfig[veiculo.tipo]?.color}`}>
                      {tipoConfig[veiculo.tipo]?.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{veiculo.marca} {veiculo.modelo}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {veiculo.kmAtual > 0 && (
                      <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{veiculo.kmAtual.toLocaleString()} km</span>
                    )}
                    {veiculo.horimetro > 0 && (
                      <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{veiculo.horimetro.toLocaleString()} h</span>
                    )}
                    {custo > 0 && (
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{fmt(custo)}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Placa</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Marca/Modelo</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Custo Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {veiculosFiltrados.map((veiculo) => {
                const manutVencida = isManutencaoVencida(veiculo.id, veiculo.kmAtual);
                const custo = getVeiculoCusto(veiculo.id);
                return (
                  <tr key={veiculo.id} className={`hover:bg-muted/30 cursor-pointer transition-colors ${manutVencida ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/veiculos/${veiculo.id}`} className="font-medium hover:text-primary flex items-center gap-2">
                        {veiculo.nome}
                        {manutVencida && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground hidden sm:table-cell">{veiculo.placa || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipoConfig[veiculo.tipo]?.color}`}>{tipoConfig[veiculo.tipo]?.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{veiculo.marca} {veiculo.modelo}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{custo > 0 ? fmt(custo) : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[veiculo.status]?.color}`}>
                        {statusConfig[veiculo.status]?.icon}
                        {statusConfig[veiculo.status]?.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {veiculosFiltrados.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <Truck className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Nenhum veiculo encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tente ajustar os filtros ou adicionar um novo veiculo.</p>
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDialog(false)} />
          <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Novo Veiculo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Nome *</label>
                  <input type="text" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Placa</label>
                  <input type="text" value={form.placa} onChange={(e) => setForm({...form, placa: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo *</label>
                  <select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value as Veiculo["tipo"]})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                    <option value="CARRO">Carro</option>
                    <option value="CAMINHAO">Caminhao</option>
                    <option value="MOTO">Moto</option>
                    <option value="MAQUINA">Maquina</option>
                    <option value="EQUIPAMENTO">Equipamento</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Marca *</label>
                  <input type="text" value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Modelo *</label>
                  <input type="text" value={form.modelo} onChange={(e) => setForm({...form, modelo: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Ano</label>
                  <input type="number" value={form.ano} onChange={(e) => setForm({...form, ano: Number(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Km Atual</label>
                  <input type="number" value={form.kmAtual} onChange={(e) => setForm({...form, kmAtual: Number(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Horimetro</label>
                  <input type="number" value={form.horimetro} onChange={(e) => setForm({...form, horimetro: Number(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value as Veiculo["status"]})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                    <option value="ATIVO">Disponivel</option>
                    <option value="MANUTENCAO">Manutencao</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}