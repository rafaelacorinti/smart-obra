"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Plus, Pencil, Trash2, Search } from "lucide-react";
import { contratosStorage } from "@/lib/storage";
import { useToast } from "@/lib/use-toast";
import type { Contrato } from "@/types";

const statusOpts = [
  { value: "ativo", label: "Ativo" },
  { value: "encerrado", label: "Encerrado" },
  { value: "cancelado", label: "Cancelado" },
];

const defaultForm = { obraId: "", clienteId: "", valor: 0, dataInicio: "", dataFim: "", status: "ativo" as Contrato["status"], descricao: "" };

export default function ContratosPage() {
  const [loading, setLoading] = React.useState(true);
  const [contratos, setContratos] = React.useState<Contrato[]>([]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const { toast } = useToast();

  const loadData = () => { setContratos(contratosStorage.getAll()); setLoading(false); };
  React.useEffect(() => { loadData(); }, []);

  const filtered = contratos.filter((c) => c.descricao.toLowerCase().includes(search.toLowerCase()) || c.status.includes(search.toLowerCase()));

  const handleSave = () => {
    if (editingId) {
      contratosStorage.update(editingId, form);
      toast({ title: "Contrato atualizado", variant: "success" });
    } else {
      contratosStorage.create(form);
      toast({ title: "Contrato criado", variant: "success" });
    }
    setDialogOpen(false); setEditingId(null); setForm(defaultForm); loadData();
  };

  const handleEdit = (c: Contrato) => {
    setForm({ obraId: c.obraId, clienteId: c.clienteId, valor: c.valor, dataInicio: c.dataInicio, dataFim: c.dataFim, status: c.status, descricao: c.descricao });
    setEditingId(c.id); setDialogOpen(true);
  };

  const handleDelete = (c: Contrato) => {
    contratosStorage.delete(c.id);
    toast({ title: "Contrato removido", variant: "destructive" });
    loadData();
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Contratos</h1><p className="text-sm text-gray-500 mt-1">Gerencie seus contratos</p></div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Novo Contrato</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Buscar contratos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum contrato encontrado" description={search ? "Tente outra busca" : "Crie seu primeiro contrato"}>
          {!search && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo Contrato</Button>}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3"><div className="flex items-start justify-between"><CardTitle className="text-base">Contrato #{c.id.slice(0,6)}</CardTitle><Badge variant={c.status === "ativo" ? "success" : c.status === "encerrado" ? "secondary" : "destructive"}>{statusOpts.find((s) => s.value === c.status)?.label}</Badge></div></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600"><span className="font-medium">Valor:</span> R$ {c.valor.toLocaleString("pt-BR")}</p>
                <p className="text-sm text-gray-600">{c.descricao || "Sem descrição"}</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(c)}><Pencil className="mr-1 h-3 w-3" /> Editar</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(c)}><Trash2 className="mr-1 h-3 w-3" /> Excluir</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingId ? "Editar Contrato" : "Novo Contrato"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Valor (R$)</label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className="text-sm font-medium">Data Início</label><Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} /></div>
              <div className="grid gap-2"><label className="text-sm font-medium">Data Fim</label><Input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium">Status</label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Contrato["status"] })} options={statusOpts} /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Descrição</label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição do contrato" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
