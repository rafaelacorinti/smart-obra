"use client";

import { useEffect, useState, useMemo } from "react";
import { Bell, CheckCheck, Package, Wrench, ClipboardList, DollarSign, UserPlus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export type NotificationType = "estoque_baixo" | "manutencao_vencida" | "os_atrasada" | "pagamento_pendente" | "acesso" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS_KEY = "smart-obra-notifications";
const NOTIFICATION_PREFS_KEY = "smart-obra-notification-prefs";

interface NotificationPrefs {
  estoqueBaixo: boolean;
  manutencaoVencida: boolean;
  osAtrasada: boolean;
  pagamentoPendente: boolean;
  documentoVencendo: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  estoqueBaixo: true,
  manutencaoVencida: true,
  osAtrasada: true,
  pagamentoPendente: true,
  documentoVencendo: true,
};

function loadNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotifications(notifs: Notification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
}

function loadPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch { return DEFAULT_PREFS; }
}

function generateAutoNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  const prefs = loadPrefs();
  const newNotifs: Notification[] = [];
  const now = new Date().toISOString();

  // Check estoque baixo
  if (prefs.estoqueBaixo) {
    try {
      const raw = localStorage.getItem("smart-obra-materiais-estoque");
      if (raw) {
        const materiais = JSON.parse(raw) as { id: string; nome: string; quantidade: number; estoqueMinimo: number }[];
        const abaixo = materiais.filter(m => m.quantidade <= m.estoqueMinimo);
        abaixo.forEach(m => {
          newNotifs.push({
            id: `notif-est-${m.id}`,
            type: "estoque_baixo",
            title: "Estoque baixo",
            description: `${m.nome} esta abaixo do minimo (${m.quantidade}/${m.estoqueMinimo})`,
            timestamp: now,
            read: false,
          });
        });
      }
    } catch {}
  }

  // Check manutencao vencida
  if (prefs.manutencaoVencida) {
    try {
      const rawV = localStorage.getItem("smart-obra-veiculos");
      const rawM = localStorage.getItem("smart-obra-manutencoes-veiculo");
      if (rawV && rawM) {
        const veiculos = JSON.parse(rawV) as { id: string; nome: string; kmAtual: number }[];
        const manutencoes = JSON.parse(rawM) as { veiculoId: string; proximaKm?: number }[];
        veiculos.forEach(v => {
          const vencida = manutencoes.some(m => m.veiculoId === v.id && m.proximaKm != null && v.kmAtual > (m.proximaKm ?? Infinity));
          if (vencida) {
            newNotifs.push({
              id: `notif-man-${v.id}`,
              type: "manutencao_vencida",
              title: "Manutencao vencida",
              description: `Veiculo ${v.nome} ultrapassou o km de manutencao programada`,
              timestamp: now,
              read: false,
            });
          }
        });
      }
    } catch {}
  }

  // Check lancamentos vencidos
  if (prefs.pagamentoPendente) {
    try {
      const raw = localStorage.getItem("smart-obra-lancamentos");
      if (raw) {
        const lancamentos = JSON.parse(raw) as { id: string; descricao: string; status: string; tipo: string }[];
        const vencidos = lancamentos.filter(l => l.status === "VENCIDO" && l.tipo === "DESPESA");
        if (vencidos.length > 0) {
          newNotifs.push({
            id: `notif-pag-vencidos`,
            type: "pagamento_pendente",
            title: "Pagamento(s) vencido(s)",
            description: `${vencidos.length} conta(s) vencida(s) pendente(s) de pagamento`,
            timestamp: now,
            read: false,
          });
        }
      }
    } catch {}
  }

  // Check OS atrasadas
  if (prefs.osAtrasada) {
    try {
      const raw = localStorage.getItem("smart-obra-ordens-servico");
      if (raw) {
        const ordens = JSON.parse(raw) as { id: string; titulo: string; status: string }[];
        const atrasadas = ordens.filter(o => o.status === "AGUARDANDO_MATERIAL");
        if (atrasadas.length > 0) {
          newNotifs.push({
            id: `notif-os-atrasadas`,
            type: "os_atrasada",
            title: "OS aguardando material",
            description: `${atrasadas.length} ordem(ns) de servico aguardando material`,
            timestamp: now,
            read: false,
          });
        }
      }
    } catch {}
  }

  return newNotifs;
}

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  estoque_baixo: { icon: Package, color: "text-red-600", bg: "bg-red-100 dark:bg-red-950/50" },
  manutencao_vencida: { icon: Wrench, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/50" },
  os_atrasada: { icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950/50" },
  pagamento_pendente: { icon: DollarSign, color: "text-red-600", bg: "bg-red-100 dark:bg-red-950/50" },
  acesso: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/50" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/50" },
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!open) return;
    // Load saved + auto-generate
    const saved = loadNotifications();
    const auto = generateAutoNotifications();
    // Merge: keep saved read states, add new auto ones
    const existingIds = new Set(saved.map(n => n.id));
    const merged = [...saved];
    auto.forEach(n => {
      if (!existingIds.has(n.id)) {
        merged.push(n);
      }
    });
    // Remove auto notifications that no longer apply
    const autoIds = new Set(auto.map(n => n.id));
    const filtered = merged.filter(n => {
      // Keep manual/non-auto or still relevant auto notifications
      if (n.id.startsWith("notif-")) return autoIds.has(n.id) || n.read;
      return true;
    });
    setNotifications(filtered);
    saveNotifications(filtered);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  function markAllRead() {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  }

  function markRead(id: string) {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveNotifications(updated);
  }

  function clearAll() {
    setNotifications([]);
    saveNotifications([]);
  }

  if (!open) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] overflow-hidden rounded-xl border bg-card shadow-xl z-50 animate-in fade-in-50 slide-in-from-top-2">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Notificacoes</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs gap-1">
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar lidas
          </Button>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto divide-y">
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma notificacao</p>
          </div>
        )}
        {notifications.map((notif) => {
          const config = typeConfig[notif.type];
          const Icon = config.icon;
          return (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/50 ${!notif.read ? "bg-primary/5" : ""}`}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${!notif.read ? "font-semibold" : "font-medium"}`}>{notif.title}</p>
                  {!notif.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.description}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo(notif.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {notifications.length > 0 && (
        <div className="border-t px-4 py-2">
          <Button variant="ghost" size="sm" onClick={clearAll} className="w-full h-8 text-xs text-muted-foreground">
            Limpar todas
          </Button>
        </div>
      )}
    </div>
  );
}

export function useNotificationCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    function check() {
      const saved = loadNotifications();
      const auto = generateAutoNotifications();
      const existingIds = new Set(saved.map(n => n.id));
      const merged = [...saved];
      auto.forEach(n => { if (!existingIds.has(n.id)) merged.push(n); });
      setCount(merged.filter(n => !n.read).length);
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);
  return count;
}