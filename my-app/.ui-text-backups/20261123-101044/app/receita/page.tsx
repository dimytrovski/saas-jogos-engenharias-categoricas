import React from "react";
import Link from "next/link";
import AppNavMenu from "@/components/AppNavMenu";

export default function ReceitaAoVivoPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNavMenu />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Receita &amp; Conversao ao Vivo
            </h1>
            
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/demonstracao"
              className="rounded-md bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:text-zinc-950"
            >
              Emitir passe PPV
            </Link>
            <Link
              href="/pagamentos"
              className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Ver webhooks
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Receita Aprovada (Sessao)
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">R$ 0,00</div>
            <div className="mt-1 text-xs text-zinc-500">Pronto para conectar ao banco</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Passes Ativos
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">0</div>
            <div className="mt-1 text-xs text-zinc-500">Ativacao via payment.approved</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Taxa de Conversao
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">0,0%</div>
            <div className="mt-1 text-xs text-zinc-500">Checkout -&gt; Passe ativo</div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Integridade de Webhooks
            </div>
            <div className="mt-2 text-2xl font-semibold text-teal-600 dark:text-teal-400">
              HMAC + ID
            </div>
            <div className="mt-1 text-xs text-zinc-500">Idempotencia por eventId ativa</div>
          </div>
        </section>
      </main>
    </div>
  );
}

