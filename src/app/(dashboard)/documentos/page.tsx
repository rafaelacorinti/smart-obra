"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FolderOpen, Plus, Pencil, Trash2, Search, FileIcon } from "lucide-react";
import { documentosStorage } from "@/lib/storage";
import { useToast } from "@/lib/use-toast";
import type { Documento } from "@/types";

const defaultForm = { obraId: "", nome: "", tipo: "", url: "" };

export default function DocumentosPage() {
  const [loading, setLoading] = React.useState(true);
  const [documentos, setDocumentos] = React.useState<Documento[]>([]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const { toast } = useToast();

  const loadData = () => { setDocumentos(documentosStorage.getAll()); setLoading(false); };
  React.useEffect(() => { loadData(); }, []);

  const filtered = documentos.filter((d) => d.nome.toLowerCase().includes(search.toLowerCase()) || d.tipo.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.nome.trim()) { toast({ title: "Erro", description: "Nome obrigatório", variant: "destructive" }); return; }
    if (editingId) { documentosStorage.update(editingId, form); toast({ title: "Documento atualizado", variant: "success" }); }
    else { documentosStorage.create(form); toast({ title: "Documento criado", variant: "success" }); }
    setDialogOpen(false); setEditingId(null); setForm(defaultForm); loadData();
  };

  const handleEdit = (d: Documento) => { setForm({ obraId: d.obraId, nome: d.nome, tipo: d.tipo, url: d.url }); setEditingId(d.id); setDialogOpen(true); };
  const handleDelete = (d: Documento) => { documentosStorage.delete(d.id); toast({ title: "Documento removido", variant: "destructive" }); loadData(); };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Documentos</h1><p className="text-sm text-gray-500 mt-1">Gerencie seus documentos</p></div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Novo Documento</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Buscar documentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Nenhum documento encontrado" description={search ? "Tente outra busca" : "Adicione seu primeiro documento"}>
          {!search && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo Documento</Button>}
        </EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-yellow-50 p-2"><FileIcon className="h-5 w-5 text-yellow-600" /></div>
                <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{d.nome}</p><p className="text-xs text-gray-500">{d.tipo || "Documento"}</p></div>
                <div className="flex gap-1">
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
          <DialogHeader><DialogTitle>{editingId ? "Editar Documento" : "Novo Documento"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Nome *</label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do documento" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Tipo</label><Input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="Ex: Projeto, Alvará, ART" /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">URL/Caminho</label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Link ou caminho do arquivo" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
