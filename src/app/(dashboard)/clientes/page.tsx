"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Search, Pencil, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { clientesStorage } from "@/lib/storage";
import { useToast } from "@/lib/use-toast";
import { useSearchParams } from "next/navigation";
import type { Cliente } from "@/types";

const defaultForm = { nome: "", email: "", telefone: "", cpfCnpj: "", endereco: "" };

export default function ClientesPage() {
  const [loading, setLoading] = React.useState(true);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const loadData = () => { setClientes(clientesStorage.getAll()); setLoading(false); };

  React.useEffect(() => { loadData(); }, []);
  React.useEffect(() => { if (searchParams.get("new") === "1") setDialogOpen(true); }, [searchParams]);

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search)
  );

  const handleSave = () => {
    if (!form.nome.trim()) { toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" }); return; }
    if (editingId) {
      clientesStorage.update(editingId, form);
      toast({ title: "Cliente atualizado", description: `"${form.nome}" atualizado com sucesso`, variant: "success" });
    } else {
      clientesStorage.create(form);
      toast({ title: "Cliente criado", description: `"${form.nome}" criado com sucesso`, variant: "success" });
    }
    setDialogOpen(false); setEditingId(null); setForm(defaultForm); loadData();
  };

  const handleEdit = (c: Cliente) => {
    setForm({ nome: c.nome, email: c.email, telefone: c.telefone, cpfCnpj: c.cpfCnpj, endereco: c.endereco });
    setEditingId(c.id); setDialogOpen(true);
  };

  const handleDelete = (c: Cliente) => {
    clientesStorage.delete(c.id);
    toast({ title: "Cliente removido", description: `"${c.nome}" removido`, variant: "destructive" });
    loadData();
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie seus clientes</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Buscar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente encontrado" description={search ? "Tente uma busca diferente" : "Comece cadastrando seu primeiro cliente"}>
          {!search && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{cliente.nome}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1.5 text-sm text-gray-600">
                  {cliente.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-400" /> {cliente.email}</p>}
                  {cliente.telefone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" /> {cliente.telefone}</p>}
                  {cliente.endereco && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {cliente.endereco}</p>}
                  {cliente.cpfCnpj && <p className="text-xs text-gray-400">CPF/CNPJ: {cliente.cpfCnpj}</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(cliente)}><Pencil className="mr-1 h-3 w-3" /> Editar</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(cliente)}><Trash2 className="mr-1 h-3 w-3" /> Excluir</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Nome *</label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Email</label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Telefone</label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">CPF/CNPJ</label><Input value={form.cpfCnpj} onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })} placeholder="000.000.000-00" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Endereço</label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Endereço completo" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
