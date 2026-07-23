export const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "orcamentos", label: "Orcamentos", href: "/orcamentos" },
  { id: "financeiro", label: "Financeiro", href: "/financeiro" },
  { id: "centro-custos", label: "Centro de Custos", href: "/centro-custos" },
  { id: "orcado-realizado", label: "Orcado x Realizado", href: "/orcado-realizado" },
  { id: "obras", label: "Obras", href: "/obras" },
  { id: "ordens-servico", label: "OS", href: "/ordens-servico" },
  { id: "colaboradores", label: "Colaboradores", href: "/colaboradores" },
  { id: "estoque", label: "Estoque", href: "/estoque" },
  { id: "veiculos", label: "Veiculos", href: "/veiculos" },
  { id: "clientes", label: "Clientes", href: "/clientes" },
  { id: "relatorios", label: "Relatorios", href: "/relatorios" },
  { id: "relatorios-pdf", label: "Relatorios PDF", href: "/relatorios-pdf" },
  { id: "cronograma", label: "Cronograma", href: "/cronograma" },
  { id: "diario-obra", label: "Diario de Obra", href: "/diario-obra" },
  { id: "galeria", label: "Galeria", href: "/galeria" },
  { id: "compras", label: "Compras", href: "/compras" },
  { id: "documentos", label: "Documentos", href: "/documentos" },
] as const;

export type ModuleId = (typeof ALL_MODULES)[number]["id"];
