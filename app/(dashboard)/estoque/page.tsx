"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Package, Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle,
  AlertTriangle, Truck, TrendingDown, TrendingUp,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";

import {
  useMateriaisEstoque, useMovimentacoes, useFornecedores, useObras,
} from "@/hooks/use-storage-data";
import { MaterialEstoque, MovimentacaoEstoque, Fornecedor } from "@/lib/mock-data";

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(dateStr: string) {
  try { return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR }); }
  catch { return dateStr; }
}

// --- Schemas -----------------------------------------------------------------

const materialSchema = z.object({
  codigo: z.string().min(1, "Informe o codigo"),
  nome: z.string().min(2, "Informe o nome"),
  unidade: z.enum(["un", "m", "m2", "m3", "kg", "l", "pc", "saco"]),
  quantidade: z.coerce.number().min(0, "Quantidade invalida"),
  estoqueMinimo: z.coerce.number().min(0, "Estoque minimo invalido"),
  valorUnitario: z.coerce.number().min(0, "Valor invalido"),
  fornecedorId: z.string().min(1, "Selecione o fornecedor"),
  fornecedor: z.string(),
});

type MaterialForm = z.infer<typeof materialSchema>;

const fornecedorSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  cnpj: z.string().min(14, "CNPJ invalido"),
  telefone: z.string().min(8, "Telefone invalido"),
  email: z.string().email("Email invalido"),
  endereco: z.string().min(5, "Informe o endereco"),
});

type FornecedorForm = z.infer<typeof fornecedorSchema>;

// --- Page --------------------------------------------------------------------

