"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Building2,
  ClipboardList,
  DollarSign,
  Calculator,
  Users,
  Package,
} from "lucide-react";

interface FabAction {
  label: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const FAB_ACTIONS: FabAction[] = [
  { label: "Nova Obra", icon: <Building2 className="h-4 w-4" />, route: "/obras/nova", color: "bg-orange-500 hover:bg-orange-400" },
  { label: "Nova OS", icon: <ClipboardList className="h-4 w-4" />, route: "/ordens-servico", color: "bg-blue-500 hover:bg-blue-400" },
  { label: "Novo Lancamento", icon: <DollarSign className="h-4 w-4" />, route: "/financeiro", color: "bg-emerald-500 hover:bg-emerald-400" },
  { label: "Novo Orcamento", icon: <Calculator className="h-4 w-4" />, route: "/orcamentos/novo", color: "bg-cyan-500 hover:bg-cyan-400" },
  { label: "Novo Colaborador", icon: <Users className="h-4 w-4" />, route: "/colaboradores/novo", color: "bg-green-500 hover:bg-green-400" },
  { label: "Entrada Estoque", icon: <Package className="h-4 w-4" />, route: "/estoque", color: "bg-yellow-500 hover:bg-yellow-400" },
];

export function QuickActionsFab() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleAction(route: string) {
    setOpen(false);
    router.push(route);
  }

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col-reverse items-end gap-3">
      {open && (
        <>
          {FAB_ACTIONS.map((action, i) => (
            <div
              key={action.label}
              className="flex items-center gap-2"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 150ms ease ${i * 40}ms, transform 150ms ease ${i * 40}ms`,
              }}
            >
              <span className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-md border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={() => handleAction(action.route)}
                className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg transition-all duration-150 active:scale-95 ${action.color}`}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar acoes rapidas" : "Acoes rapidas"}
        className={`w-12 h-12 rounded-full bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${open ? "rotate-45" : "rotate-0"}`}
      >
        {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  );
}
