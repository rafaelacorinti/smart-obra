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
import { Building2, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { obrasStorage } from "@/lib/storage";
import { useToast } from "@/lib/use-toast";
import { useSearchParams } from "next/navigation";
import type { Obra } from "@/types";

const statusOptions = [
  { value: "em_andamento", label: "Em Andamento" },
  { value: "pausada", label: "Pausada" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

const defaultForm = {
  nome: "", cliente: "", endereco: "", status: "em_andamento" as Obra["status"],
  dataInicio: "", dataPrevisao: "", orcamento: 0, progresso: 0, descricao: "",
};

export default function ObrasPage() {
  const [loading, setLoading] = React.useState(true);
  const [obras, setObras] = React.useState<Obra[]>([]);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(defaultForm);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const loadData = () => {
    setObras(obrasStorage.getAll());
    setLoading(false);
  };

  React.useEffect(() => { loadData(); }, []);
  React.useEffect(() => {
    if (searchParams.get("new") === "1") { setDialogOpen(true); }
  }, [searchParams]);

  const filtered = obras.filter((o) =>
    o.nome.toLowerCase().includes(search.toLowerCase()) ||
    o.cliente.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.nome.trim()) { toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" }); return; }
    if (editingId) {
      obrasStorage.update(editingId, form);
      toast({ title: "Obra atualizada", description: `"${form.nome}" foi atualizada com sucesso`, variant: "success" });
    } else {
      obrasStorage.create(form);
      toast({ title: "Obra criada", description: `"${form.nome}" foi criada com sucesso`, variant: "success" });
    }
    setDialogOpen(false);
    setEditingId(null);
    setForm(defaultForm);
    loadData();
  };

  const handleEdit = (obra: Obra) => {
    setForm({ nome: obra.nome, cliente: obra.cliente, endereco: obra.endereco, status: obra.status, dataInicio: obra.dataInicio, dataPrevisao: obra.dataPrevisao, orcamento: obra.orcamento, progresso: obra.progresso, descricao: obra.descricao });
    setEditingId(obra.id);
    setDialogOpen(true);
  };

  const handleDelete = (obra: Obra) => {
    obrasStorage.delete(obra.id);
    toast({ title: "Obra removida", description: `"${obra.nome}" foi removida`, variant: "destructive" });
    loadData();
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Obras</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas obras</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setEditingId(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Obra
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Buscar obras..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhuma obra encontrada" description={search ? "Tente uma busca diferente" : "Comece criando sua primeira obra"}>
          {!search && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova Obra</Button>}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((obra) => (
            <Card key={obra.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{obra.nome}</CardTitle>
                  <Badge variant={obra.status === "em_andamento" ? "default" : obra.status === "concluida" ? "success" : obra.status === "pausada" ? "warning" : "destructive"}>
                    {statusOptions.find((s) => s.value === obra.status)?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Cliente:</span> {obra.cliente || "—"}</p>
                  <p><span className="font-medium">Endereço:</span> {obra.endereco || "—"}</p>
                  <p><span className="font-medium">Orçamento:</span> R$ {obra.orcamento.toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progresso</span>
                    <span>{obra.progresso}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-orange-600 transition-all" style={{ width: `${obra.progresso}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(obra)}><Pencil className="mr-1 h-3 w-3" /> Editar</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(obra)}><Trash2 className="mr-1 h-3 w-3" /> Excluir</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Obra" : "Nova Obra"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome da obra" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Cliente</label>
              <Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} placeholder="Nome do cliente" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Endereço</label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Endereço" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Obra["status"] })} options={statusOptions} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Orçamento (R$)</label>
                <Input type="number" value={form.orcamento} onChange={(e) => setForm({ ...form, orcamento: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Data Início</label>
                <Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Data Previsão</label>
                <Input type="date" value={form.dataPrevisao} onChange={(e) => setForm({ ...form, dataPrevisao: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Progresso (%)</label>
              <Input type="number" min={0} max={100} value={form.progresso} onChange={(e) => setForm({ ...form, progresso: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição da obra" />
            </div>
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
