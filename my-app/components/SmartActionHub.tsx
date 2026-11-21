"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PLATFORM_CATEGORIES } from "@/data/games";
import type { PlatformName } from "@/data/heroBackgrounds";
import {
  evaluateSmartDecision,
  PRODUCTIVITY_QUICK_TARGETS,
  type IntentUrgency,
} from "@/data/smartDecisionEngine";

const TELEMETRY_STORAGE_KEY = "microsaas_action_telemetry_v1";

interface ActionTelemetry {
  briefsCopied: number;
  productivityDispatches: number;
  lastActionLabel: string;
}

const DEFAULT_TELEMETRY: ActionTelemetry = {
  briefsCopied: 0,
  productivityDispatches: 0,
  lastActionLabel: "Nenhuma ação registrada ainda",
};

export default function SmartActionHub() {
  const [platform, setPlatform] = useState<PlatformName>("Xbox");
  const [itemTitle, setItemTitle] = useState<string>("Pacote / Jogo Selecionado");
  const [urgency, setUrgency] = useState<IntentUrgency>("Planejada");
  const [budgetBRL, setBudgetBRL] = useState<number>(150);
  const [hasCompatibilityChecked, setHasCompatibilityChecked] =
    useState<boolean>(true);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<ActionTelemetry>(DEFAULT_TELEMETRY);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ActionTelemetry>;
        setTelemetry({
          briefsCopied: Number(parsed.briefsCopied ?? 0),
          productivityDispatches: Number(parsed.productivityDispatches ?? 0),
          lastActionLabel:
            typeof parsed.lastActionLabel === "string"
              ? parsed.lastActionLabel
              : DEFAULT_TELEMETRY.lastActionLabel,
        });
      }
    } catch {
      // Ignora erro de acesso ao localStorage
    }
  }, []);

  function saveTelemetry(next: ActionTelemetry) {
    setTelemetry(next);
    try {
      window.localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignora erro de escrita no localStorage
    }
  }

  const decision = useMemo(
    () =>
      evaluateSmartDecision({
        platform,
        itemTitle: itemTitle.trim() || "Item sem título",
        urgency,
        budgetBRL: Number.isFinite(budgetBRL) ? Math.max(0, budgetBRL) : 0,
        hasCompatibilityChecked,
      }),
    [platform, itemTitle, urgency, budgetBRL, hasCompatibilityChecked]
  );

  async function handleCopyBrief() {
    try {
      await navigator.clipboard.writeText(decision.productivityBrief);
      setCopiedBrief(true);
      saveTelemetry({
        ...telemetry,
        briefsCopied: telemetry.briefsCopied + 1,
        lastActionLabel: `Briefing copiado (${platform})`,
      });
      window.setTimeout(() => setCopiedBrief(false), 2000);
    } catch {
      setCopiedBrief(false);
    }
  }

  function handleProductivityDispatch(toolName: string, url: string) {
    saveTelemetry({
      ...telemetry,
      productivityDispatches: telemetry.productivityDispatches + 1,
      lastActionLabel: `Encaminhado para ${toolName} (${platform})`,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section
      aria-label="Motor de decisão inteligente e encaminhamento de produtividade"
      className="w-full max-w-6xl mx-auto mt-10 rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-md text-left space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-900 text-white mb-1">
            Diferencial MicroSaaS • Decisão + Fluxo
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Central de Decisão Inteligente &amp; Encaminhamento
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Calcule a viabilidade de compra/ação por plataforma e gere um
            briefing pronto para sua ferramenta de produtividade.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-lg bg-slate-100 px-3 py-2 border border-slate-200">
            <span className="font-bold text-slate-900">
              {telemetry.briefsCopied}
            </span>{" "}
            <span className="text-slate-600">briefings copiados</span>
          </div>
          <div className="rounded-lg bg-indigo-50 px-3 py-2 border border-indigo-200">
            <span className="font-bold text-indigo-900">
              {telemetry.productivityDispatches}
            </span>{" "}
            <span className="text-indigo-700">envios à produtividade</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parâmetros de decisão */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Plataforma
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_CATEGORIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    platform === p
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="smart-item-title"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Jogo / Oferta / Projeto
              </label>
              <input
                id="smart-item-title"
                type="text"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="smart-budget"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Orçamento disponível (R$)
              </label>
              <input
                id="smart-budget"
                type="number"
                min={0}
                step={10}
                value={budgetBRL}
                onChange={(e) => setBudgetBRL(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label
                htmlFor="smart-urgency"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Tipo de intenção
              </label>
              <select
                id="smart-urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as IntentUrgency)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="Imediata">Imediata</option>
                <option value="Planejada">Planejada</option>
                <option value="Apenas salvando">Apenas salvando</option>
              </select>
            </div>

            <label className="flex items-center gap-2 pt-5 text-xs font-semibold text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCompatibilityChecked}
                onChange={(e) => setHasCompatibilityChecked(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Compatibilidade e edição conferidas
            </label>
          </div>
        </div>

        {/* Resultado e encaminhamento */}
        <div className="lg:col-span-6 rounded-xl bg-slate-950 text-white p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Score Inteligente: {decision.score}/100
              </span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white/15 text-white">
                {decision.verdict}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {decision.rationale}
            </p>

            <pre className="mt-2 rounded-lg bg-slate-900 border border-slate-800 p-3 text-[11px] text-slate-200 whitespace-pre-wrap font-mono">
              {decision.productivityBrief}
            </pre>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyBrief}
                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-2 text-xs transition cursor-pointer"
              >
                {copiedBrief ? "Briefing copiado!" : "Copiar briefing estruturado"}
              </button>
              <span className="text-[11px] text-slate-400">
                Última ação: {telemetry.lastActionLabel}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                Encaminhar direto para produtividade
              </span>
              <div className="flex flex-wrap gap-2">
                {PRODUCTIVITY_QUICK_TARGETS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => handleProductivityDispatch(tool.name, tool.url)}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 text-xs transition cursor-pointer"
                  >
                    {tool.name} ↗
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}