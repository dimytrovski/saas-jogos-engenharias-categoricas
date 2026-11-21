"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PLATFORM_CATEGORIES } from "@/data/games";
import {
  GAME_OPPORTUNITIES,
  type GameOpportunityData,
} from "@/data/gameOpportunities";
import type { PlatformName } from "@/data/heroBackgrounds";
import PlatformArtwork from "@/components/PlatformArtwork";

function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export default function GameCatalogByPlatform() {
  const [selectedPlatform, setSelectedPlatform] = useState<
    "Todas" | PlatformName
  >("Todas");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<
    Record<string, string>
  >({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredGames: GameOpportunityData[] =
    selectedPlatform === "Todas"
      ? GAME_OPPORTUNITIES
      : GAME_OPPORTUNITIES.filter((item) => item.platform === selectedPlatform);

  function getActiveOpportunity(item: GameOpportunityData) {
    const chosenId = selectedOpportunityId[item.gameId];
    return (
      item.opportunities.find((opp) => opp.id === chosenId) ??
      item.opportunities[0]
    );
  }

  async function handleCopyLink(id: string, url: string) {
    const fullUrl =
      typeof window !== "undefined" && !isExternalUrl(url)
        ? `${window.location.origin}${url}`
        : url;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section
      aria-label="Catálogo de jogos por plataforma com oportunidades e produtividade"
      className="w-full max-w-6xl mx-auto mt-10"
    >
      <div className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Oportunidades por Plataforma &amp; Produtividade
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Filtre por plataforma, escolha uma oportunidade de compra inteligente e
          encaminhe sua rotina para sua ferramenta de produtividade.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={() => setSelectedPlatform("Todas")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            selectedPlatform === "Todas"
              ? "bg-blue-600 text-white shadow"
              : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
          }`}
        >
          Todas
        </button>

        {PLATFORM_CATEGORIES.map((platform) => (
          <button
            key={platform}
            type="button"
            onClick={() => setSelectedPlatform(platform)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              selectedPlatform === platform
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {platform}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {filteredGames.map((item) => {
          const activeOpp = getActiveOpportunity(item);

          return (
            <article
              key={item.gameId}
              className="group rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="overflow-hidden">
                  <div className="transition-transform duration-500 group-hover:scale-105">
                    <PlatformArtwork platform={item.platform} />
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 mb-2">
                      {item.platform}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Compra inteligente
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {activeOpp.badge}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {item.opportunities.map((opp) => {
                        const isSelected = opp.id === activeOpp.id;
                        return (
                          <button
                            key={opp.id}
                            type="button"
                            onClick={() =>
                              setSelectedOpportunityId((prev) => ({
                                ...prev,
                                [item.gameId]: opp.id,
                              }))
                            }
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                              isSelected
                                ? "bg-slate-900 text-white"
                                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {opp.storeName}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {activeOpp.smartTip}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {isExternalUrl(activeOpp.url) ? (
                        <a
                          href={activeOpp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
                        >
                          Acessar {activeOpp.storeName} ↗
                        </a>
                      ) : (
                        <Link
                          href={activeOpp.url}
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
                        >
                          Abrir {activeOpp.storeName} →
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyLink(activeOpp.id, activeOpp.url)
                        }
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        {copiedId === activeOpp.id ? "Copiado!" : "Copiar link"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3 space-y-2">
                    <span className="block text-xs font-bold uppercase tracking-wider text-indigo-900">
                      Encaminhar para produtividade
                    </span>

                    <div className="grid grid-cols-1 gap-1.5">
                      {item.productivityDestinations.map((dest) => (
                        <a
                          key={dest.id}
                          href={dest.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col rounded-lg bg-white px-3 py-2 border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition"
                        >
                          <span className="text-xs font-bold text-indigo-700">
                            {dest.toolName} ↗
                          </span>
                          <span className="text-[11px] text-gray-600">
                            {dest.purpose}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}