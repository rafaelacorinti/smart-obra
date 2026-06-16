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
import { DollarSign, Plus, Pencil, Trash2, Search } from "lucide-react";
import { despesasStorage } from "@/lib/storage";
import { useToast } from "@/lib/use-toast";
import { useSearchParams } from "next/navigation";
import type { Despesa } from "@/types";

const categorias = [
  { value: "material", label: "Material" },
  { value: "mao_de_obra", label: "Mão de Obra" },
  { value: "equipamento", label: "Equipamento" },
  { value: "transporte", label: "Transporte" },
  { value: "outros", label: "Outros" },
];

const defaultForm = { obraId: "", descricao: "", valor: 0, categoria: "material", data: "" };

export default function DespesasPage() {
  const [loading, setLoading] = React.useState(true);
  const [despesas, setDespesas] = React.useState<Despesa[]>([]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const loadData = () => { setDespesas(despesasStorage.getAll()); setLoading(false); };
  React.useEffect(() => { loadData(); }, []);
  React.useEffect(() => { if (searchParams.get("new") === "1") setDialogOpen(true); }, [searchParams]);

  const filtered = despesas.filter((d) => d.descricao.toLowerCase().includes(search.toLowerCase()) || d.categoria.toLowerCase().includes(search.toLowerCase()));
  const totalGasto = filtered.reduce((s, d) => s + d.valor, 0);

  const handleSave = () => {
    if (!form.descricao.trim()) { toast({ title: "Erro", description: "Descrição obrigatória", variant: "destructive" }); return; }
    if (editingId) { despesasStorage.update(editingId, form); toast({ title: "Despesa atualizada", variant: "success" }); }
    else { despesasStorage.create(form); toast({ title: "Despesa criada", variant: "success" }); }
    setDialogOpen(false); setEditingId(null); setForm(defaultForm); loadData();
  };

  const handleEdit = (d: Despesa) => {
    setForm({ obraId: d.obraId, descricao: d.descricao, valor: d.valor, categoria: d.categoria, data: d.data });
    setEditingId(d.id); setDialogOpen(true);
  };

  const handleDelete = (d: Despesa) => { despesasStorage.delete(d.id); toast({ title: "Despesa removida", variant: "destructive" }); loadData(); };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Despesas</h1>
          <p className="text-sm text-gray-500 mt-1">Total: R$ {totalGasto.toLocaleString("pt-BR")}</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Nova Despesa</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Buscar despesas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {filtered.length === 0 ? (
        <EmptyState icon={DollarSign} title="Nenhuma despesa encontrada" description={search ? "Tente outra busca" : "Registre sua primeira despesa"}>
          {!search && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova Despesa</Button>}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-red-50 p-2"><DollarSign className="h-5 w-5 text-red-600" /></div>
                  <div>
                    <p className="font-medium text-sm">{d.descricao}</p>
                    <p className="text-xs text-gray-500">{d.data ? new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR") : "—"} · {categorias.find((c) => c.value === d.categoria)?.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-600">- R$ {d.valor.toLocaleString("pt-BR")}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(d)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Descrição *</label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição da despesa" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className="text-sm font-medium">Valor (R$)</label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></div>
              <div className="grid gap-2"><label className="text-sm font-medium">Categoria</label><Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} options={categorias} /></div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium">Data</label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