export default function EstoquePage() {
  const { materiais, loading, createMaterial, updateMaterial, deleteMaterial } = useMateriaisEstoque();
  const { movimentacoes, createMovimentacao } = useMovimentacoes();
  const { fornecedores, createFornecedor, updateFornecedor, deleteFornecedor } = useFornecedores();
  const { obras } = useObras();

  // Material dialog
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [deleteMaterialId, setDeleteMaterialId] = useState<string | null>(null);

  // Movement dialog
  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [movMaterialId, setMovMaterialId] = useState("");
  const [movTipo, setMovTipo] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [movQuantidade, setMovQuantidade] = useState("");
  const [movObraId, setMovObraId] = useState("");
  const [movMotivo, setMovMotivo] = useState("");

  // Fornecedor dialog
  const [fornDialogOpen, setFornDialogOpen] = useState(false);
  const [editingFornId, setEditingFornId] = useState<string | null>(null);
  const [deleteFornId, setDeleteFornId] = useState<string | null>(null);

  // Filters
  const [filterFornecedor, setFilterFornecedor] = useState("TODOS");
  const [filterAlerta, setFilterAlerta] = useState(false);

  const materialForm = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: { codigo: "", nome: "", unidade: "un", quantidade: 0, estoqueMinimo: 0, valorUnitario: 0, fornecedorId: "", fornecedor: "" },
  });

  const fornForm = useForm<FornecedorForm>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { nome: "", cnpj: "", telefone: "", email: "", endereco: "" },
  });

  // --- KPIs ------------------------------------------------------------------

  const kpis = useMemo(() => ({
    totalMateriais: materiais.length,
    emAlerta: materiais.filter((m) => m.quantidade <= m.estoqueMinimo).length,
    valorTotal: materiais.reduce((s, m) => s + m.quantidade * m.valorUnitario, 0),
    totalFornecedores: fornecedores.length,
  }), [materiais, fornecedores]);

  // --- Filtered materials ----------------------------------------------------

  const materiaisFiltrados = useMemo(() => {
    return materiais.filter((m) => {
      if (filterFornecedor !== "TODOS" && m.fornecedorId !== filterFornecedor) return false;
      if (filterAlerta && m.quantidade > m.estoqueMinimo) return false;
      return true;
    });
  }, [materiais, filterFornecedor, filterAlerta]);

  // --- Material handlers -----------------------------------------------------

  function openNewMaterial() {
    setEditingMaterialId(null);
    materialForm.reset({ codigo: "", nome: "", unidade: "un", quantidade: 0, estoqueMinimo: 0, valorUnitario: 0, fornecedorId: "", fornecedor: "" });
    setMaterialDialogOpen(true);
  }

  function openEditMaterial(m: MaterialEstoque) {
    setEditingMaterialId(m.id);
    materialForm.reset({ codigo: m.codigo, nome: m.nome, unidade: m.unidade, quantidade: m.quantidade, estoqueMinimo: m.estoqueMinimo, valorUnitario: m.valorUnitario, fornecedorId: m.fornecedorId, fornecedor: m.fornecedor });
    setMaterialDialogOpen(true);
  }

  function onSubmitMaterial(values: MaterialForm) {
    const forn = fornecedores.find((f) => f.id === values.fornecedorId);
    const data = { ...values, fornecedor: forn?.nome ?? values.fornecedor };
    if (editingMaterialId) {
      updateMaterial(editingMaterialId, data);
    } else {
      createMaterial(data);
    }
    setMaterialDialogOpen(false);
  }

  function confirmDeleteMaterial() {
    if (deleteMaterialId) { deleteMaterial(deleteMaterialId); setDeleteMaterialId(null); }
  }

  // --- Movement handlers -----------------------------------------------------

  function submitMovimentacao() {
    if (!movMaterialId || !movQuantidade) return;
    const mat = materiais.find((m) => m.id === movMaterialId);
    const obra = obras.find((o) => o.id === movObraId);
    createMovimentacao({
      materialId: movMaterialId,
      materialNome: mat?.nome ?? "",
      tipo: movTipo,
      quantidade: Number(movQuantidade),
      obraId: movObraId || undefined,
      obraNome: obra?.nome ?? undefined,
      responsavel: "Operador",
      motivo: movMotivo,
      data: new Date().toISOString().split("T")[0],
    });
    // Update material quantity
    if (mat) {
      const novaQtd = movTipo === "ENTRADA" ? mat.quantidade + Number(movQuantidade) : Math.max(0, mat.quantidade - Number(movQuantidade));
      updateMaterial(mat.id, { quantidade: novaQtd });
    }
    setMovDialogOpen(false);
    setMovMaterialId(""); setMovQuantidade(""); setMovMotivo(""); setMovObraId("");
  }

  // --- Fornecedor handlers ---------------------------------------------------

  function openNewForn() {
    setEditingFornId(null);
    fornForm.reset({ nome: "", cnpj: "", telefone: "", email: "", endereco: "" });
    setFornDialogOpen(true);
  }

  function openEditForn(f: Fornecedor) {
    setEditingFornId(f.id);
    fornForm.reset({ nome: f.nome, cnpj: f.cnpj, telefone: f.telefone, email: f.email, endereco: f.endereco });
    setFornDialogOpen(true);
  }

  function onSubmitForn(values: FornecedorForm) {
    if (editingFornId) {
      updateFornecedor(editingFornId, values);
    } else {
      createFornecedor(values);
    }
    setFornDialogOpen(false);
  }

  function confirmDeleteForn() {
    if (deleteFornId) { deleteFornecedor(deleteFornId); setDeleteFornId(null); }
  }

  // --- Columns ---------------------------------------------------------------

  const materialColumns = [
    { key: "codigo", label: "Codigo", sortable: true, render: (m: MaterialEstoque) => <span className="font-mono text-sm">{m.codigo}</span> },
    { key: "nome", label: "Material", sortable: true },
    { key: "unidade", label: "Unidade" },
    {
      key: "quantidade", label: "Qtd. Atual",
      render: (m: MaterialEstoque) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${m.quantidade <= m.estoqueMinimo ? "text-red-600" : ""}`}>{m.quantidade}</span>
          {m.quantidade <= m.estoqueMinimo && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
      ),
    },
    { key: "estoqueMinimo", label: "Min.", render: (m: MaterialEstoque) => <span className="text-muted-foreground">{m.estoqueMinimo}</span> },
    { key: "valorUnitario", label: "Valor Unit.", render: (m: MaterialEstoque) => fmt(m.valorUnitario) },
    { key: "fornecedor", label: "Fornecedor" },
    {
      key: "acoes", label: "Acoes",
      render: (m: MaterialEstoque) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEditMaterial(m)} className="rounded p-1 hover:bg-muted" title="Editar">
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setDeleteMaterialId(m.id)} className="rounded p-1 hover:bg-muted" title="Excluir">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  const movimentacaoColumns = [
    { key: "data", label: "Data", sortable: true, render: (m: MovimentacaoEstoque) => fmtDate(m.data) },
    { key: "materialNome", label: "Material", sortable: true },
    {
      key: "tipo", label: "Tipo",
      render: (m: MovimentacaoEstoque) => (
        <div className="flex items-center gap-1.5">
          {m.tipo === "ENTRADA" ? (
            <><ArrowDownCircle className="h-4 w-4 text-green-600" /><span className="text-sm font-medium text-green-700 dark:text-green-400">Entrada</span></>
          ) : (
            <><ArrowUpCircle className="h-4 w-4 text-red-600" /><span className="text-sm font-medium text-red-700 dark:text-red-400">Saida</span></>
          )}
        </div>
      ),
    },
    { key: "quantidade", label: "Qtd", render: (m: MovimentacaoEstoque) => <span className="font-medium">{m.quantidade}</span> },
    { key: "obraNome", label: "Obra", render: (m: MovimentacaoEstoque) => m.obraNome ?? "-" },
    { key: "responsavel", label: "Responsavel" },
    { key: "motivo", label: "Motivo" },
  ];

  const fornecedorColumns = [
    { key: "nome", label: "Nome", sortable: true },
    { key: "cnpj", label: "CNPJ" },
    { key: "telefone", label: "Telefone" },
    { key: "email", label: "Email" },
    {
      key: "acoes", label: "Acoes",
      render: (f: Fornecedor) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEditForn(f)} className="rounded p-1 hover:bg-muted" title="Editar">
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setDeleteFornId(f.id)} className="rounded p-1 hover:bg-muted" title="Excluir">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  // --- Render ----------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Estoque"
        breadcrumbs={[{ label: "Estoque" }]}
        actions={
          <Button onClick={openNewMaterial}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Material
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Materiais" value={kpis.totalMateriais} icon={Package} />
        <StatCard title="Em Alerta" value={kpis.emAlerta} icon={AlertTriangle} />
        <StatCard title="Valor em Estoque" value={fmt(kpis.valorTotal)} icon={TrendingUp} />
        <StatCard title="Fornecedores" value={kpis.totalFornecedores} icon={Truck} />
      </div>

      <Tabs defaultValue="materiais">
        <TabsList className="mb-6">
          <TabsTrigger value="materiais"><Package className="mr-1.5 h-4 w-4" />Materiais</TabsTrigger>
          <TabsTrigger value="movimentacoes"><TrendingDown className="mr-1.5 h-4 w-4" />Movimentacoes</TabsTrigger>
          <TabsTrigger value="fornecedores"><Truck className="mr-1.5 h-4 w-4" />Fornecedores</TabsTrigger>
        </TabsList>

        {/* Materiais Tab */}
        <TabsContent value="materiais">
          <div className="mb-4 flex flex-wrap gap-3">
            <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant={filterAlerta ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterAlerta(!filterAlerta)}
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              {filterAlerta ? "Mostrando alertas" : "Filtrar alertas"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setFilterFornecedor("TODOS"); setFilterAlerta(false); }}>
              Limpar filtros
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <DataTable data={materiaisFiltrados} columns={materialColumns} searchPlaceholder="Buscar material por nome ou codigo..." pageSize={10} />
          </div>
        </TabsContent>

        {/* Movimentacoes Tab */}
        <TabsContent value="movimentacoes">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => setMovDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Nova Movimentacao
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <DataTable data={movimentacoes} columns={movimentacaoColumns} searchPlaceholder="Buscar movimentacao..." pageSize={15} />
          </div>
        </TabsContent>

        {/* Fornecedores Tab */}
        <TabsContent value="fornecedores">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={openNewForn}>
              <Plus className="mr-1 h-4 w-4" /> Novo Fornecedor
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <DataTable data={fornecedores} columns={fornecedorColumns} searchPlaceholder="Buscar fornecedor..." pageSize={10} />
          </div>
        </TabsContent>
      </Tabs>

      {/* -- Material Dialog --------------------------------------------- */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMaterialId ? "Editar Material" : "Novo Material"}</DialogTitle>
            <DialogDescription>{editingMaterialId ? "Atualize os dados do material." : "Cadastre um novo material no estoque."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={materialForm.handleSubmit(onSubmitMaterial)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Codigo Interno *</Label>
                <Input {...materialForm.register("codigo")} placeholder="MAT-000" />
                {materialForm.formState.errors.codigo && <p className="text-xs text-red-500">{materialForm.formState.errors.codigo.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Unidade *</Label>
                <Select value={materialForm.watch("unidade")} onValueChange={(v) => materialForm.setValue("unidade", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidade (un)</SelectItem>
                    <SelectItem value="m">Metro (m)</SelectItem>
                    <SelectItem value="m2">Metro quad. (m2)</SelectItem>
                    <SelectItem value="m3">Metro cub. (m3)</SelectItem>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="l">Litro (l)</SelectItem>
                    <SelectItem value="pc">Peca (pc)</SelectItem>
                    <SelectItem value="saco">Saco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nome do Material *</Label>
              <Input {...materialForm.register("nome")} placeholder="Nome do material" />
              {materialForm.formState.errors.nome && <p className="text-xs text-red-500">{materialForm.formState.errors.nome.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Quantidade *</Label>
                <Input type="number" step="0.01" min="0" {...materialForm.register("quantidade")} />
              </div>
              <div className="space-y-1">
                <Label>Estoque Minimo *</Label>
                <Input type="number" step="0.01" min="0" {...materialForm.register("estoqueMinimo")} />
              </div>
              <div className="space-y-1">
                <Label>Valor Unit. (R$) *</Label>
                <Input type="number" step="0.01" min="0" {...materialForm.register("valorUnitario")} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fornecedor *</Label>
              <Select value={materialForm.watch("fornecedorId")} onValueChange={(v) => { materialForm.setValue("fornecedorId", v); const f = fornecedores.find(x => x.id === v); if (f) materialForm.setValue("fornecedor", f.nome); }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {materialForm.formState.errors.fornecedorId && <p className="text-xs text-red-500">{materialForm.formState.errors.fornecedorId.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMaterialDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingMaterialId ? "Salvar" : "Cadastrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -- Movimentacao Dialog ------------------------------------------ */}
      <Dialog open={movDialogOpen} onOpenChange={setMovDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Movimentacao</DialogTitle>
            <DialogDescription>Registre uma entrada ou saida de material.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Material *</Label>
              <Select value={movMaterialId} onValueChange={setMovMaterialId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {materiais.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.codigo})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo *</Label>
                <Select value={movTipo} onValueChange={(v) => setMovTipo(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRADA">Entrada</SelectItem>
                    <SelectItem value="SAIDA">Saida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Quantidade *</Label>
                <Input type="number" min="1" value={movQuantidade} onChange={(e) => setMovQuantidade(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Obra (opcional)</Label>
              <Select value={movObraId} onValueChange={setMovObraId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Input value={movMotivo} onChange={(e) => setMovMotivo(e.target.value)} placeholder="Ex: Compra mensal" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovDialogOpen(false)}>Cancelar</Button>
            <Button onClick={submitMovimentacao} disabled={!movMaterialId || !movQuantidade}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -- Fornecedor Dialog ------------------------------------------- */}
      <Dialog open={fornDialogOpen} onOpenChange={setFornDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFornId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            <DialogDescription>{editingFornId ? "Atualize os dados do fornecedor." : "Cadastre um novo fornecedor."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={fornForm.handleSubmit(onSubmitForn)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input {...fornForm.register("nome")} placeholder="Nome da empresa" />
                {fornForm.formState.errors.nome && <p className="text-xs text-red-500">{fornForm.formState.errors.nome.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>CNPJ *</Label>
                <Input {...fornForm.register("cnpj")} placeholder="00.000.000/0001-00" />
                {fornForm.formState.errors.cnpj && <p className="text-xs text-red-500">{fornForm.formState.errors.cnpj.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Telefone *</Label>
                <Input {...fornForm.register("telefone")} placeholder="(11) 3333-0000" />
                {fornForm.formState.errors.telefone && <p className="text-xs text-red-500">{fornForm.formState.errors.telefone.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input {...fornForm.register("email")} placeholder="email@empresa.com" />
                {fornForm.formState.errors.email && <p className="text-xs text-red-500">{fornForm.formState.errors.email.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Endereco *</Label>
              <Input {...fornForm.register("endereco")} placeholder="Endereco completo" />
              {fornForm.formState.errors.endereco && <p className="text-xs text-red-500">{fornForm.formState.errors.endereco.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFornDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingFornId ? "Salvar" : "Cadastrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -- Delete Material Dialog -------------------------------------- */}
      <Dialog open={!!deleteMaterialId} onOpenChange={(o) => { if (!o) setDeleteMaterialId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir material</DialogTitle>
            <DialogDescription>Tem certeza? Esta acao nao pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMaterialId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteMaterial}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -- Delete Fornecedor Dialog ------------------------------------ */}
      <Dialog open={!!deleteFornId} onOpenChange={(o) => { if (!o) setDeleteFornId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir fornecedor</DialogTitle>
            <DialogDescription>Tem certeza? Esta acao nao pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFornId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteForn}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
