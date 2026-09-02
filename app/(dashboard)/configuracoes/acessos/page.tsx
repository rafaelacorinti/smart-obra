"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, Loader2, Copy, CheckCircle2, Shield, Ban, Unlock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { AccessRequest } from "@/types";

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ id: string; password: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/access-requests");
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Erro ao carregar solicitacoes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/access-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "aprovado" }),
      });
      if (response.ok) {
        const data = await response.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" as const } : r))
        );
        if (data.senhaTemporaria) {
          const req = requests.find((r) => r.id === id);
          setTempPassword({
            id,
            password: data.senhaTemporaria,
            email: req?.email || data.email || "",
          });
          setCopied(false);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao aprovar solicitacao");
      }
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Erro ao aprovar solicitacao");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/access-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejeitado" }),
      });
      if (response.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" as const } : r))
        );
      }
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/access-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "bloqueado" }),
      });
      if (response.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" as const } : r))
        );
      }
    } catch (error) {
      console.error("Erro ao bloquear:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/access-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "desbloqueado" }),
      });
      if (response.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" as const } : r))
        );
      }
    } catch (error) {
      console.error("Erro ao desbloquear:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const copyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const processedRequests = requests.filter((r) => r.status !== "PENDING");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Solicitacoes de Acesso"
        breadcrumbs={[
          { label: "Configuracoes", href: "/configuracoes" },
          { label: "Acessos" },
        ]}
      />

      {/* Temp password dialog */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Usuario Aprovado!</h3>
                <p className="text-sm text-muted-foreground">Acesso criado com sucesso</p>
              </div>
            </div>

            <div className="mb-4 rounded-lg border bg-muted/50 p-4">
              <p className="mb-1 text-sm font-medium text-muted-foreground">Email</p>
              <p className="mb-3 font-medium">{tempPassword.email}</p>
              <p className="mb-1 text-sm font-medium text-muted-foreground">Senha temporaria</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-background px-3 py-2 text-lg font-bold tracking-wider">
                  {tempPassword.password}
                </code>
                <button
                  onClick={copyPassword}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              Envie essas credenciais ao usuario. Recomende que ele altere a senha apos o primeiro acesso.
            </p>

            <button
              onClick={() => setTempPassword(null)}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pendentes ({pendingRequests.length})
          </h2>
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{request.name}</h3>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {request.companyName && <span>Empresa: {request.companyName}</span>}
                      {request.phone && <span>Tel: {request.phone}</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Solicitado em: {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingRequests.length === 0 && (
        <div className="mb-8 rounded-xl border bg-card p-8 text-center shadow-sm">
          <Check className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-2 text-lg font-medium">Nenhuma solicitacao pendente</p>
          <p className="text-sm text-muted-foreground">
            Todas as solicitacoes foram processadas
          </p>
        </div>
      )}

      {processedRequests.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Historico</h2>
          <div className="grid gap-3">
            {processedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div>
                  <p className="font-medium">{request.name}</p>
                  <p className="text-sm text-muted-foreground">{request.email} - {request.companyName}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    request.status === "APPROVED"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {request.status === "APPROVED" ? "Aprovado" : "Rejeitado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}