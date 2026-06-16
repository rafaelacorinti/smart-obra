"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, User, Clock, DollarSign, FileText, Building2,
  Plus, CheckCircle2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";

import {
  useColaboradores, usePresencas, usePagamentosColaborador,
  useDocumentosColaborador,
} from "@/hooks/use-storage-data";
import { PresencaColaborador, PagamentoColaborador, DocumentoColaborador } from "@/lib/mock-data";

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(dateStr: string) {
  try { return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR }); }
  catch { return dateStr; }
}

const TIPO_PRESENCA_COLORS: Record<string, string> = {
  NORMAL: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  EXTRA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  FALTA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function ColaboradorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { colaboradores } = useColaboradores();
  const { presencas, createPresenca } = usePresencas(id);
  const { pagamentos, createPagamento, updatePagamento } = usePagamentosColaborador(id);
  const { documentos, createDocumento } = useDocumentosColaborador(id);

  const [presencaDialogOpen, setPresencaDialogOpen] = useState(false);
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const [documentoDialogOpen, setDocumentoDialogOpen] = useState(false);

  const colaborador = colaboradores.find((c) => c.id === id);

  // Presenca form
  const [presData, setPresData] = useState(new Date().toISOString().split("T")[0]);
  const [presCheckIn, setPresCheckIn] = useState("07:00");
  const [presCheckOut, setPresCheckOut] = useState("17:00");
  const [presTipo, setPresTipo] = useState<"NORMAL" | "EXTRA" | "FALTA">("NORMAL");

  // Pagamento form
  const [pagTipo, setPagTipo] = useState<"SALARIO" | "ADIANTAMENTO" | "COMISSAO" | "BONUS">("SALARIO");
  const [pagValor, setPagValor] = useState("");
  const [pagData, setPagData] = useState(new Date().toISOString().split("T")[0]);
  const [pagDesc, setPagDesc] = useState("");

  // Documento form
  const [docTipo, setDocTipo] = useState<"RG" | "CPF" | "CNH" | "ASO" | "CTPS" | "CERTIDAO" | "OUTRO">("RG");
  const [docNome, setDocNome] = useState("");
  const [docValidade, setDocValidade] = useState("");

  const totalHoras = useMemo(() => presencas.reduce((s, p) => s + p.horas, 0), [presencas]);

  function submitPresenca() {
    const horas = presTipo === "FALTA" ? 0 : (() => {
      const [h1, m1] = presCheckIn.split(":").map(Number);
      const [h2, m2] = presCheckOut.split(":").map(Number);
      return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60);
    })();
    createPresenca({ colaboradorId: id, data: presData, checkIn: presCheckIn, checkOut: presCheckOut, horas: Math.round(horas * 10) / 10, tipo: presTipo });
    setPresencaDialogOpen(false);
  }

  function submitPagamento() {
    if (!pagValor) return;
    createPagamento({ colaboradorId: id, tipo: pagTipo, valor: Number(pagValor), data: pagData, status: "PENDENTE", descricao: pagDesc });
    setPagamentoDialogOpen(false);
    setPagValor(""); setPagDesc("");
  }

  function submitDocumento() {
    if (!docNome) return;
    createDocumento({ colaboradorId: id, tipo: docTipo, nome: docNome, validade: docValidade || undefined, url: "#" });
    setDocumentoDialogOpen(false);
    setDocNome(""); setDocValidade("");
  }

  function marcarPago(pag: PagamentoColaborador) {
    updatePagamento(pag.id, { status: "PAGO" });
  }

  if (!colaborador) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Colaborador nao encontrado</p>
        <Button variant="outline" onClick={() => router.push("/colaboradores")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  const presencaColumns = [
    { key: "data", label: "Data", sortable: true, render: (p: PresencaColaborador) => fmtDate(p.data) },
    { key: "checkIn", label: "Check-in" },
    { key: "checkOut", label: "Check-out", render: (p: PresencaColaborador) => p.checkOut || "-" },
    { key: "horas", label: "Horas", render: (p: PresencaColaborador) => `${p.horas}h` },
    {
      key: "tipo", label: "Tipo",
      render: (p: PresencaColaborador) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPO_PRESENCA_COLORS[p.tipo]}`}>
          {p.tipo === "NORMAL" ? "Normal" : p.tipo === "EXTRA" ? "Extra" : "Falta"}
        </span>
      ),
    },
  ];

  const pagamentoColumns = [
    {
      key: "tipo", label: "Tipo",
      render: (p: PagamentoColaborador) => (
        <span className="text-sm font-medium capitalize">{p.tipo.toLowerCase()}</span>
      ),
    },
    { key: "descricao", label: "Descricao" },
    { key: "valor", label: "Valor", render: (p: PagamentoColaborador) => <span className="font-medium">{fmt(p.valor)}</span> },
    { key: "data", label: "Data", render: (p: PagamentoColaborador) => fmtDate(p.data) },
    {
      key: "status", label: "Status",
      render: (p: PagamentoColaborador) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === "PAGO" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
          {p.status === "PAGO" ? "Pago" : "Pendente"}
        </span>
      ),
    },
    {
      key: "acao", label: "",
      render: (p: PagamentoColaborador) => p.status === "PENDENTE" ? (
        <Button size="sm" variant="outline" onClick={() => marcarPago(p)}>
          <CheckCircle2 className="mr-1 h-3 w-3" /> Pagar
        </Button>
      ) : null,
    },
  ];

  const documentoColumns = [
    { key: "tipo", label: "Tipo", render: (d: DocumentoColaborador) => <span className="font-medium">{d.tipo}</span> },
    { key: "nome", label: "Nome" },
    { key: "validade", label: "Validade", render: (d: DocumentoColaborador) => d.validade ? fmtDate(d.validade) : "-" },
    { key: "criadoEm", label: "Adicionado em", render: (d: DocumentoColaborador) => fmtDate(d.criadoEm) },
  ];

  return (
    <div>
      <PageHeader
        title={colaborador.nome}
        breadcrumbs={[
          { label: "Colaboradores", href: "/colaboradores" },
          { label: colaborador.nome },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push("/colaboradores")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        }
      />

      <Tabs defaultValue="dados">
        <TabsList className="mb-6">
          <TabsTrigger value="dados"><User className="mr-1.5 h-4 w-4" />Dados</TabsTrigger>
          <TabsTrigger value="presenca"><Clock className="mr-1.5 h-4 w-4" />Presenca</TabsTrigger>
          <TabsTrigger value="pagamentos"><DollarSign className="mr-1.5 h-4 w-4" />Pagamentos</TabsTrigger>
          <TabsTrigger value="documentos"><FileText className="mr-1.5 h-4 w-4" />Documentos</TabsTrigger>
          <TabsTrigger value="obras"><Building2 className="mr-1.5 h-4 w-4" />Obras</TabsTrigger>
        </TabsList>

        {/* Dados */}
        <TabsContent value="dados">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{colaborador.nome}</p></div>
                <div><p className="text-xs text-muted-foreground">CPF</p><p className="font-medium">{colaborador.cpf}</p></div>
                <div><p className="text-xs text-muted-foreground">Cargo</p><p className="font-medium">{colaborador.cargo}</p></div>
                <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{colaborador.telefone}</p></div>
              </div>
              <div className="space-y-4">
                <div><p className="text-xs text-muted-foreground">Endereco</p><p className="font-medium">{colaborador.endereco}</p></div>
                <div><p className="text-xs text-muted-foreground">Salario</p><p className="font-medium">{fmt(colaborador.salario)}</p></div>
                <div><p className="text-xs text-muted-foreground">Data Admissao</p><p className="font-medium">{fmtDate(colaborador.dataAdmissao)}</p></div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colaborador.status === "ATIVO" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : colaborador.status === "FERIAS" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {colaborador.status === "ATIVO" ? "Ativo" : colaborador.status === "FERIAS" ? "Ferias" : "Inativo"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Presenca */}
        <TabsContent value="presenca">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-lg border bg-card px-4 py-2">
                <p className="text-xs text-muted-foreground">Total de horas</p>
                <p className="text-lg font-bold">{totalHoras}h</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setPresencaDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Registrar Presenca
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <DataTable data={presencas} columns={presencaColumns} searchPlaceholder="Buscar..." pageSize={15} />
          </div>
        </TabsContent>

        {/* Pagamentos */}
        <TabsContent value="pagamentos">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => setPagamentoDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Novo Pagamento
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <DataTable data={pagamentos} columns={pagamentoColumns} searchPlaceholder="Buscar pagamentos..." pageSize={10} />
          </div>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => setDocumentoDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Novo Documento
            </Button>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <DataTable data={documentos} columns={documentoColumns} searchPlaceholder="Buscar documentos..." pageSize={10} />
          </div>
        </TabsContent>

        {/* Obras */}
        <TabsContent value="obras">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Obras vinculadas serao exibidas conforme os registros de colaboradores por obra.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Presenca Dialog */}
      <Dialog open={presencaDialogOpen} onOpenChange={setPresencaDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Presenca</DialogTitle>
            <DialogDescription>Informe os dados de presenca.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Data</Label><Input type="date" value={presData} onChange={(e) => setPresData(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Check-in</Label><Input type="time" value={presCheckIn} onChange={(e) => setPresCheckIn(e.target.value)} /></div>
              <div className="space-y-1"><Label>Check-out</Label><Input type="time" value={presCheckOut} onChange={(e) => setPresCheckOut(e.target.value)} /></div>
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={presTipo} onValueChange={(v) => setPresTipo(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="EXTRA">Extra</SelectItem>
                  <SelectItem value="FALTA">Falta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPresencaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={submitPresenca}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagamento Dialog */}
      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Pagamento</DialogTitle>
            <DialogDescription>Registre um novo pagamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={pagTipo} onValueChange={(v) => setPagTipo(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALARIO">Salario</SelectItem>
                  <SelectItem value="ADIANTAMENTO">Adiantamento</SelectItem>
                  <SelectItem value="COMISSAO">Comissao</SelectItem>
                  <SelectItem value="BONUS">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Valor (R$)</Label><Input type="number" step="0.01" min="0" value={pagValor} onChange={(e) => setPagValor(e.target.value)} /></div>
            <div className="space-y-1"><Label>Data</Label><Input type="date" value={pagData} onChange={(e) => setPagData(e.target.value)} /></div>
            <div className="space-y-1"><Label>Descricao</Label><Input value={pagDesc} onChange={(e) => setPagDesc(e.target.value)} placeholder="Ex: Salario outubro" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={submitPagamento}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documento Dialog */}
      <Dialog open={documentoDialogOpen} onOpenChange={setDocumentoDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
            <DialogDescription>Adicione um documento ao colaborador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={docTipo} onValueChange={(v) => setDocTipo(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RG">RG</SelectItem>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNH">CNH</SelectItem>
                  <SelectItem value="ASO">ASO</SelectItem>
                  <SelectItem value="CTPS">CTPS</SelectItem>
                  <SelectItem value="CERTIDAO">Certidao</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Nome do documento</Label><Input value={docNome} onChange={(e) => setDocNome(e.target.value)} placeholder="Ex: RG frente e verso" /></div>
            <div className="space-y-1"><Label>Validade</Label><Input type="date" value={docValidade} onChange={(e) => setDocValidade(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={submitDocumento}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}