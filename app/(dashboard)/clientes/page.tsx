"use client";

import { useState, useMemo } from "react";
import { Plus, Search, UserCircle, Building, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientes } from "@/hooks/use-storage-data";
import { Cliente } from "@/lib/mock-data";
import Link from "next/link";

const tipoConfig: Record<string, { label: string; color: string; icon: any }> = {
  PF: { label: "Pessoa Fisica", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: User },
  PJ: { label: "Pessoa Juridica", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Building },
};

export default function ClientesPage() {
  const { clientes, loading, createCliente } = useClientes();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [showDialog, setShowDialog] = useState(false);
  const [formTipo, setFormTipo] = useState<"PF" | "PJ">("PF");

  const [form, setForm] = useState({
    nome: "", cpfCnpj: "", telefone: "", email: "",
    cep: "", rua: "", numero: "", bairro: "", cidade: "", uf: "", observacoes: "",
  });

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.cpfCnpj.includes(busca) ||
        c.email.toLowerCase().includes(busca.toLowerCase());
      const matchTipo = filtroTipo === "TODOS" || c.tipo === filtroTipo;
      return matchBusca && matchTipo;
    });
  }, [clientes, busca, filtroTipo]);

  const formatCpfCnpj = (value: string, tipo: "PF" | "PJ") => {
    const numbers = value.replace(/\D/g, "");
    if (tipo === "PF") {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").slice(0, 18);
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").slice(0, 15);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.cpfCnpj) return;
    createCliente({ ...form, tipo: formTipo });
    setForm({ nome: "", cpfCnpj: "", telefone: "", email: "", cep: "", rua: "", numero: "", bairro: "", cidade: "", uf: "", observacoes: "" });
    setShowDialog(false);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Clientes" breadcrumbs={[{ label: "Clientes" }]} />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        breadcrumbs={[{ label: "Clientes" }]}
        actions={
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="PF">Pessoa Fisica</option>
            <option value="PJ">Pessoa Juridica</option>
          </select>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {clientesFiltrados.length} cliente(s) encontrado(s)
      </p>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">CPF/CNPJ</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Telefone</th>
              <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clientesFiltrados.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-muted/30 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/clientes/${cliente.id}`} className="font-medium hover:text-primary">{cliente.nome}</Link>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground hidden sm:table-cell">{cliente.cpfCnpj}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{cliente.telefone}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{cliente.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipoConfig[cliente.tipo]?.color}`}>
                    {cliente.tipo === "PF" ? "PF" : "PJ"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clientesFiltrados.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <UserCircle className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Nenhum cliente encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tente ajustar os filtros ou adicionar um novo cliente.</p>
        </div>
      )}

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDialog(false)} />
          <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Novo Cliente</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo toggle */}
              <div className="flex items-center gap-2 p-1 rounded-lg bg-muted w-fit">
                <button type="button" onClick={() => setFormTipo("PF")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${formTipo === "PF" ? "bg-background shadow-sm" : ""}`}>
                  Pessoa Fisica
                </button>
                <button type="button" onClick={() => setFormTipo("PJ")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${formTipo === "PJ" ? "bg-background shadow-sm" : ""}`}>
                  Pessoa Juridica
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">{formTipo === "PF" ? "Nome Completo" : "Razao Social"} *</label>
                  <input type="text" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-sm font-medium">{formTipo === "PF" ? "CPF" : "CNPJ"} *</label>
                  <input type="text" value={form.cpfCnpj} onChange={(e) => setForm({...form, cpfCnpj: formatCpfCnpj(e.target.value, formTipo)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <input type="text" value={form.telefone} onChange={(e) => setForm({...form, telefone: formatTelefone(e.target.value)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">CEP</label>
                  <input type="text" value={form.cep} onChange={(e) => setForm({...form, cep: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Rua</label>
                  <input type="text" value={form.rua} onChange={(e) => setForm({...form, rua: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Numero</label>
                  <input type="text" value={form.numero} onChange={(e) => setForm({...form, numero: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bairro</label>
                  <input type="text" value={form.bairro} onChange={(e) => setForm({...form, bairro: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">Cidade</label>
                  <input type="text" value={form.cidade} onChange={(e) => setForm({...form, cidade: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium">UF</label>
                  <input type="text" value={form.uf} onChange={(e) => setForm({...form, uf: e.target.value.toUpperCase().slice(0, 2)})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" maxLength={2} />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Observacoes</label>
                  <textarea value={form.observacoes} onChange={(e) => setForm({...form, observacoes: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={2} />
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
