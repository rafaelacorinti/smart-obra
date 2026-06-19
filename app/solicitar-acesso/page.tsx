"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const solicitacaoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email invalido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  telefone: z.string().min(10, "Telefone invalido"),
  empresa: z.string().min(2, "Empresa obrigatoria"),
  cargo: z.string().min(2, "Cargo obrigatorio"),
  mensagem: z.string().optional(),
});

type SolicitacaoForm = z.infer<typeof solicitacaoSchema>;


export default function SolicitarAcessoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SolicitacaoForm>({
    resolver: zodResolver(solicitacaoSchema),
  });

  const onSubmit = async (data: SolicitacaoForm) => {
    setLoading(true);

    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          senha: data.senha,
          telefone: data.telefone,
          empresa: data.empresa,
          cargo: data.cargo,
          mensagem: data.mensagem || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao enviar solicitacao");
      }

      setSubmitted(true);
    } catch {
      alert("Erro ao enviar solicitacao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="relative w-full max-w-md px-4">
          <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl dark:bg-gray-900/95 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Solicitacao Enviada!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Sua solicitacao de acesso foi recebida com sucesso. O administrador ira analisar
              e voce sera notificado sobre a decisao.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
      <div className="relative w-full max-w-lg px-4">
        <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl dark:bg-gray-900/95">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4">
              <Image
                src="/logo.svg"
                alt="Smart Obra"
                width={200}
                height={48}
                className="h-12 w-auto mx-auto"
                priority
              />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Solicitar Acesso
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Preencha os dados abaixo para solicitar acesso ao sistema
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome Completo *
              </label>
              <input
                type="text"
                {...register("nome")}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Seu nome completo"
              />
              {errors.nome && (
                <p className="mt-1 text-xs text-red-500">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email *
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha *
              </label>
              <input
                type="password"
                {...register("senha")}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Minimo 6 caracteres"
              />
              {errors.senha && (
                <p className="mt-1 text-xs text-red-500">{errors.senha.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone *
                </label>
                <input
                  type="tel"
                  {...register("telefone")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && (
                  <p className="mt-1 text-xs text-red-500">{errors.telefone.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Empresa *
                </label>
                <input
                  type="text"
                  {...register("empresa")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Nome da empresa"
                />
                {errors.empresa && (
                  <p className="mt-1 text-xs text-red-500">{errors.empresa.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cargo / Funcao *
              </label>
              <input
                type="text"
                {...register("cargo")}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Ex: Engenheiro Civil, Mestre de Obras"
              />
              {errors.cargo && (
                <p className="mt-1 text-xs text-red-500">{errors.cargo.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mensagem (opcional)
              </label>
              <textarea
                {...register("mensagem")}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
                placeholder="Explique brevemente por que precisa de acesso..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Solicitacao
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
