"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Package,
  FileWarning,
  ClipboardList,
  DollarSign,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useLancamentos,
  useOrdensServico,
  useMateriaisEstoque,
  useVeiculos,
  useManutencoesVeiculo,
  useDocumentosVeiculo,
} from "@/hooks/use-storage-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "warning" | "info";

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  timestamp: string;
  severity: Severity;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "smart-obra-notifications-read";

function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 0) {
    const futureDays = Math.abs(diffDays);
    if (futureDays === 1) return "Amanhã";
    return `Em ${futureDays} dias`;
  }
  return `${diffDays} dias atrás`;
}

function isDatePast(dateStr: string): boolean {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date < new Date();
}

function isDateWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);
  return date >= now && date <= future;
}

const severityBorderClass: Record<Severity, string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-400",
  info: "border-l-blue-400",
};

const severityIconBg: Record<Severity, string> = {
  critical: "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-blue-100 text-blue-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Hydrate read state from localStorage on mount
  useEffect(() => {
    setReadIds(getReadIds());
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notifications-panel]")) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { lancamentos } = useLancamentos();
  const { ordens } = useOrdensServico();
  const { materiais } = useMateriaisEstoque();
  const { documentos } = useDocumentosVeiculo();

  // ── Build notification list ─────────────────────────────────────────────────
  const notifications = useMemo<Notification[]>(() => {
    const list: Notification[] = [];

    // 1. Contas vencidas (VENCIDO)
    (lancamentos ?? [])
      .filter((l) => l.status === "VENCIDO")
      .forEach((l) => {
        list.push({
          id: `lancamento-vencido-${l.data}-${l.descricao}`,
          icon: <DollarSign className="h-4 w-4" />,
          title: "Conta vencida",
          message: `"${l.descricao}" — R$ ${Number(l.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          timestamp: formatRelativeDate(l.data),
          severity: "critical",
        });
      });

    // 2. Contas vencendo em breve (PENDENTE, dentro de 3 dias)
    (lancamentos ?? [])
      .filter((l) => l.status === "PENDENTE" && isDateWithinDays(l.data, 3))
      .forEach((l) => {
        list.push({
          id: `lancamento-pendente-${l.data}-${l.descricao}`,
          icon: <DollarSign className="h-4 w-4" />,
          title: "Conta vencendo em breve",
          message: `"${l.descricao}" — R$ ${Number(l.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${formatRelativeDate(l.data)})`,
          timestamp: formatRelativeDate(l.data),
          severity: "warning",
        });
      });

    // 3. Estoque baixo
    (materiais ?? [])
      .filter((m) => Number(m.quantidade) <= Number(m.estoqueMinimo))
      .forEach((m) => {
        list.push({
          id: `estoque-baixo-${m.nome}`,
          icon: <Package className="h-4 w-4" />,
          title: "Estoque baixo",
          message: `${m.nome} — ${m.quantidade} unid. (mín. ${m.estoqueMinimo})`,
          timestamp: "Agora",
          severity: "warning",
        });
      });

    // 4. OS atrasadas
    (ordens ?? [])
      .filter(
        (o) =>
          o.status !== "FINALIZADA" &&
          o.status !== "CANCELADA" &&
          o.dataAgendada &&
          isDatePast(o.dataAgendada)
      )
      .forEach((o) => {
        list.push({
          id: `os-atrasada-${o.dataAgendada}-${o.status}`,
          icon: <ClipboardList className="h-4 w-4" />,
          title: "Ordem de serviço atrasada",
          message: `OS agendada para ${formatRelativeDate(o.dataAgendada!)} ainda não finalizada`,
          timestamp: formatRelativeDate(o.dataAgendada!),
          severity: "critical",
        });
      });

    // 5. Documentos vencendo (dentro de 30 dias ou já vencidos)
    (documentos ?? [])
      .filter((d) => d.validade && isDateWithinDays(d.validade, 30))
      .forEach((d) => {
        const isPast = isDatePast(d.validade);
        list.push({
          id: `documento-vencendo-${d.validade}-${d.veiculoId ?? ""}`,
          icon: <FileWarning className="h-4 w-4" />,
          title: isPast ? "Documento vencido" : "Documento vencendo",
          message: `Validade: ${formatRelativeDate(d.validade)}`,
          timestamp: formatRelativeDate(d.validade),
          severity: isPast ? "critical" : "warning",
        });
      });

    return list;
  }, [lancamentos, ordens, materiais, documentos]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  // ── Actions ─────────────────────────────────────────────────────────────────

  function markAsRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }

  function markAllAsRead() {
    const next = new Set(notifications.map((n) => n.id));
    saveReadIds(next);
    setReadIds(next);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative" data-notifications-panel>
      {/* Bell trigger button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] font-bold leading-none"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-border bg-background shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Notificações</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas como lidas
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Tudo em ordem!</p>
              <p className="text-xs text-muted-foreground">
                Nenhuma notificação no momento.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const isRead = readIds.has(notification.id);
                  return (
                    <div
                      key={notification.id}
                      className={[
                        "group relative flex cursor-pointer gap-3 border-l-4 px-4 py-3 transition-colors hover:bg-muted/50",
                        severityBorderClass[notification.severity],
                        isRead ? "opacity-60" : "bg-muted/20",
                      ].join(" ")}
                      onClick={() => markAsRead(notification.id)}
                    >
                      {/* Icon */}
                      <div
                        className={[
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          severityIconBg[notification.severity],
                        ].join(" ")}
                      >
                        {notification.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {notification.timestamp}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!isRead && (
                        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-blue-500" />
                      )}

                      {/* Mark as read on hover */}
                      {!isRead && (
                        <button
                          className="absolute bottom-2 right-3 hidden items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground group-hover:flex"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                          lida
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5 text-center">
              <p className="text-[11px] text-muted-foreground">
                {notifications.length} notificaç{notifications.length !== 1 ? "ões" : "ão"} gerada
                {notifications.length !== 1 ? "s" : ""} automaticamente
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
