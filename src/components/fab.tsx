"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Building2, DollarSign, Users, Calculator, ClipboardList, X } from "lucide-react";

interface FabAction {
  label: string;
  icon: React.ElementType;
  color: string;
  href: string;
}

const actions: FabAction[] = [
  { label: "Nova Obra", icon: Building2, color: "bg-orange-500 hover:bg-orange-600", href: "/obras?new=1" },
  { label: "Nova Despesa", icon: DollarSign, color: "bg-red-500 hover:bg-red-600", href: "/despesas?new=1" },
  { label: "Novo Cliente", icon: Users, color: "bg-blue-500 hover:bg-blue-600", href: "/clientes?new=1" },
  { label: "Novo Orçamento", icon: Calculator, color: "bg-green-500 hover:bg-green-600", href: "/orcamentos?new=1" },
  { label: "Nova OS", icon: ClipboardList, color: "bg-teal-500 hover:bg-teal-600", href: "/os?new=1" },
];

export function Fab() {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  const handleAction = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu de ações rápidas"}
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                onClick={() => handleAction(action.href)}
                className="z-50 flex items-center gap-3 group"
              >
                <span className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                  {action.label}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg ${action.color} transition-colors`}>
                  <action.icon className="h-5 w-5" />
                </div>
              </motion.button>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
