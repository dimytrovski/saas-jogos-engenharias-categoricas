"use client";

import React, { useMemo, useState } from "react";
import {
  buildSafeFlexibleLink,
  CLOUD_PROFILE_GAMES,
  PLAYER_PROFILES,
  type PlayerProfileType,
} from "@/data/cloudProfileGames";

export default function CloudProfileGameSelector() {
  const [selectedProfile, setSelectedProfile] =
    useState<PlayerProfileType>("Competitivo & Arena");
  const [flexibleTag, setFlexibleTag] = useState<string>("convidado-global");
  const [grossAmountBRL, setGrossAmountBRL] = useState<number>(100);
  const [copiedId, setCopiedId] = useState<string>("");

  const gamesForProfile = useMemo(
    () => CLOUD_PROFILE_GAMES.filter((g) => g.profile === selectedProfile),
    [selectedProfile]
  );

  const avgRetentionPct = useMemo(() => {
    if (gamesForProfile.length === 0) return 15;
    const sum = gamesForProfile.reduce((acc, g) => acc + g.capitalRetentionPct, 0);
    return Math.round(sum / gamesForProfile.length);
  }, [gamesForProfile]);

  const safeGross = Math.max(0, Number.isFinite(grossAmountBRL) ? grossAmountBRL : 0);
  const retainedCapitalBRL = Number(((safeGross * avgRetentionPct) / 100).toFixed(2));
  const netUserOrPartnerBRL = Number((safeGross - retainedCapitalBRL).toFixed(2));

  async function handleCopyLink(gameId: string, finalLink: string) {
    try {
      await navigator.clipboard.writeText(finalLink);
      setCopiedId(gameId);
      window.setTimeout(() => setCopiedId(""), 2000);
    } catch {
      setCopiedId("");
    }
  }

  return (
    <section
      id="selecao-jogos-nuvem-perfil"
      aria-label="SeleÃ§Ã£o de jogos por perfil nos servidores na nuvem com retenÃ§Ã£o segura de capital"
      className="w-full max-w-6xl mx-auto mt-10 rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-md text-left space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-700 text-white mb-1">
            Servidores na Nuvem â€¢ SeleÃ§Ã£o por Perfil â€¢ EquilÃ­brio Parkeriano
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Jogos na Nuvem por Perfil com RetenÃ§Ã£o Segura e Links FlexÃ­veis
          </h2>
          
        </div>

        <div className="rounded-xl bg-slate-950 text-white px-4 py-2.5 text-xs shrink-0">
          <div className="font-bold uppercase tracking-wider text-emerald-400">
            RetenÃ§Ã£o MÃ©dia do Perfil
          </div>
          <div className="text-xl font-black text-white">{avgRetentionPct}%</div>
          <div className="text-[11px] text-slate-300">
            Vault: VAULT-BRL-NUBANK-PROTECTED
          </div>
        </div>
      </div>

      {/* SeleÃ§Ã£o de perfil + parÃ¢metro flexÃ­vel de link + simulaÃ§Ã£o segura de retenÃ§Ã£o */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
            1. Escolha o Perfil do Jogador / UsuÃ¡rio
          </div>
          <div className="flex flex-wrap gap-2">
            {PLAYER_PROFILES.map((prof) => {
              const active = prof === selectedProfile;
              return (
                <button
                  key={prof}
                  type="button"
                  onClick={() => setSelectedProfile(prof)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                    active
                      ? "bg-indigo-700 text-white border-indigo-700 shadow-sm"
                      : "bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {prof}
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <label
              htmlFor="flexible-user-tag"
              className="block text-xs font-extrabold text-slate-800 mb-1"
            >
              ParÃ¢metro flexÃ­vel do link (qualquer usuÃ¡rio / campanha / convite)
            </label>
            <input
              id="flexible-user-tag"
              type="text"
              value={flexibleTag}
              onChange={(e) => setFlexibleTag(e.target.value)}
              placeholder="ex.: jogador-01, parceiro, convite"
              className="w-full max-w-md rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
            />
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl bg-slate-950 text-white p-4 space-y-2.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-300">
            2. RetenÃ§Ã£o Segura de Capital no Servidor (BRL)
          </div>
          <div>
            <label
              htmlFor="gross-session-brl"
              className="block text-[11px] text-slate-300 mb-1"
            >
              Valor base da operaÃ§Ã£o / sessÃ£o (R$)
            </label>
            <input
              id="gross-session-brl"
              type="number"
              min={0}
              step={5}
              value={grossAmountBRL}
              onChange={(e) => setGrossAmountBRL(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-300">Retido com seguranÃ§a ({avgRetentionPct}%):</span>
            <strong className="text-emerald-400">
              {retainedCapitalBRL.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Parcela livre / repasse:</span>
            <strong className="text-sky-300">
              {netUserOrPartnerBRL.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>
        </div>
      </div>

      {/* Cards dos jogos na nuvem para o perfil selecionado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gamesForProfile.map((game) => {
          const finalLink = buildSafeFlexibleLink(
            game.reliableFlexibleLink,
            flexibleTag
          );
          return (
            <article
              key={game.id}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  {game.title}
                </h3>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 shrink-0">
                  {game.sessionMode}
                </span>
              </div>

              <p className="text-xs text-slate-700">
                <strong>Servidor / Nuvem:</strong> {game.cloudServerRegion}
              </p>
              <p className="text-xs text-slate-700">
                <strong>Plataformas:</strong> {game.platformHint}
              </p>
              <p className="text-xs text-slate-700">
                <strong>RetenÃ§Ã£o de capital:</strong> {game.capitalRetentionPct}%
              </p>
              <p className="text-xs text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                <strong>EquilÃ­brio parkeriano:</strong> {game.parkerianBalanceNote}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href={finalLink}
                  className="inline-flex items-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3.5 py-2 text-xs transition"
                >
                  Acessar via link confiÃ¡vel
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyLink(game.id, finalLink)}
                  className="inline-flex items-center rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold px-3 py-2 text-xs transition cursor-pointer"
                >
                  {copiedId === game.id ? "Link copiado!" : "Copiar link flexÃ­vel"}
                </button>
              </div>
              <div className="text-[11px] font-mono text-slate-500 break-all">
                {finalLink}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
