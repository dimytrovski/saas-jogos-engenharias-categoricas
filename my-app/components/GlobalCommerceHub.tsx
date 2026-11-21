"use client";

import React, { useState } from "react";
import {
  ENCAPSULATED_SETTLEMENT_PROFILE,
  GLOBAL_COMMERCE_SOLUTIONS,
} from "@/data/globalCommerceSolutions";

export default function GlobalCommerceHub() {
  const [filterType, setFilterType] = useState<string>("Todas");

  const types = [
    "Todas",
    "Gateway / Checkout Global",
    "Pix & Pagamento Instantâneo",
    "Boleto & Transferência",
    "Conversão FX & Liquidação BRL",
  ];

  const visibleSolutions =
    filterType === "Todas"
      ? GLOBAL_COMMERCE_SOLUTIONS
      : GLOBAL_COMMERCE_SOLUTIONS.filter((s) => s.providerType === filterType);

  return (
    <section
      id="solucoes-mercantes-globais"
      aria-label="10 soluções mercantis globais com encapsulamento seguro"
      className="w-full max-w-6xl mx-auto mt-10 rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-md text-left space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-900 text-white mb-1">
            Escala Global • BRL &amp; Encapsulamento Seguro
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            10 Soluções Mercantis para Pagamentos Globais e Liquidação em Reais
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Pix, cartões de crédito/débito, TED, boleto e conversão FX com dados
            bancários encapsulados fora da camada pública.
          </p>
        </div>

        <div className="rounded-xl bg-slate-950 text-white px-4 py-2.5 text-xs shrink-0">
          <div className="font-bold uppercase tracking-wider text-emerald-400">
            Destino Encapsulado
          </div>
          <div className="font-mono text-sm font-extrabold mt-0.5">
            {ENCAPSULATED_SETTLEMENT_PROFILE.vaultAlias}
          </div>
          <div className="text-[11px] text-slate-300">
            Moeda base: {ENCAPSULATED_SETTLEMENT_PROFILE.settlementCurrency} •
            Exposição direta no cliente: Não
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
              filterType === t
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleSolutions.map((sol) => (
          <article
            key={sol.id}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                {sol.id}. {sol.name}
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 shrink-0">
                {sol.providerType}
              </span>
            </div>

            <p className="text-xs text-slate-700">
              <strong>Alcance:</strong> {sol.globalReach}
            </p>
            <p className="text-xs text-slate-700">
              <strong>Métodos:</strong> {sol.paymentMethods.join(" • ")}
            </p>
            <p className="text-xs text-slate-700">
              <strong>Conversão / BRL:</strong> {sol.fxToBrlBehavior}
            </p>
            <p className="text-xs text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
              <strong>Encapsulamento e proteção:</strong>{" "}
              {sol.privacyEncapsulationStrategy}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-950 space-y-1">
        <div className="font-extrabold uppercase">
          Boas Práticas de Segurança para Não se Expor a Riscos
        </div>
        {ENCAPSULATED_SETTLEMENT_PROFILE.protectionNotes.map((note) => (
          <p key={note}>• {note}</p>
        ))}
      </div>
    </section>
  );
}