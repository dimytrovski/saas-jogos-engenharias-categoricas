"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  HERO_BACKGROUNDS,
  pickRandomBackground,
  type HeroBackgroundTheme,
} from "@/data/heroBackgrounds";
import PlatformArtwork from "@/components/PlatformArtwork";

const AUTO_INTERVAL_MS = 4000;

export default function HeroIntroWithRandomBg() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [isPausedByHover, setIsPausedByHover] = useState<boolean>(false);

  useEffect(() => {
    const initialTheme = pickRandomBackground();
    const initialIndex = HERO_BACKGROUNDS.findIndex(
      (item) => item.id === initialTheme.id
    );
    if (initialIndex >= 0) {
      setActiveIndex(initialIndex);
    }
  }, []);

  useEffect(() => {
    if (!isAutoPlay || isPausedByHover) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        const currentTheme = HERO_BACKGROUNDS[prev];
        const nextTheme = pickRandomBackground(currentTheme?.id);
        const nextIdx = HERO_BACKGROUNDS.findIndex(
          (item) => item.id === nextTheme.id
        );
        return nextIdx >= 0 ? nextIdx : (prev + 1) % HERO_BACKGROUNDS.length;
      });
    }, AUTO_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isAutoPlay, isPausedByHover]);

  function handleNextTheme() {
    const currentTheme = HERO_BACKGROUNDS[activeIndex];
    const nextTheme = pickRandomBackground(currentTheme?.id);
    const nextIdx = HERO_BACKGROUNDS.findIndex(
      (item) => item.id === nextTheme.id
    );
    setActiveIndex(
      nextIdx >= 0 ? nextIdx : (activeIndex + 1) % HERO_BACKGROUNDS.length
    );
  }

  const currentTheme: HeroBackgroundTheme =
    HERO_BACKGROUNDS[activeIndex] ?? HERO_BACKGROUNDS[0];

  return (
    <section
      aria-label="IntroduÃ§Ã£o temÃ¡tica automÃ¡tica de jogos e plataformas"
      onMouseEnter={() => setIsPausedByHover(true)}
      onMouseLeave={() => setIsPausedByHover(false)}
      className="relative w-full max-w-6xl mx-auto overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl"
    >
      <div className="absolute inset-0 pointer-events-none">
        {HERO_BACKGROUNDS.map((bg, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={bg.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive ? "opacity-90 scale-105" : "opacity-0 scale-100"
              }`}
            >
              <PlatformArtwork platform={bg.platform} compact />
            </div>
          );
        })}
      </div>

      <div
        className={`relative z-10 bg-gradient-to-br ${currentTheme.overlayClass} transition-all duration-700 px-6 py-14 md:px-12 md:py-20 flex flex-col items-center text-center`}
      >
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 text-white border border-white/20">
            MicroSaaS para Desenvolvedores de Jogos
          </span>
          <span
            className={`text-xs font-bold px-3.5 py-1 rounded-full border transition-all duration-500 ${currentTheme.badgeClass}`}
          >
            {currentTheme.platformTag}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 max-w-4xl">
          Simplifique Sua Rotina e Capte Jogadores
        </h1>

        

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          <Link
            href="/proxima-pagina"
            className="bg-blue-600 text-white px-7 py-3.5 rounded-lg font-semibold text-base hover:bg-blue-500 transition shadow-lg"
          >
            ComeÃ§ar Agora
          </Link>

          <button
            type="button"
            onClick={handleNextTheme}
            className="bg-white/15 text-white px-5 py-3.5 rounded-lg font-medium text-sm border border-white/25 hover:bg-white/25 transition cursor-pointer"
          >
            Trocar cenÃ¡rio agora
          </button>

          <button
            type="button"
            onClick={() => setIsAutoPlay((prev) => !prev)}
            className="bg-black/45 text-gray-100 px-4 py-3.5 rounded-lg font-medium text-sm border border-white/20 hover:bg-black/65 transition cursor-pointer"
          >
            {isAutoPlay ? "Auto: Ligado (4s)" : "Auto: Pausado"}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {HERO_BACKGROUNDS.map((bg, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  active
                    ? "bg-white text-slate-950 scale-105 shadow"
                    : "bg-black/40 text-white/85 hover:bg-black/65 border border-white/20"
                }`}
              >
                {bg.platform}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
