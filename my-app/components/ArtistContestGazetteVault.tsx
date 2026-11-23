"use client";

import React, { useState } from "react";
import type { VirtualGazetteIssue } from "@/app/api/artist-gazette/route";

export default function ArtistContestGazetteVault() {
  const [participantCode, setParticipantCode] = useState("CERRO-ART-2026");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [gazetteReleased, setGazetteReleased] = useState(false);
  const [issue, setIssue] = useState<VirtualGazetteIssue | null>(null);
  const [releaseCount, setReleaseCount] = useState(0);

  const handleEnterContest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/artist-gazette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantCode,
          action: "authenticate"
        })
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
      setErrorMsg("Falha de comunicacao com o cofre do concurso.");
    } finally {
      setLoading(false);
    }
  };

  const triggerConcreteAiRelease = async () => {
    if (!authorized) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/artist-gazette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantCode,
          action: "release_ai_gazette"
        })
      });
      const data = await res.json();
      if (data.authorized && data.gazetteReleased) {
        setGazetteReleased(true);
        setIssue(data.issue);
        setReleaseCount((c) => c + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-stone-100 selection:bg-amber-400 selection:text-stone-950">
      {/* Faixa superior tematica de redacao tecnica & concurso fechado */}
      <header className="border-b border-amber-500/30 bg-[#0e1420]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/60 bg-amber-500/10 font-mono text-sm font-black text-amber-300">
              3F·IA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-300">
                  COFRE EXCLUSIVO DE PARTICIPANTES
                </span>
                <span className="font-mono text-[11px] text-stone-400">
                  JORNAIS VIRTUALIZADOS · IA CONCRETA
                </span>
              </div>
              <h1 className="mt-0.5 font-serif text-xl font-bold tracking-tight text-stone-50">
                Sala Reservada do Concurso &amp; Banca de Jornais dos Produtores
              </h1>
            </div>
          </div>

          <a
            href="/deque-engenharias"
            className="rounded-lg border border-stone-700 bg-stone-900 px-3.5 py-2 font-mono text-xs text-stone-300 hover:border-amber-400/60 hover:text-amber-200"
          >
            &larr; Voltar ao Deque Principal
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-7">
        {/* Portao de acesso exclusivo aos participantes */}
        <section className="rounded-2xl border border-amber-500/30 bg-[#121927] p-5 shadow-lg">
          <div className="grid gap-5 lg:grid-cols-3 lg:items-center">
            <div className="lg:col-span-2">
              <span className="font-mono text-xs font-semibold text-amber-300">
                CONTROLE DE ACESSO DO CONCURSO
              </span>
              <h2 className="mt-1 font-serif text-lg font-bold text-stone-100">
                Somente Produtores e Artistas Habilitados Acessam as Diretrizes e Jornais Liberados
              </h2>
              <p className="mt-1 text-xs text-stone-400">
                Chave de teste habilitada para participante: <code className="rounded bg-stone-900 px-1.5 py-0.5 text-amber-300">CERRO-ART-2026</code> · <code className="rounded bg-stone-900 px-1.5 py-0.5 text-amber-300">PARTICIPANTE-3F</code> · <code className="rounded bg-stone-900 px-1.5 py-0.5 text-amber-300">LEGADO-PRODUCER</code>
              </p>
            </div>

            <form onSubmit={handleEnterContest} className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <input
                type="text"
                value={participantCode}
                onChange={(e) => setParticipantCode(e.target.value)}
                placeholder="Codigo de participante"
                className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 font-mono text-xs text-stone-100 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-amber-400 px-4 py-2 font-mono text-xs font-bold text-stone-950 hover:bg-amber-300 disabled:opacity-50"
              >
                {loading ? "Validando com IA Concreta..." : "Validar Participante & Solicitar Jornal"}
              </button>
            </form>
          </div>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-2.5 font-mono text-xs text-rose-200">
              {errorMsg}
            </div>
          )}
        </section>

        {/* Estado bloqueado antes da liberacao pela IA Concreta */}
        {(!authorized || !gazetteReleased || !issue) && (
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-stone-800 bg-[#101622] p-5">
              <div className="font-mono text-[11px] text-amber-400">01 · BLOQUEIO SELETIVO</div>
              <h3 className="mt-1 font-serif text-base font-bold">Fora da Vitrine Publica</h3>
              <p className="mt-2 text-xs text-stone-400">
                As regras de premio fixo, custo-beneficio e escala nao ficam expostas na tela geral de engenharias.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-[#101622] p-5">
              <div className="font-mono text-[11px] text-sky-400">02 · IA CONCRETA</div>
              <h3 className="mt-1 font-serif text-base font-bold">Aguardando Consolidacao</h3>
              <p className="mt-2 text-xs text-stone-400">
                Os dados so aparecem na banca de jornal virtualizado quando a IA Concreta libera a edicao ao participante.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-[#101622] p-5">
              <div className="font-mono text-[11px] text-emerald-400">03 · PRODUTORES</div>
              <h3 className="mt-1 font-serif text-base font-bold">Entrega Direcionada</h3>
              <p className="mt-2 text-xs text-stone-400">
                Cada produtor inscrito recebe a edicao formatada em jornal com pesos, premio e regra de licenca.
              </p>
            </div>
          </section>
        )}

        {/* Jornal Virtualizado Liberado pela IA Concreta */}
        {authorized && gazetteReleased && issue && (
          <article className="rounded-2xl border-2 border-amber-400/50 bg-[#f5efe2] text-stone-900 shadow-2xl">
            {/* Masthead estilo jornal tecnico */}
            <div className="border-b-2 border-stone-900 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700">
                <span>{issue.issueCode} · LIBERADO PARA: {participantCode.toUpperCase()}</span>
                <span>EDICOES LIBERADAS NESTA SESSAO: {releaseCount}</span>
                <button
                  type="button"
                  onClick={triggerConcreteAiRelease}
                  className="rounded border border-stone-900 bg-stone-900 px-2.5 py-1 text-[10px] text-amber-300 hover:bg-stone-800"
                >
                  Re-liberar Jornal pela IA Concreta
                </button>
              </div>
              <div className="mt-2 text-center font-serif text-2xl font-black tracking-tight sm:text-3xl">
                {issue.editionTitle}
              </div>
              <div className="mt-2 border-t border-stone-400 pt-2 text-center font-serif text-base font-semibold italic text-stone-800">
                {issue.headline}
              </div>
            </div>

            {/* Colunas editoriais visuais (sem parede de texto) */}
            <div className="grid gap-6 p-6 lg:grid-cols-12">
              {/* Coluna 1: Parecer da IA Concreta & Premio Fixo */}
              <div className="space-y-4 border-b border-stone-300 pb-5 lg:col-span-5 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
                <div className="rounded-xl border border-stone-900/20 bg-amber-100/80 p-4">
                  <div className="font-mono text-[10px] font-extrabold uppercase text-amber-900">
                    PARECER DA IA CONCRETA
                  </div>
                  <p className="mt-1.5 font-serif text-sm leading-relaxed text-stone-900">
                    {issue.aiConcreteVerdict}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-stone-900 bg-stone-900 p-3.5 text-amber-300">
                    <div className="font-mono text-[10px] uppercase text-stone-400">
                      PREMIO FIXO DA RODADA
                    </div>
                    <div className="mt-1 font-mono text-xl font-black">
                      R$ {issue.prizePoolBrl.toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-stone-900 bg-white p-3.5 text-stone-900">
                    <div className="font-mono text-[10px] uppercase text-stone-500">
                      STATUS DE LIBERACAO
                    </div>
                    <div className="mt-1 font-mono text-sm font-extrabold text-emerald-700">
                      IA CONCRETA · ATIVO
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-300 bg-white/80 p-3.5">
                  <div className="font-mono text-[10px] font-bold uppercase text-stone-600">
                    LICENCA &amp; LEGADO DO ARTISTA
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-800">
                    {issue.licenseRuleSummary}
                  </p>
                </div>
              </div>

              {/* Coluna 2: Matriz Visual de Custo-Beneficio */}
              <div className="space-y-3 border-b border-stone-300 pb-5 lg:col-span-4 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
                <div className="font-mono text-xs font-extrabold uppercase tracking-wide text-stone-900">
                  GRADE DE CUSTO-BENEFICIO (0–100 PTS)
                </div>
                {issue.costBenefitMatrix.map((row) => (
                  <div
                    key={row.criterion}
                    className="rounded-xl border border-stone-300 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif text-xs font-bold text-stone-900">
                        {row.criterion}
                      </span>
                      <span className="rounded bg-stone-900 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                        {row.weightPct}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full bg-stone-900"
                        style={{ width: `%` }}
                      />
                    </div>
                    <div className="mt-1.5 font-mono text-[10px] text-stone-600">
                      {row.targetMetric}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coluna 3: Caderno dos Produtores */}
              <div className="space-y-3 lg:col-span-3">
                <div className="font-mono text-xs font-extrabold uppercase tracking-wide text-stone-900">
                  CADERNO DOS PRODUTORES
                </div>
                {issue.producerBriefs.map((prod) => (
                  <div
                    key={prod.producerAlias}
                    className="rounded-xl border border-stone-900/25 bg-white p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-emerald-700/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                        {prod.status}
                      </span>
                      <span className="font-mono text-xs font-black text-stone-900">
                        {prod.scoreComputed} pts
                      </span>
                    </div>
                    <div className="mt-2 font-serif text-sm font-bold text-stone-900">
                      {prod.producerAlias}
                    </div>
                    <div className="font-mono text-[10px] text-stone-600">
                      {prod.disciplineFocus}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-snug text-stone-700">
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
