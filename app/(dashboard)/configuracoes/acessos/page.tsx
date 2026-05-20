"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { AccessRequest } from "@/types";

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      const response = await fetch(`/api/admin/access-requests/${id}/approve`, {
        method: "PATCH",
      });
      if (response.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" as const } : r))
        );
      }
    } catch (error) {
      console.error("Erro ao aprovar:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/access-requests/${id}/reject`, {
        method: "PATCH",
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
                      <span>Empresa: {request.companyName}</span>
                      <span>CNPJ: {request.cnpj}</span>
                      <span>Tel: {request.phone}</span>
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
