import { ShieldX } from "lucide-react";

export function AccessDenied({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
        <ShieldX className="h-10 w-10 text-red-500 dark:text-red-400" />
      </div>
      <h2 className="text-xl font-semibold">Acesso Restrito</h2>
      <p className="text-muted-foreground mt-2 text-center max-w-md">
        Voce nao tem permissao para acessar o modulo &ldquo;{moduleName}&rdquo;.
        Entre em contato com o administrador para solicitar acesso.
      </p>
    </div>
  );
}
