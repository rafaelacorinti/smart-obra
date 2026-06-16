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
import { ClipboardList, Plus, Pencil, Trash2, Search } from "lucide-react";
import { ordensStorage } from "@/lib/storage";
import { useToast } from "@/lib/use-toast";
import { useSearchParams } from "next/navigation";
import type { OrdemServico } from "@/types";

const statusOpts = [
  { value: "aberta", label: "Aberta" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

const prioridadeOpts = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const defaultForm = { obraId: "", titulo: "", descricao: "", responsavel: "", status: "aberta" as OrdemServico["status"], prioridade: "media" as OrdemServico["prioridade"], dataAbertura: "" };

export default function OSPage() {
  const [loading, setLoading] = React.useState(true);
  const [ordens, setOrdens] = React.useState<OrdemServico[]>([]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const loadData = () => { setOrdens(ordensStorage.getAll()); setLoading(false); };
  React.useEffect(() => { loadData(); }, []);
  React.useEffect(() => { if (searchParams.get("new") === "1") setDialogOpen(true); }, [searchParams]);

  const filtered = ordens.filter((o) => o.titulo.toLowerCase().includes(search.toLowerCase()) || o.responsavel.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.titulo.trim()) { toast({ title: "Erro", description: "Título obrigatório", variant: "destructive" }); return; }
    if (editingId) { ordensStorage.update(editingId, form); toast({ title: "OS atualizada", variant: "success" }); }
    else { ordensStorage.create(form); toast({ title: "OS criada", variant: "success" }); }
    setDialogOpen(false); setEditingId(null); setForm(defaultForm); loadData();
  };

  const handleEdit = (o: OrdemServico) => {
    setForm({ obraId: o.obraId, titulo: o.titulo, descricao: o.descricao, responsavel: o.responsavel, status: o.status, prioridade: o.prioridade, dataAbertura: o.dataAbertura });
    setEditingId(o.id); setDialogOpen(true);
  };

  const handleDelete = (o: OrdemServico) => { ordensStorage.delete(o.id); toast({ title: "OS removida", variant: "destructive" }); loadData(); };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1><p className="text-sm text-gray-500 mt-1">Gerencie suas ordens de serviço</p></div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Nova OS</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Buscar OS..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma OS encontrada" description={search ? "Tente outra busca" : "Crie sua primeira ordem de serviço"}>
          {!search && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova OS</Button>}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{o.titulo}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant={o.status === "concluida" ? "success" : o.status === "em_execucao" ? "default" : o.status === "cancelada" ? "destructive" : "secondary"}>{statusOpts.find((s) => s.value === o.status)?.label}</Badge>
                    <Badge variant={o.prioridade === "urgente" ? "destructive" : o.prioridade === "alta" ? "warning" : "secondary"}>{o.prioridade}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">{o.descricao || "Sem descrição"}</p>
                <p className="text-xs text-gray-500">Responsável: {o.responsavel || "—"}</p>
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
          <DialogHeader><DialogTitle>{editingId ? "Editar OS" : "Nova OS"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Título *</label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título da OS" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Responsável</label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><label className="text-sm font-medium">Status</label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OrdemServico["status"] })} options={statusOpts} /></div>
              <div className="grid gap-2"><label className="text-sm font-medium">Prioridade</label><Select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as OrdemServico["prioridade"] })} options={prioridadeOpts} /></div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium">Data Abertura</label><Input type="date" value={form.dataAbertura} onChange={(e) => setForm({ ...form, dataAbertura: e.target.value })} /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Descrição</label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição da OS" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
