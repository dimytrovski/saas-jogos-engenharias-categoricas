"use client";

import React, { useMemo, useState } from "react";
import {
  CYCLE_MAX_CAPS,
  formatBRL,
  PRICING_TIERS,
  type BillingCycle,
  type PricingTier,
} from "@/data/pricingPlans";

export default function PricingEngagementSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("mensal");
  const [avoidedImpulseCount, setAvoidedImpulseCount] = useState<number>(2);
  const [avgImpulseBRL, setAvgImpulseBRL] = useState<number>(75);
  const [selectedTierName, setSelectedTierName] = useState<string>(
    "Pro Fluxo — Mensal (Preço Máximo: R$ 24,90)"
  );

  const activeCap = CYCLE_MAX_CAPS[billingCycle];

  const multiplierByCycle: Record<BillingCycle, number> = {
    mensal: 1,
    trimestral: 3,
    anual: 12,
  };

  const estimatedPeriodSaved = useMemo(() => {
    const count = Math.max(0, Math.min(20, avoidedImpulseCount || 0));
    const avg = Math.max(0, Math.min(2000, avgImpulseBRL || 0));
    const months = multiplierByCycle[billingCycle];
    return Math.round(count * avg * months);
  }, [avoidedImpulseCount, avgImpulseBRL, billingCycle]);

  const maxReferenceCost = activeCap.maxPriceBRL;
  const netGain = Math.round(estimatedPeriodSaved - maxReferenceCost);

  function handleSelectTier(tier: PricingTier) {
    const capValue = tier.maxPricesBRL[billingCycle];
    setSelectedTierName(
      `${tier.name} — ${activeCap.label}: ${formatBRL(capValue)}`
    );
    const hub = document.getElementById("central-decisao-inteligente");
    if (hub) {
      hub.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section
      id="planos-preco-justo"
      aria-label="Planos com preço máximo por ciclo mensal, trimestral e anual"
      className="w-full max-w-6xl mx-auto mt-10 rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-md text-left space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-700 text-white mb-1">
            Preço Máximo Garantido • Mensal, Trimestral e Anual
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Planos com Preço Máximo Definido por Período
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {activeCap.capNote}
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 border border-slate-300 self-start lg:self-auto gap-1">
          <button
            type="button"
            onClick={() => setBillingCycle("mensal")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              billingCycle === "mensal"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Mensal (Máx. R$ 24,90)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("trimestral")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              billingCycle === "trimestral"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Trimestral (Máx. R$ 64,90)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("anual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              billingCycle === "anual"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Anual (Máx. R$ 219)
          </button>
        </div>
      </div>

      {/* Cards de planos com preço máximo explícito */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRICING_TIERS.map((tier) => {
          const maxPrice = tier.maxPricesBRL[billingCycle];
          const periodSuffix =
            tier.id === "free"
              ? "para sempre"
              : billingCycle === "mensal"
              ? "máximo / mês"
              : billingCycle === "trimestral"
              ? "máximo / trimestre"
              : "máximo / ano";

          return (
            <div
              key={tier.id}
              className={`rounded-2xl border-2 p-5 flex flex-col justify-between space-y-4 ${
                tier.recommended
                  ? "border-blue-700 bg-blue-50/40 shadow-sm"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold text-slate-900">
                    {tier.name}
                  </span>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      tier.recommended
                        ? "bg-blue-700 text-white"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {tier.badge}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {tier.id === "free" ? "Sem custo" : "Preço máximo"}
                  </div>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-3xl font-black text-slate-950">
                      {formatBRL(maxPrice)}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {periodSuffix}
                    </span>
                  </div>
                  {tier.id !== "free" && (
                    <div className="text-[11px] font-bold text-emerald-800">
                      Teto equivalente: até{" "}
                      {formatBRL(activeCap.maxEquivalentPerMonthBRL)}/mês
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {tier.summary}
                </p>

                <ul className="space-y-1.5 text-xs text-slate-800 pt-1">
                  {tier.highlights.map((h) => (
                    <li key={h}>• {h}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200">
                <p className="text-[11px] font-semibold text-emerald-900 bg-emerald-100/80 rounded-lg p-2.5">
                  <strong>Por que vale a pena:</strong> {tier.whyBuyReason}
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectTier(tier)}
                  className={`w-full rounded-xl py-2.5 px-4 text-xs font-extrabold transition cursor-pointer ${
                    tier.recommended
                      ? "bg-blue-700 hover:bg-blue-600 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {tier.ctaLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo comparativo dos 3 tetos máximos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["mensal", "trimestral", "anual"] as BillingCycle[]).map((cyc) => {
          const info = CYCLE_MAX_CAPS[cyc];
          return (
            <div
              key={cyc}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1"
            >
              <div className="font-extrabold uppercase text-slate-700">
                {info.label}
              </div>
              <div className="text-lg font-black text-slate-950">
                Máx. {formatBRL(info.maxPriceBRL)}
              </div>
              <div className="text-[11px] text-slate-600">
                Até {formatBRL(info.maxEquivalentPerMonthBRL)}/mês no teto
              </div>
            </div>
          );
        })}
      </div>

      {/* Prova de valor comparando economia no ciclo vs preço máximo */}
      <div className="rounded-2xl bg-slate-950 text-white p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
            Prova de Valor • Ciclo {billingCycle.toUpperCase()}
          </div>
          <h3 className="text-lg font-extrabold">
            Comparação de Economia vs. Preço Máximo do Ciclo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label
                htmlFor="avoided-count"
                className="block text-xs font-bold text-slate-300 mb-1"
              >
                Escolhas/impulsos evitados por mês
              </label>
              <input
                id="avoided-count"
                type="number"
                min={0}
                max={20}
                value={avoidedImpulseCount}
                onChange={(e) => setAvoidedImpulseCount(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label
                htmlFor="avg-impulse"
                className="block text-xs font-bold text-slate-300 mb-1"
              >
                Valor médio por item/decisão (R$)
              </label>
              <input
                id="avg-impulse"
                type="number"
                min={0}
                max={2000}
                step={5}
                value={avgImpulseBRL}
                onChange={(e) => setAvgImpulseBRL(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
          <div className="text-xs text-slate-400">
            Economia estimada no ciclo ({billingCycle}):{" "}
            <strong className="text-emerald-400">
              {formatBRL(estimatedPeriodSaved)}
            </strong>
          </div>
          <div className="text-xs text-slate-400">
            Preço máximo do ciclo:{" "}
            <strong className="text-white">{formatBRL(maxReferenceCost)}</strong>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-bold uppercase text-sky-300">
              Vantagem estimada frente ao teto
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {netGain >= 0 ? `+${formatBRL(netGain)}` : formatBRL(netGain)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Seleção atual: <strong>{selectedTierName}</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}