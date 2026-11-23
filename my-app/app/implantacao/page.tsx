"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowUpRight, Briefcase, HeartHandshake, Radio, ShieldCheck } from "lucide-react";
import {
  formatCurrencyBrl,
  getRevenueTargetBrl,
  getTarget30kScenarios
} from "@/lib/synstrom-target-30k";

interface DeploymentTier {
  id: string;
  code: string;
  pillar: "security" | "performance" | "interaction";
  targetRoute: string;
  amountBrl: number;
  readiness: number;
  icon: React.ComponentType<{ className?: string }>;
}

const DEPLOYMENT_TIERS: DeploymentTier[] = [
  {
    id: "impl-security-tokens",
    code: "IMPL-SEC",
    pillar: "security",
    targetRoute: "/deque-engenharias",
    amountBrl: 10000,
    readiness: 92,
    icon: ShieldCheck
  },
  {
    id: "impl-live-streams",
    code: "IMPL-LIVE",
    pillar: "performance",
    targetRoute: "/lives",
    amountBrl: 10000,
    readiness: 88,
    icon: Radio
  },
  {
    id: "impl-community-shield",
    code: "IMPL-MIND",
    pillar: "interaction",
    targetRoute: "/psicologia-ia",
    amountBrl: 10000,
    readiness: 85,
    icon: HeartHandshake
  }
];

export default function ImplementationPortal() {
  const [selectedId, setSelectedId] = useState<string>("impl-security-tokens");
  const [scenarioIdx, setScenarioIdx] = useState<number>(0);

  const current = DEPLOYMENT_TIERS.find((t) => t.id === selectedId) || DEPLOYMENT_TIERS[0];
  const scenarios = getTarget30kScenarios(25);
  const activeScenario = scenarios[scenarioIdx] || scenarios[0];
  const targetAmount = getRevenueTargetBrl();

  return (
    <main
      data-portal="synstrom-implantacao"
      data-brand="SynStrom"
      data-deployment-code={current.code}
      data-deployment-pillar={current.pillar}
      data-deployment-amount-brl={String(current.amountBrl)}
      data-revenue-target-brl={String(targetAmount)}
      data-target-route={current.targetRoute}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#040811] px-4 py-10 text-slate-100"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 15%, rgba(20, 184, 166, 0.18) 0%, rgba(15, 36, 68, 0.45) 42%, rgba(4, 8, 17, 1) 78%)"
      }}
    >
      <section
        className="relative z-10 w-full max-w-3xl rounded-3xl border border-teal-400/25 bg-slate-950/75 p-6 shadow-2xl"
        style={{
          backdropFilter: "blur(14px) saturate(130%)",
          WebkitBackdropFilter: "blur(14px) saturate(130%)"
        }}
      >
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <a
              href="/"
              aria-label="back-root"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition-colors hover:border-teal-400/50 hover:text-teal-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Briefcase className="h-4 w-4 text-teal-400" />
            <span className="font-mono text-xs font-semibold tracking-[0.24em] text-slate-200">
              SYNSTROM // IMPLANTACAO
            </span>
          </div>

          <span className="font-mono text-xs font-semibold text-teal-300">
            {formatCurrencyBrl(targetAmount)}
          </span>
        </header>

        <nav aria-label="deployment-packages" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DEPLOYMENT_TIERS.map((tier) => {
            const Icon = tier.icon;
            const isSelected = tier.id === selectedId;

            return (
              <button
                key={tier.id}
                type="button"
                aria-label={tier.code}
                data-code={tier.code}
                data-pillar={tier.pillar}
                data-amount-brl={String(tier.amountBrl)}
                data-route={tier.targetRoute}
                onClick={() => setSelectedId(tier.id)}
                onFocus={() => setSelectedId(tier.id)}
                className={`group flex h-32 flex-col items-center justify-between rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 ${
                  isSelected
                    ? "border-teal-400 bg-teal-500/15 text-teal-200 ring-2 ring-teal-400/50"
                    : "border-slate-800/90 bg-slate-900/60 text-slate-300 hover:border-teal-400/40"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest opacity-85">
                    {tier.code}
                  </span>
                  <span className="font-mono text-[11px] font-semibold">
                    {formatCurrencyBrl(tier.amountBrl)}
                  </span>
                </div>

                <Icon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950/90">
                  <div
                    className="h-full bg-teal-400/85 transition-all duration-300"
                    style={{ width: `${tier.readiness}%` }}
                  />
                </div>
              </button>
            );
          })}
        </nav>

        <div aria-label="target-30k-scenarios" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {scenarios.map((sc, idx) => {
            const active = idx === scenarioIdx;
            return (
              <button
                key={sc.id}
                type="button"
                aria-label={sc.label}
                onClick={() => setScenarioIdx(idx)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 font-mono text-[11px] transition-colors ${
                  active
                    ? "border-teal-400 bg-teal-500/15 text-teal-200"
                    : "border-slate-800/80 bg-slate-900/50 text-slate-400 hover:border-teal-400/40"
                }`}
              >
                <span>{sc.label}</span>
                <span>{sc.formattedTotalBrl}</span>
              </button>
            );
          })}
        </div>

        <footer className="mt-6 flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/65 px-4 py-3">
          <span className="font-mono text-xs text-slate-400">
            {current.code} · {activeScenario.label} · {activeScenario.formattedTotalBrl}
          </span>
          <a
            href={current.targetRoute}
            aria-label="open-deployment-module"
            data-target-route={current.targetRoute}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal-400 px-4 font-mono text-xs font-semibold text-slate-950 transition-transform hover:scale-105"
          >
            <span>{current.code}</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </footer>
      </section>
    </main>
  );
}