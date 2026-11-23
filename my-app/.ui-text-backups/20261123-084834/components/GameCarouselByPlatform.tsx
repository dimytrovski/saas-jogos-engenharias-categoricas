"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PLATFORM_CATEGORIES } from "@/data/games";
import {
  GAME_OPPORTUNITIES,
  type GameOpportunityData,
} from "@/data/gameOpportunities";
import type { PlatformName } from "@/data/heroBackgrounds";
import PlatformArtwork from "@/components/PlatformArtwork";
import {
  RightConnectionCircuit,
  SpinningPlatformControl,
} from "@/components/PlatformSpinAndCircuit";

function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

const PLATFORM_STYLE: Record<
  PlatformName,
  { badge: string; dot: string; label: string }
> = {
  Xbox: {
    badge: "bg-emerald-600 text-white border-emerald-500",
    dot: "bg-emerald-400",
    label: "Xbox",
  },
  PlayStation: {
    badge: "bg-blue-700 text-white border-blue-600",
    dot: "bg-sky-400",
    label: "PlayStation",
  },
  Nintendo: {
    badge: "bg-rose-600 text-white border-rose-500",
    dot: "bg-rose-300",
    label: "Nintendo",
  },
  Windows: {
    badge: "bg-sky-700 text-white border-sky-600",
    dot: "bg-cyan-300",
    label: "Windows",
  },
  Mac: {
    badge: "bg-indigo-700 text-white border-indigo-600",
    dot: "bg-indigo-300",
    label: "Mac",
  },
};

