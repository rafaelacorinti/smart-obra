"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Plus, ChevronRight, Package, DollarSign, Clock, CheckCircle2, Truck, CreditCard, Filter, ArrowRight } from "lucide-react";
import { useObras, useFornecedores } from "@/hooks/use-storage-data";
import { generateId } from "@/lib/storage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type CompraStatus = "SOLICITACAO" | "COTACAO" | "APROVACAO" | "PEDIDO" | "RECEBIMENTO" | "PAGAMENTO";

interface Cotacao {
  fornecedorId: string;
  fornecedorNome: string;
  valor: number;
}

interface Compra {
  id: string;
  item: string;
  quantidade: number;
  unidade: string;
  obraId: string;
  obraNome: string;
  fornecedorId: string;
  fornecedorNome: string;
  valorUnitario: number;
  valorTotal: number;
  status: CompraStatus;
  cotacoes: Cotacao[];
  dataSolicitacao: string;
  dataCotacao?: string;
  dataAprovacao?: string;
  dataPedido?: string;
  dataRecebimento?: string;
  dataPagamento?: string;
  observacoes?: string;
  criadoEm: string;
}

const STORAGE_KEY = "smart-obra-compras";

const STATUS_CONFIG: Record<CompraStatus, { label: string; color: string; icon: React.ElementType }> = {
  SOLICITACAO: { label: "Solicitacao", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Clock },
  COTACAO: { label: "Cotacao", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: DollarSign },
  APROVACAO: { label: "Aprovacao", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", icon: CheckCircle2 },
  PEDIDO: { label: "Pedido", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Package },
  RECEBIMENTO: { label: "Recebimento", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", icon: Truck },
  PAGAMENTO: { label: "Pagamento", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CreditCard },
};

const STATUS_ORDER: CompraStatus[] = ["SOLICITACAO", "COTACAO", "APROVACAO", "PEDIDO", "RECEBIMENTO", "PAGAMENTO"];

function getCompras(): Compra[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCompras(compras: Compra[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(compras));
}

export default function ComprasPage() {
  const { obras } = useObras();
  const { fornecedores } = useFornecedores();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [novaCompraOpen, setNovaCompraOpen] = useState(false);
  const [cotacaoOpen, setCotacaoOpen] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroObra, setFiltroObra] = useState<string>("todas");

  // Form state
  const [formItem, setFormItem] = useState("");
  const [formQuantidade, setFormQuantidade] = useState("");
  const [formUnidade, setFormUnidade] = useState("un");
  const [formObraId, setFormObraId] = useState("");
  const [formFornecedorId, setFormFornecedorId] = useState("");
  const [formValorUnitario, setFormValorUnitario] = useState("");
  const [formObs, setFormObs] = useState("");

  // Cotacao form
  const [cotFornecedorId, setCotFornecedorId] = useState("");
  const [cotValor, setCotValor] = useState("");

  useEffect(() => { setCompras(getCompras()); }, []);

  const handleNovaSolicitacao = () => {
    if (!formItem || !formQuantidade || !formObraId) return;
    const obra = obras.find((o) => o.id === formObraId);
    const fornecedor = fornecedores.find((f) => f.id === formFornecedorId);
    const qtd = parseFloat(formQuantidade);
    const valorUnit = parseFloat(formValorUnitario) || 0;
    const novaCompra: Compra = {
      id: generateId(),
      item: formItem,
      quantidade: qtd,
      unidade: formUnidade,
      obraId: formObraId,
      obraNome: obra?.nome || "",
      fornecedorId: formFornecedorId,
      fornecedorNome: fornecedor?.nome || "",
      valorUnitario: valorUnit,
      valorTotal: qtd * valorUnit,
      status: "SOLICITACAO",
      cotacoes: [],
      dataSolicitacao: new Date().toISOString().split("T")[0],
      observacoes: formObs,
      criadoEm: new Date().toISOString(),
    };
    const updated = [...compras, novaCompra];
    saveCompras(updated);
    setCompras(updated);
    setFormItem(""); setFormQuantidade(""); setFormUnidade("un"); setFormObraId(""); setFormFornecedorId(""); setFormValorUnitario(""); setFormObs("");
    setNovaCompraOpen(false);
  };

  const avancarStatus = (compraId: string) => {
    const updated = compras.map((c) => {
      if (c.id !== compraId) return c;
      const currentIdx = STATUS_ORDER.indexOf(c.status);
      if (currentIdx >= STATUS_ORDER.length - 1) return c;
      const nextStatus = STATUS_ORDER[currentIdx + 1];
      const dateKey = `data${nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}` as keyof Compra;
      return { ...c, status: nextStatus, [dateKey]: new Date().toISOString().split("T")[0] };
    });
    saveCompras(updated);
    setCompras(updated);
  };

  const addCotacao = (compraId: string) => {
    if (!cotFornecedorId || !cotValor) return;
    const fornecedor = fornecedores.find((f) => f.id === cotFornecedorId);
    const updated = compras.map((c) => {
      if (c.id !== compraId) return c;
      if (c.cotacoes.length >= 3) return c;
      return { ...c, cotacoes: [...c.cotacoes, { fornecedorId: cotFornecedorId, fornecedorNome: fornecedor?.nome || cotFornecedorId, valor: parseFloat(cotValor) }] };
    });
    saveCompras(updated);
    setCompras(updated);
    setCotFornecedorId("");
    setCotValor("");
  };

  const comprasFiltradas = compras
    .filter((c) => filtroStatus === "todos" || c.status === filtroStatus)
    .filter((c) => filtroObra === "todas" || c.obraId === filtroObra);

  const totalPorStatus = STATUS_ORDER.map((status) => ({
    status,
    count: compras.filter((c) => c.status === status).length,
    valor: compras.filter((c) => c.status === status).reduce((acc, c) => acc + c.valorTotal, 0),
  }));

  const mesAtual = new Date().toISOString().substring(0, 7);
  const totalComprasMes = compras.filter((c) => c.dataSolicitacao.substring(0, 7) === mesAtual).reduce((acc, c) => acc + c.valorTotal, 0);

  const menorCotacao = (cotacoes: Cotacao[]) => {
    if (cotacoes.length === 0) return null;
    return cotacoes.reduce((min, c) => c.valor < min.valor ? c : min, cotacoes[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestao de Compras</h1>
          <p className="text-muted-foreground">Workflow completo de solicitacao a pagamento</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "kanban" ? "default" : "outline"} size="sm" onClick={() => setViewMode("kanban")}>Kanban</Button>
          <Button variant={viewMode === "lista" ? "default" : "outline"} size="sm" onClick={() => setViewMode("lista")}>Lista</Button>
          <Dialog open={novaCompraOpen} onOpenChange={setNovaCompraOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nova Solicitacao</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova Solicitacao de Compra</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Item</Label><Input value={formItem} onChange={(e) => setFormItem(e.target.value)} placeholder="Ex: Cimento CP-II" className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Quantidade</Label><Input type="number" value={formQuantidade} onChange={(e) => setFormQuantidade(e.target.value)} className="mt-1" /></div>
                  <div><Label>Unidade</Label>
                    <Select value={formUnidade} onValueChange={setFormUnidade}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade</SelectItem><SelectItem value="kg">Kg</SelectItem><SelectItem value="m">Metro</SelectItem>
                        <SelectItem value="m2">m²</SelectItem><SelectItem value="m3">m³</SelectItem><SelectItem value="sc">Saco</SelectItem><SelectItem value="lt">Litro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Obra</Label>
                  <Select value={formObraId} onValueChange={setFormObraId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
                    <SelectContent>{obras.map((obra) => (<SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Fornecedor</Label>
                  <Select value={formFornecedorId} onValueChange={setFormFornecedorId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                    <SelectContent>{fornecedores.map((f) => (<SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Valor Unitario (R$)</Label><Input type="number" step="0.01" value={formValorUnitario} onChange={(e) => setFormValorUnitario(e.target.value)} className="mt-1" /></div>
                <div><Label>Observacoes</Label><Textarea value={formObs} onChange={(e) => setFormObs(e.target.value)} className="mt-1" /></div>
                <Button onClick={handleNovaSolicitacao} className="w-full" disabled={!formItem || !formQuantidade || !formObraId}>Criar Solicitacao</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {totalPorStatus.map(({ status, count, valor }) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <Card key={status} className="p-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium truncate">{config.label}</span>
              </div>
              <p className="mt-1 text-lg font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </Card>
          );
        })}
        <Card className="p-3 bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-blue-600" /><span className="text-xs font-medium">Total Mes</span></div>
          <p className="mt-1 text-lg font-bold text-blue-700 dark:text-blue-300">R$ {totalComprasMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </Card>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STATUS_ORDER.map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const statusCompras = compras.filter((c) => c.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{config.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{statusCompras.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {statusCompras.map((compra) => {
                    const menor = menorCotacao(compra.cotacoes);
                    return (
                      <Card key={compra.id} className="p-3">
                        <p className="font-medium text-sm truncate">{compra.item}</p>
                        <p className="text-xs text-muted-foreground">{compra.obraNome}</p>
                        <p className="text-xs mt-1">{compra.quantidade} {compra.unidade} - R$ {compra.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        {compra.status === "COTACAO" && (
                          <div className="mt-2 space-y-1">
                            {compra.cotacoes.map((cot, idx) => (
                              <div key={idx} className={`text-xs px-2 py-1 rounded ${menor && cot.valor === menor.valor ? "bg-green-100 text-green-700 font-semibold dark:bg-green-900 dark:text-green-300" : "bg-muted"}`}>
                                {cot.fornecedorNome}: R$ {cot.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                {menor && cot.valor === menor.valor && " ★"}
                              </div>
                            ))}
                            {compra.cotacoes.length < 3 && (
                              <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => { setCotacaoOpen(compra.id); setCotFornecedorId(""); setCotValor(""); }}>
                                + Adicionar Cotacao
                              </Button>
                            )}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{format(new Date(compra.dataSolicitacao), "dd/MM/yy")}</span>
                          {STATUS_ORDER.indexOf(compra.status) < STATUS_ORDER.length - 1 && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => avancarStatus(compra.id)}>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista View */}
      {viewMode === "lista" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  {STATUS_ORDER.map((s) => (<SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filtroObra} onValueChange={setFiltroObra}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas obras</SelectItem>
                  {obras.map((o) => (<SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {comprasFiltradas.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Nenhuma compra encontrada</p>
              ) : (
                comprasFiltradas.map((compra) => (
                  <div key={compra.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{compra.item}</p>
                      <p className="text-xs text-muted-foreground">{compra.obraNome} | {compra.quantidade} {compra.unidade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">R$ {compra.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">{compra.fornecedorNome || "Sem fornecedor"}</p>
                    </div>
                    <Badge className={STATUS_CONFIG[compra.status].color}>{STATUS_CONFIG[compra.status].label}</Badge>
                    {STATUS_ORDER.indexOf(compra.status) < STATUS_ORDER.length - 1 && (
                      <Button variant="outline" size="sm" onClick={() => avancarStatus(compra.id)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cotacao Dialog */}
      <Dialog open={cotacaoOpen !== null} onOpenChange={() => setCotacaoOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar Cotacao</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Fornecedor</Label>
              <Select value={cotFornecedorId} onValueChange={setCotFornecedorId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{fornecedores.map((f) => (<SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor Total (R$)</Label><Input type="number" step="0.01" value={cotValor} onChange={(e) => setCotValor(e.target.value)} className="mt-1" /></div>
            <Button onClick={() => { if (cotacaoOpen) addCotacao(cotacaoOpen); setCotacaoOpen(null); }} className="w-full" disabled={!cotFornecedorId || !cotValor}>Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}