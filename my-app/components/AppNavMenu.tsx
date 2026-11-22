"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavOption {
  label: string;
  href: string;
  hint: string;
}

const FIVE_OPTIONS: NavOption[] = [
  {
    label: "Receita & Conversao ao Vivo",
    href: "/receita",
    hint: "Faturamento em tempo real, passes pagos e conversao"
  },
  {
    label: "Estudio de Passes & Licencas",
    href: "/demonstracao",
    hint: "Criacao de passes PPV, validade e tokens de acesso"
  },
  {
    label: "Radar de Transmissao & Sessoes",
    href: "/sessoes",
    hint: "Capacidade ativa, sessoes concorrentes e estabilidade"
  },
  {
    label: "Central de Pagamentos & Webhooks",
    href: "/pagamentos",
    hint: "Preferencias Mercado Pago, eventId e assinatura HMAC"
  },
  {
    label: "Cofre de Auditoria & Seguranca",
    href: "/auditoria",
    hint: "Trilha de eventos, ativacoes e prontidao de ambiente"
  }
];

export default function AppNavMenu() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [envMode, setEnvMode] = useState<"teste" | "producao">("teste");

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 text-zinc-900 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link href="/receita" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600 dark:bg-teal-400" />
            <span className="text-sm font-semibold tracking-tight">ScaleStream</span>
          </Link>

          <div
            role="group"
            aria-label="Ambiente"
            className="hidden sm:inline-flex rounded-md border border-zinc-200 bg-zinc-100 p-0.5 text-xs dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button
              type="button"
              onClick={() => setEnvMode("teste")}
              className={`rounded px-2 py-0.5 transition ${
                envMode === "teste"
                  ? "bg-white text-zinc-900 font-medium shadow-2xs dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }`}
            >
              Teste
            </button>
            <button
              type="button"
              onClick={() => setEnvMode("producao")}
              className={`rounded px-2 py-0.5 transition ${
                envMode === "producao"
                  ? "bg-white text-zinc-900 font-medium shadow-2xs dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              }`}
            >
              Producao
            </button>
          </div>
        </div>

        <nav aria-label="Navegacao principal" className="hidden xl:flex items-center gap-1">
          {FIVE_OPTIONS.map((opt) => {
            const active = pathname === opt.href;
            return (
              <Link
                key={opt.href}
                href={opt.href}
                title={opt.hint}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/demonstracao"
            className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
          >
            + Novo Passe
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            className="xl:hidden rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium dark:border-zinc-800"
          >
            {mobileOpen ? "Fechar" : "Modulos"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 xl:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-1.5">
            {FIVE_OPTIONS.map((opt) => {
              const active = pathname === opt.href;
              return (
                <Link
                  key={opt.href}
                  href={opt.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 transition ${
                    active
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs opacity-75">{opt.hint}</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