export default function GameCarouselByPlatform() {
  const [selectedPlatform, setSelectedPlatform] = useState<
    "Todas" | PlatformName
  >("Xbox");
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [circuitRevealedByTheme, setCircuitRevealedByTheme] = useState<
    Record<string, boolean>
  >({});
  const [selectedOppByGame, setSelectedOppByGame] = useState<
    Record<string, string>
  >({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const platformGames: GameOpportunityData[] = useMemo(() => {
    if (selectedPlatform === "Todas") return GAME_OPPORTUNITIES;
    const exact = GAME_OPPORTUNITIES.filter(
      (g) => g.platform === selectedPlatform
    );
    return exact.length > 0 ? exact : GAME_OPPORTUNITIES;
  }, [selectedPlatform]);

  const safeIndex =
    platformGames.length > 0 ? carouselIndex % platformGames.length : 0;
  const activeGame = platformGames[safeIndex] ?? GAME_OPPORTUNITIES[0];

  const activePlatformTheme: PlatformName =
    selectedPlatform === "Todas" ? activeGame.platform : selectedPlatform;

  const isCircuitVisible = Boolean(
    circuitRevealedByTheme[activePlatformTheme]
  );

  const activeOpportunity =
    activeGame.opportunities.find(
      (o) => o.id === selectedOppByGame[activeGame.gameId]
    ) ?? activeGame.opportunities[0];

  function handleSelectPlatform(platform: "Todas" | PlatformName) {
    setSelectedPlatform(platform);
    setCarouselIndex(0);
  }

  function handleRevealCircuit() {
    setCircuitRevealedByTheme((prev) => ({
      ...prev,
      [activePlatformTheme]: true,
    }));
  }

  function handlePrevSlide() {
    setCarouselIndex((prev) =>
      platformGames.length === 0
        ? 0
        : (prev - 1 + platformGames.length) % platformGames.length
    );
  }

  function handleNextSlide() {
    setCarouselIndex((prev) =>
      platformGames.length === 0 ? 0 : (prev + 1) % platformGames.length
    );
  }

  async function handleCopy(id: string, url: string) {
    const fullUrl =
      typeof window !== "undefined" && !isExternalUrl(url)
        ? `${window.location.origin}${url}`
        : url;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section
      id="plataformas-carrossel"
      aria-label="Controles de plataformas, circuito e carrossel de jogos"
      className="w-full max-w-6xl mx-auto mt-10 space-y-5"
    >
      <div className="rounded-2xl bg-white border-2 border-slate-200 p-4 shadow-sm">
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3 text-center">
          Controles por Plataforma (Xbox • PlayStation • Nintendo • Windows •
          Mac)
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {PLATFORM_CATEGORIES.map((platform) => {
            const isSelected = selectedPlatform === platform;
            const style = PLATFORM_STYLE[platform];
            return (
              <button
                key={platform}
                type="button"
                onClick={() => handleSelectPlatform(platform)}
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold border transition cursor-pointer ${
                  isSelected
                    ? `${style.badge} shadow-md scale-105`
                    : "bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isSelected ? "bg-white" : style.dot
                  }`}
                />
                <span>{style.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handleSelectPlatform("Todas")}
            aria-pressed={selectedPlatform === "Todas"}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold border transition cursor-pointer ${
              selectedPlatform === "Todas"
                ? "bg-slate-950 text-white border-slate-950 shadow-md scale-105"
                : "bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>Todas</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-950 text-white px-5 py-4 border-2 border-slate-800 shadow-lg">
        <div className="flex items-center gap-4 min-w-0">
          <SpinningPlatformControl
            platform={activePlatformTheme}
            isCircuitActive={isCircuitVisible}
            onActivateCircuit={handleRevealCircuit}
          />
          <div className="text-left min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 block">
              Controle Giratório ({activePlatformTheme}) • Clique ou passe o
              mouse
            </span>
            <h2 className="text-lg sm:text-2xl font-extrabold truncate">
              Carrossel de Jogos &amp; Cliques {activePlatformTheme}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {isCircuitVisible
                ? "Circuito de conexão ativo à direita conectado ao carrossel."
                : "Circuito oculto à direita. Passe o mouse ou clique no controle giratório para exibir."}
            </p>
          </div>
        </div>

        <RightConnectionCircuit
          platform={activePlatformTheme}
          isVisible={isCircuitVisible}
        />
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 relative bg-slate-950 flex flex-col justify-between">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <div
                key={activeGame.gameId}
                className="w-full h-full transition-all duration-500"
              >
                <PlatformArtwork platform={activeGame.platform} compact />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-5 text-left text-white">
                <span className="inline-block w-fit text-xs font-bold px-2.5 py-0.5 rounded bg-white/15 border border-white/20 mb-2">
                  {activeGame.platform} • Item {safeIndex + 1} de{" "}
                  {platformGames.length}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold">
                  {activeGame.title}
                </h3>
                <p className="text-sm text-slate-200 mt-1 max-w-xl">
                  {activeGame.summary}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white border-t border-slate-800">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold transition cursor-pointer"
              >
                ← Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {platformGames.map((g, idx) => (
                  <button
                    key={g.gameId}
                    type="button"
                    onClick={() => setCarouselIndex(idx)}
                    aria-label={`Ir para ${g.title}`}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      idx === safeIndex
                        ? "w-7 bg-blue-400"
                        : "w-2.5 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextSlide}
                className="px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold transition cursor-pointer"
              >
                Próximo →
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between gap-5 text-left bg-slate-50/60">
            <div className="space-y-4">
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Oportunidade Inteligente ({activeGame.platform})
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {activeOpportunity.badge}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {activeGame.opportunities.map((opp) => {
                    const selected = opp.id === activeOpportunity.id;
                    return (
                      <button
                        key={opp.id}
                        type="button"
                        onClick={() =>
                          setSelectedOppByGame((prev) => ({
                            ...prev,
                            [activeGame.gameId]: opp.id,
                          }))
                        }
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                          selected
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {opp.storeName}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeOpportunity.smartTip}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {isExternalUrl(activeOpportunity.url) ? (
                    <a
                      href={activeOpportunity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
                    >
                      Comprar / Ver {activeOpportunity.storeName} ↗
                    </a>
                  ) : (
                    <Link
                      href={activeOpportunity.url}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
                    >
                      Abrir {activeOpportunity.storeName} →
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(activeOpportunity.id, activeOpportunity.url)
                    }
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    {copiedId === activeOpportunity.id
                      ? "Copiado!"
                      : "Copiar link"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-indigo-50/80 border border-indigo-100 p-4 space-y-2.5">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                  Encaminhar para Produtividade ({activeGame.platform})
                </span>

                <div className="space-y-2">
                  {activeGame.productivityDestinations.map((dest) => (
                    <a
                      key={dest.id}
                      href={dest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg bg-white px-3.5 py-2.5 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/40 transition"
                    >
                      <div className="text-xs font-bold text-indigo-700">
                        Ir para {dest.toolName} ↗
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {dest.purpose}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-100 border-t border-slate-200">
          {platformGames.map((item, idx) => {
            const isCurrent = idx === safeIndex;
            return (
              <button
                key={item.gameId}
                type="button"
                onClick={() => setCarouselIndex(idx)}
                className={`group rounded-xl overflow-hidden text-left border transition cursor-pointer ${
                  isCurrent
                    ? "border-blue-600 ring-2 ring-blue-500/40 bg-white"
                    : "border-slate-200 bg-white/80 hover:bg-white"
                }`}
              >
                <div className="h-16 w-full overflow-hidden">
                  <PlatformArtwork platform={item.platform} />
                </div>
                <div className="p-2">
                  <div className="text-[10px] font-bold text-blue-700">
                    {item.platform}
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {item.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}