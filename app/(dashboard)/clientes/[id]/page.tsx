"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useClientes, useObras, useLancamentos, useOrdensServico, useDocumentosCliente } from "@/hooks/use-storage-data";
import { DocumentoCliente } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UserCircle, Building2, DollarSign, ClipboardList, FileText, Plus, MapPin, Mail, Phone } from "lucide-react";
import Link from "next/link";

const statusObraConfig: Record<string, { label: string; color: string }> = {
  PLANEJAMENTO: { label: "Planejamento", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  EM_ANDAMENTO: { label: "Em Andamento", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PAUSADA: { label: "Pausada", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CONCLUIDA: { label: "Concluida", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const statusOsConfig: Record<string, { label: string; color: string }> = {
  ABERTA: { label: "Aberta", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  EM_ANDAMENTO: { label: "Em Andamento", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  AGUARDANDO_MATERIAL: { label: "Aguardando", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  FINALIZADA: { label: "Finalizada", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function ClienteDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { clientes } = useClientes();
  const { obras } = useObras();
  const { lancamentos } = useLancamentos();
  const { ordens } = useOrdensServico();
  const { documentos, createDocumento } = useDocumentosCliente(id);

  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ tipo: "CONTRATO" as DocumentoCliente["tipo"], nome: "" });

  const cliente = clientes.find((c) => c.id === id);

  const obrasCliente = useMemo(() => {
    return obras.filter((o) => o.clienteId === id);
  }, [obras, id]);

  const lancamentosCliente = useMemo(() => {
    return lancamentos.filter((l) => l.fornecedorCliente === cliente?.nome && l.tipo === "RECEITA");
  }, [lancamentos, cliente]);

  const ordensCliente = useMemo(() => {
    return ordens.filter((o) => o.clienteId === id);
  }, [ordens, id]);

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <UserCircle className="h-16 w-16 text-muted-foreground/30" />
        <p className="mt-4 text-lg font-medium">Cliente nao encontrado</p>
        <Button className="mt-4" onClick={() => router.push("/clientes")}>Voltar</Button>
      </div>
    );
  }

  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDocumento({ ...docForm, clienteId: id, url: "#" });
    setDocForm({ tipo: "CONTRATO", nome: "" });
    setShowDocForm(false);
  };

  const totalReceitas = lancamentosCliente.reduce((acc, l) => acc + l.valor, 0);

  return (
    <div>
      <PageHeader
        title={cliente.nome}
        breadcrumbs={[{ label: "Clientes", href: "/clientes" }, { label: cliente.nome }]}
      />

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="obras">Obras</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="os">OS</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        {/* ABA DADOS */}
        <TabsContent value="dados">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                  <UserCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{cliente.nome}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cliente.tipo === "PF" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"}`}>
                    {cliente.tipo === "PF" ? "Pessoa Fisica" : "Pessoa Juridica"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">{cliente.tipo === "PF" ? "CPF" : "CNPJ"}</span><span className="text-sm font-medium font-mono">{cliente.cpfCnpj}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Telefone</span><span className="text-sm font-medium flex items-center gap-1"><Phone className="h-3 w-3" />{cliente.telefone}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Email</span><span className="text-sm font-medium flex items-center gap-1"><Mail className="h-3 w-3" />{cliente.email}</span></div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h4 className="font-medium mb-4 flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereco</h4>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">CEP</span><span className="text-sm font-medium">{cliente.cep}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Rua</span><span className="text-sm font-medium">{cliente.rua}, {cliente.numero}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Bairro</span><span className="text-sm font-medium">{cliente.bairro}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Cidade/UF</span><span className="text-sm font-medium">{cliente.cidade}/{cliente.uf}</span></div>
              </div>
              {cliente.observacoes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Observacoes</p>
                  <p className="text-sm mt-1">{cliente.observacoes}</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Obras</p>
              <p className="text-2xl font-bold text-primary">{obrasCliente.length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceitas)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Ordens de Servico</p>
              <p className="text-2xl font-bold">{ordensCliente.length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Documentos</p>
              <p className="text-2xl font-bold">{documentos.length}</p>
            </div>
          </div>
        </TabsContent>

        {/* ABA OBRAS */}
        <TabsContent value="obras">
          <h3 className="text-lg font-semibold mb-4">Obras vinculadas</h3>
          {obrasCliente.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>Nenhuma obra vinculada a este cliente.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {obrasCliente.map((obra) => (
                <Link key={obra.id} href={`/obras/${obra.id}`}>
                  <div className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">{obra.nome}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusObraConfig[obra.status]?.color}`}>
                        {statusObraConfig[obra.status]?.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{obra.endereco}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Orcamento: {formatCurrency(obra.orcamento)}</span>
                      <span className="font-medium">{obra.progresso}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${obra.progresso}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA FINANCEIRO */}
        <TabsContent value="financeiro">
          <h3 className="text-lg font-semibold mb-4">Lancamentos Financeiros</h3>
          <div className="mb-4 rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total de receitas deste cliente</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceitas)}</p>
          </div>
          {lancamentosCliente.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>Nenhum lancamento vinculado a este cliente.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Descricao</th>
                    <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Categoria</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Valor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lancamentosCliente.sort((a, b) => b.data.localeCompare(a.data)).map((l) => (
                    <tr key={l.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">{l.descricao}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{l.categoria}</td>
                      <td className="px-4 py-3 text-sm font-medium text-emerald-600">{formatCurrency(l.valor)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{formatDate(l.data)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.status === "PAGO" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ABA OS */}
        <TabsContent value="os">
          <h3 className="text-lg font-semibold mb-4">Ordens de Servico</h3>
          {ordensCliente.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>Nenhuma ordem de servico vinculada a este cliente.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Servico</th>
                    <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Tecnico</th>
                    <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ordensCliente.map((os) => (
                    <tr key={os.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-mono">{os.numero}</td>
                      <td className="px-4 py-3 text-sm">{os.tipoServico}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{os.tecnico}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{formatDate(os.dataAbertura)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusOsConfig[os.status]?.color}`}>
                          {statusOsConfig[os.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ABA DOCUMENTOS */}
        <TabsContent value="documentos">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Documentos</h3>
            <Button size="sm" onClick={() => setShowDocForm(true)}>
              <Plus className="mr-2 h-4 w-4" />Novo Documento
            </Button>
          </div>
          {documentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>Nenhum documento cadastrado.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documentos.map((doc) => (
                <div key={doc.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{doc.nome}</span>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted">{doc.tipo}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Adicionado em {formatDate(doc.criadoEm)}</p>
                </div>
              ))}
            </div>
          )}
          {showDocForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDocForm(false)} />
              <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-xl mx-4">
                <h3 className="text-lg font-semibold mb-4">Novo Documento</h3>
                <form onSubmit={handleDocSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <select value={docForm.tipo} onChange={(e) => setDocForm({...docForm, tipo: e.target.value as DocumentoCliente["tipo"]})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                      <option value="CONTRATO">Contrato</option>
                      <option value="PROPOSTA">Proposta</option>
                      <option value="ORCAMENTO">Orcamento</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nome *</label>
                    <input type="text" value={docForm.nome} onChange={(e) => setDocForm({...docForm, nome: e.target.value})} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" required />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowDocForm(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
