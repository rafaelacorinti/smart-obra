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
import { Calculator, Plus, Pencil, Trash2, Search } from "lucide-react";
import { orcamentosStorage } from "@/lib/storage";
import { useToast } from "@/lib/use-toast";
import { useSearchParams } from "next/navigation";
import type { Orcamento } from "@/types";

const statusOpts = [
  { value: "pendente", label: "Pendente" },
  { value: "aprovado", label: "Aprovado" },
  { value: "recusado", label: "Recusado" },
];

const defaultForm = { obraId: "", clienteId: "", itens: [] as { descricao: string; quantidade: number; valorUnitario: number; valorTotal: number }[], valorTotal: 0, status: "pendente" as Orcamento["status"], dataValidade: "" };

export default function OrcamentosPage() {
  const [loading, setLoading] = React.useState(true);
  const [orcamentos, setOrcamentos] = React.useState<Orcamento[]>([]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const loadData = () => { setOrcamentos(orcamentosStorage.getAll()); setLoading(false); };
  React.useEffect(() => { loadData(); }, []);
  React.useEffect(() => { if (searchParams.get("new") === "1") setDialogOpen(true); }, [searchParams]);

  const filtered = orcamentos.filter((o) => o.status.includes(search.toLowerCase()));

  const handleSave = () => {
    if (editingId) { orcamentosStorage.update(editingId, form); toast({ title: "Orçamento atualizado", variant: "success" }); }
    else { orcamentosStorage.create(form); toast({ title: "Orçamento criado", variant: "success" }); }
    setDialogOpen(false); setEditingId(null); setForm(defaultForm); loadData();
  };

  const handleEdit = (o: Orcamento) => {
    setForm({ obraId: o.obraId, clienteId: o.clienteId, itens: o.itens, valorTotal: o.valorTotal, status: o.status, dataValidade: o.dataValidade });
    setEditingId(o.id); setDialogOpen(true);
  };

  const handleDelete = (o: Orcamento) => { orcamentosStorage.delete(o.id); toast({ title: "Orçamento removido", variant: "destructive" }); loadData(); };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1><p className="text-sm text-gray-500 mt-1">Gerencie seus orçamentos</p></div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Novo Orçamento</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Buscar orçamentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {filtered.length === 0 ? (
        <EmptyState icon={Calculator} title="Nenhum orçamento encontrado" description={search ? "Tente outra busca" : "Crie seu primeiro orçamento"}>
          {!search && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo Orçamento</Button>}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3"><div className="flex items-start justify-between"><CardTitle className="text-base">Orçamento #{o.id.slice(0,6)}</CardTitle><Badge variant={o.status === "aprovado" ? "success" : o.status === "recusado" ? "destructive" : "warning"}>{statusOpts.find((s) => s.value === o.status)?.label}</Badge></div></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-bold">R$ {o.valorTotal.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-gray-500">{o.itens.length} itens · Validade: {o.dataValidade ? new Date(o.dataValidade + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(o)}><Pencil className="mr-1 h-3 w-3" /> Editar</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(o)}><Trash2 className="mr-1 h-3 w-3" /> Excluir</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingId ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Valor Total (R$)</label><Input type="number" value={form.valorTotal} onChange={(e) => setForm({ ...form, valorTotal: Number(e.target.value) })} /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Status</label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Orcamento["status"] })} options={statusOpts} /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Data Validade</label><Input type="date" value={form.dataValidade} onChange={(e) => setForm({ ...form, dataValidade: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
