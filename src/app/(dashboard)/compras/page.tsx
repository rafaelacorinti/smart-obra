"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Pencil, Trash2, Search } from "lucide-react";
import { comprasStorage } from "@/lib/storage";
import { useToast } from "@/lib/use-toast";
import type { Compra } from "@/types";

const statusOpts = [
  { value: "pendente", label: "Pendente" },
  { value: "aprovada", label: "Aprovada" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelada", label: "Cancelada" },
];

const defaultForm = { obraId: "", fornecedor: "", itens: [] as { descricao: string; quantidade: number; valorUnitario: number; valorTotal: number }[], valorTotal: 0, status: "pendente" as Compra["status"], dataPedido: "" };

export default function ComprasPage() {
  const [loading, setLoading] = React.useState(true);
  const [compras, setCompras] = React.useState<Compra[]>([]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const { toast } = useToast();

  const loadData = () => { setCompras(comprasStorage.getAll()); setLoading(false); };
  React.useEffect(() => { loadData(); }, []);

  const filtered = compras.filter((c) => c.fornecedor.toLowerCase().includes(search.toLowerCase()) || c.status.includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.fornecedor.trim()) { toast({ title: "Erro", description: "Fornecedor obrigatório", variant: "destructive" }); return; }
    if (editingId) { comprasStorage.update(editingId, form); toast({ title: "Compra atualizada", variant: "success" }); }
    else { comprasStorage.create(form); toast({ title: "Compra registrada", variant: "success" }); }
    setDialogOpen(false); setEditingId(null); setForm(defaultForm); loadData();
  };

  const handleEdit = (c: Compra) => {
    setForm({ obraId: c.obraId, fornecedor: c.fornecedor, itens: c.itens, valorTotal: c.valorTotal, status: c.status, dataPedido: c.dataPedido });
    setEditingId(c.id); setDialogOpen(true);
  };

  const handleDelete = (c: Compra) => { comprasStorage.delete(c.id); toast({ title: "Compra removida", variant: "destructive" }); loadData(); };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Compras</h1><p className="text-sm text-gray-500 mt-1">Gerencie suas compras</p></div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Nova Compra</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Buscar compras..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Nenhuma compra encontrada" description={search ? "Tente outra busca" : "Registre sua primeira compra"}>
          {!search && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova Compra</Button>}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3"><div className="flex items-start justify-between"><CardTitle className="text-base">{c.fornecedor}</CardTitle><Badge variant={c.status === "entregue" ? "success" : c.status === "cancelada" ? "destructive" : c.status === "aprovada" ? "default" : "warning"}>{statusOpts.find((s) => s.value === c.status)?.label}</Badge></div></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-bold">R$ {c.valorTotal.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-gray-500">Pedido: {c.dataPedido ? new Date(c.dataPedido + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</p>
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
          <DialogHeader><DialogTitle>{editingId ? "Editar Compra" : "Nova Compra"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Fornecedor *</label><Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} placeholder="Nome do fornecedor" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className="text-sm font-medium">Valor Total (R$)</label><Input type="number" value={form.valorTotal} onChange={(e) => setForm({ ...form, valorTotal: Number(e.target.value) })} /></div>
              <div className="grid gap-2"><label className="text-sm font-medium">Status</label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Compra["status"] })} options={statusOpts} /></div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium">Data do Pedido</label><Input type="date" value={form.dataPedido} onChange={(e) => setForm({ ...form, dataPedido: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
