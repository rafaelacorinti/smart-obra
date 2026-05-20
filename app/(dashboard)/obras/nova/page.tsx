"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObras } from "@/hooks/use-storage-data";
import Link from "next/link";

const clientes = [
  { id: "cli-1", nome: "Maria Oliveira" },
  { id: "cli-2", nome: "Tech Corp Ltda" },
  { id: "cli-3", nome: "Startup Innovation" },
  { id: "cli-4", nome: "Invest Group SA" },
  { id: "cli-5", nome: "Construtora ABC" },
];

interface FormErrors {
  nome?: string;
  cliente?: string;
  endereco?: string;
  dataInicio?: string;
  orcamento?: string;
}

export default function NovaObraPage() {
  const router = useRouter();
  const { createObra } = useObras();
  const [fotoCapa, setFotoCapa] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    nome: "",
    clienteId: "",
    cliente: "",
    endereco: "",
    cidade: "",
    estado: "",
    dataInicio: "",
    previsaoTermino: "",
    orcamento: "",
    descricao: "",
    status: "PLANEJAMENTO" as const,
  });

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.nome.trim()) newErrors.nome = "Nome e obrigatorio";
    if (!formData.clienteId) newErrors.cliente = "Selecione um cliente";
    if (!formData.endereco.trim()) newErrors.endereco = "Endereco e obrigatorio";
    if (!formData.dataInicio) newErrors.dataInicio = "Data de inicio e obrigatoria";
    if (!formData.orcamento || Number(formData.orcamento) <= 0) newErrors.orcamento = "Orcamento deve ser maior que zero";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const clienteNome = clientes.find((c) => c.id === formData.clienteId)?.nome || "";

    createObra({
      nome: formData.nome,
      cliente: clienteNome,
      clienteId: formData.clienteId,
      endereco: formData.endereco,
      cidade: formData.cidade,
      estado: formData.estado,
      dataInicio: formData.dataInicio,
      previsaoTermino: formData.previsaoTermino,
      orcamento: Number(formData.orcamento),
      gastoReal: 0,
      progresso: 0,
      status: formData.status,
      descricao: formData.descricao,
      fotoCapa: fotoCapa,
    });

    router.push("/obras");
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoCapa(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <PageHeader
        title="Nova Obra"
        breadcrumbs={[{ label: "Obras", href: "/obras" }, { label: "Nova Obra" }]}
        actions={
          <Link href="/obras">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold">Dados da Obra</h2>

          <div className="grid gap-6">
            {/* Foto de capa */}
            <div>
              <Label>Foto de Capa</Label>
              <div className="mt-2">
                {fotoCapa ? (
                  <div className="relative h-48 overflow-hidden rounded-lg">
                    <img src={fotoCapa} alt="Capa" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFotoCapa("")}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <ArrowLeft className="h-4 w-4 rotate-45" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50 hover:bg-muted/50">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="mt-2 text-sm text-muted-foreground">Clique para enviar uma foto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                  </label>
                )}
              </div>
            </div>

            {/* Nome */}
            <div>
              <Label htmlFor="nome">Nome da Obra *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Residencial Aurora"
                className={errors.nome ? "border-red-500" : ""}
              />
              {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome}</p>}
            </div>

            {/* Cliente */}
            <div>
              <Label>Cliente *</Label>
              <Select value={formData.clienteId} onValueChange={(value) => setFormData({ ...formData, clienteId: value })}>
                <SelectTrigger className={errors.cliente ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cli) => (
                    <SelectItem key={cli.id} value={cli.id}>{cli.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cliente && <p className="mt-1 text-xs text-red-500">{errors.cliente}</p>}
            </div>

            {/* Endereco */}
            <div>
              <Label htmlFor="endereco">Endereco *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Rua, numero"
                className={errors.endereco ? "border-red-500" : ""}
              />
              {errors.endereco && <p className="mt-1 text-xs text-red-500">{errors.endereco}</p>}
            </div>

            {/* Cidade / Estado */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Datas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="dataInicio">Data de Inicio *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  className={errors.dataInicio ? "border-red-500" : ""}
                />
                {errors.dataInicio && <p className="mt-1 text-xs text-red-500">{errors.dataInicio}</p>}
              </div>
              <div>
                <Label htmlFor="previsaoTermino">Previsao de Termino</Label>
                <Input
                  id="previsaoTermino"
                  type="date"
                  value={formData.previsaoTermino}
                  onChange={(e) => setFormData({ ...formData, previsaoTermino: e.target.value })}
                />
              </div>
            </div>

            {/* Orcamento */}
            <div>
              <Label htmlFor="orcamento">Orcamento (R$) *</Label>
              <Input
                id="orcamento"
                type="number"
                value={formData.orcamento}
                onChange={(e) => setFormData({ ...formData, orcamento: e.target.value })}
                placeholder="0,00"
                className={errors.orcamento ? "border-red-500" : ""}
              />
              {errors.orcamento && <p className="mt-1 text-xs text-red-500">{errors.orcamento}</p>}
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANEJAMENTO">Planejamento</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="PAUSADA">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descricao */}
            <div>
              <Label htmlFor="descricao">Descricao</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva os detalhes da obra..."
                rows={4}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3">
            <Link href="/obras">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit">
              <Building2 className="mr-2 h-4 w-4" />
              Criar Obra
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}