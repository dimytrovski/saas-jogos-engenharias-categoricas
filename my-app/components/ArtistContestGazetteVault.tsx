"use client";

import React, { useState } from "react";
import CerroNavigationHub from "./CerroNavigationHub";

interface CostBenefitItem {
  criterion: string;
  weightPct: number;
  targetMetric: string;
}

interface ProducerBriefItem {
  producerAlias: string;
  disciplineFocus: string;
  scoreComputed: number;
  status: string;
  dispatchNote: string;
}

interface GazetteIssuePayload {
  issueCode: string;
  editionTitle: string;
  headline: string;
  aiConcreteVerdict: string;
  prizePoolBrl: number;
  licenseRuleSummary: string;
  costBenefitMatrix: CostBenefitItem[];
  producerBriefs: ProducerBriefItem[];
}

export default function ArtistContestGazetteVault() {
  const [participantCode, setParticipantCode] = useState("CERRO-ART-2026");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [gazetteReleased, setGazetteReleased] = useState(false);
  const [issue, setIssue] = useState<GazetteIssuePayload | null>(null);
  const [releaseCount, setReleaseCount] = useState(0);

  const requestGazette = async (action: "authenticate" | "release_ai_gazette") => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/artist-gazette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantCode, action })
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setAuthorized(false);
        setGazetteReleased(false);
        setIssue(null);
        setErrorMsg(data.message || "Acesso negado.");
        return;
      }
      setAuthorized(true);
      setGazetteReleased(Boolean(data.gazetteReleased));
      setIssue(data.issue ?? null);
      setReleaseCount((c) => c + 1);
    } catch {
      setErrorMsg("Falha ao comunicar com o cofre do concurso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-stone-100">
      <header className="border-b border-amber-500/30 bg-[#0e1420]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
              COFRE EXCLUSIVO DE PARTICIPANTES · IA CONCRETA
            </span>
            <h1 className="mt-1 font-serif text-xl font-bold text-stone-50">
              Sala Reservada do Concurso &amp; Jornais Virtualizados
            </h1>
          </div>
          <a
            href="/deque-engenharias"
            className="rounded-lg border border-stone-700 bg-stone-900 px-3.5 py-2 font-mono text-xs text-stone-300 hover:border-amber-400/60"
          >
            &larr; Voltar ao Deque Principal
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-7">
        <CerroNavigationHub
          initialCharge={75}
          initialModuleCode="CONC-01"
          initialDiscipline="Engenharia Eletrica & Energia"
          initialDeliveryMode="hibrido"
        />

        <section className="rounded-2xl border border-amber-500/30 bg-[#121927] p-5">
          <div className="grid gap-4 lg:grid-cols-3 lg:items-center">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-lg font-bold text-stone-100">
                Acesso Restrito aos Participantes Habilitados
              </h2>
              <p className="mt-1 text-xs text-stone-400">
                Chave de teste: <code className="text-amber-300">CERRO-ART-2026</code> · <code className="text-amber-300">PARTICIPANTE-3F</code> · <code className="text-amber-300">LEGADO-PRODUCER</code>
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestGazette("authenticate");
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="text"
                value={participantCode}
                onChange={(e) => setParticipantCode(e.target.value)}
                className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 font-mono text-xs text-stone-100"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-amber-400 px-4 py-2 font-mono text-xs font-bold text-stone-950 hover:bg-amber-300 disabled:opacity-50"
              >
                {loading ? "Validando..." : "Entrar & Solicitar Jornal"}
              </button>
            </form>
          </div>
          {errorMsg && (
            <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-2 font-mono text-xs text-rose-200">
              {errorMsg}
            </div>
          )}
        </section>

        {authorized && gazetteReleased && issue && (
          <article className="cerro-gazette-sheet rounded-2xl border-2 border-amber-400/50">
            <div className="cerro-gazette-rule px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] font-bold uppercase text-stone-700">
                <span>{issue.issueCode} · PARTICIPANTE: {participantCode.toUpperCase()}</span>
                <span>LIBERACOES: {releaseCount}</span>
                <button
                  type="button"
                  onClick={() => requestGazette("release_ai_gazette")}
                  className="rounded bg-stone-900 px-2.5 py-1 text-[10px] text-amber-300"
                >
                  Re-liberar Jornal pela IA Concreta
                </button>
              </div>
              <h2 className="mt-2 text-center font-serif text-2xl font-black">
                {issue.editionTitle}
              </h2>
              <p className="mt-1 text-center font-serif text-sm italic text-stone-800">
                {issue.headline}
              </p>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-5">
                <div className="rounded-xl border border-stone-900/20 bg-amber-100/80 p-4">
                  <div className="font-mono text-[10px] font-extrabold uppercase text-amber-900">
                    PARECER DA IA CONCRETA
                  </div>
                  <p className="mt-1 font-serif text-sm text-stone-900">
                    {issue.aiConcreteVerdict}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-900 bg-stone-900 p-4 text-amber-300">
                  <div className="font-mono text-[10px] uppercase text-stone-400">
                    PREMIO FIXO DA RODADA
                  </div>
                  <div className="mt-1 font-mono text-xl font-black">
                    R$ {issue.prizePoolBrl.toLocaleString("pt-BR")}
                  </div>
                </div>
                <p className="rounded-xl border border-stone-300 bg-white/80 p-3.5 text-xs text-stone-800">
                  {issue.licenseRuleSummary}
                </p>
              </div>

              <div className="space-y-3 lg:col-span-4">
                <div className="font-mono text-xs font-extrabold uppercase text-stone-900">
                  GRADE DE CUSTO-BENEFICIO
                </div>
                {issue.costBenefitMatrix.map((row) => (
                  <div
                    key={row.criterion}
                    className="rounded-xl border border-stone-300 bg-white p-3"
                  >
                    <div className="flex justify-between gap-2 text-xs font-bold">
                      <span>{row.criterion}</span>
                      <span className="font-mono text-amber-700">{row.weightPct}%</span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-stone-600">
                      {row.targetMetric}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 lg:col-span-3">
                <div className="font-mono text-xs font-extrabold uppercase text-stone-900">
                  CADERNO DOS PRODUTORES
                </div>
                {issue.producerBriefs.map((prod) => (
                  <div
                    key={prod.producerAlias}
                    className="rounded-xl border border-stone-900/20 bg-white p-3.5"
                  >
                    <div className="flex justify-between font-mono text-[10px] font-bold">
                      <span className="text-emerald-800">{prod.status}</span>
                      <span>{prod.scoreComputed} pts</span>
                    </div>
                    <div className="mt-1 font-serif text-sm font-bold">
                      {prod.producerAlias}
                    </div>
                    <p className="mt-1 text-[11px] text-stone-700">
                      {prod.dispatchNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
