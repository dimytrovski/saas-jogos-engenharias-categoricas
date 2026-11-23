"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ENVIRONMENT_CATEGORIES,
  ENVIRONMENT_VIDEO_CASES,
  getAverageDemandSolvedPct,
  type GameEnvironmentCategory,
  type ScenarioVideoCase,
} from "@/data/environmentVideoCatalog";

export default function EnvironmentVideoCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<
    GameEnvironmentCategory | "Todas"
  >("Todas");
  const [activeCaseId, setActiveCaseId] = useState<string>(
    ENVIRONMENT_VIDEO_CASES[0].id
  );
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(24);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const filteredCases = useMemo(() => {
    if (selectedCategory === "Todas") {
      return ENVIRONMENT_VIDEO_CASES;
    }
    return ENVIRONMENT_VIDEO_CASES.filter(
      (item) => item.environmentCategory === selectedCategory
    );
  }, [selectedCategory]);

  const currentCase: ScenarioVideoCase = useMemo(() => {
    const foundInFilter = filteredCases.find((item) => item.id === activeCaseId);
    if (foundInFilter) return foundInFilter;
    return filteredCases[0] ?? ENVIRONMENT_VIDEO_CASES[0];
  }, [filteredCases, activeCaseId]);

  useEffect(() => {
    setIsPlayingDemo(false);
    setProgressPct(20);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [currentCase.id]);

  useEffect(() => {
    if (!isPlayingDemo) return;
    if (currentCase.videoSrc && videoRef.current) {
      videoRef.current.play().catch(() => {});
      return;
    }
    const timer = window.setInterval(() => {
      setProgressPct((prev) => (prev >= 100 ? 0 : prev + 4));
    }, 350);
    return () => window.clearInterval(timer);
  }, [isPlayingDemo, currentCase.videoSrc]);

  const portfolioAvgPct = useMemo(
    () => getAverageDemandSolvedPct(filteredCases),
    [filteredCases]
  );

  function handleTogglePlay() {
    if (currentCase.videoSrc && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlayingDemo(true);
      } else {
        videoRef.current.pause();
        setIsPlayingDemo(false);
      }
      return;
    }
    setIsPlayingDemo((prev) => !prev);
  }

  function handleToggleMute() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  }

  return (
    <section
      id="catalogo-cenarios-video"
      aria-label="CatÃ¡logo de cenÃ¡rios problemÃ¡ticos por categoria de ambiente de jogo com player de vÃ­deo"
      className="w-full max-w-6xl mx-auto mt-10 rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-md text-left space-y-6"
    >
      {/* CabeÃ§alho e resumo de cobertura de demanda */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-700 text-white mb-1">
            CatÃ¡logo por Ambiente de Jogo â€¢ Player &amp; Viabilidade
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            CenÃ¡rios ProblemÃ¡ticos por Categoria de Ambiente
          </h2>
          
        </div>

        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Demanda de Casos de Uso Resolvida
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ~{portfolioAvgPct}%{" "}
            <span className="text-xs font-semibold text-emerald-900">
              ({filteredCases.length}{" "}
              {filteredCases.length === 1 ? "cenÃ¡rio" : "cenÃ¡rios"})
            </span>
          </div>
        </div>
      </div>

      {/* Filtro por categoria de ambiente */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("Todas")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
            selectedCategory === "Todas"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100"
          }`}
        >
          Todos os Ambientes
        </button>

        {ENVIRONMENT_CATEGORIES.map((category) => {
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category);
                const firstInCat = ENVIRONMENT_VIDEO_CASES.find(
                  (c) => c.environmentCategory === category
                );
                if (firstInCat) setActiveCaseId(firstInCat.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                active
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Grade principal: seletor de cenÃ¡rios Ã  esquerda + player e impacto Ã  direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-2.5">
          {filteredCases.map((item) => {
            const isSelected = item.id === currentCase.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveCaseId(item.id)}
                className={`w-full p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${
                  isSelected
                    ? "border-blue-700 bg-blue-50/70 shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide text-blue-800">
                    {item.environmentCategory}
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                    {item.useCaseDemandSolvedPct}% demanda
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  {item.problemScenarioTitle}
                </div>
                <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                  Jogo/Contexto: <strong>{item.gameTitle}</strong> â€”{" "}
                  {item.problemSummary}
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-7 space-y-4">
          {/* Player de vÃ­deo */}
          <div className="rounded-2xl bg-slate-950 text-white overflow-hidden border border-slate-800 shadow">
            <div className="relative aspect-video w-full bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-between p-4 sm:p-5">
              {currentCase.videoSrc ? (
                <video
                  ref={videoRef}
                  src={currentCase.videoSrc}
                  muted={isMuted}
                  controls
                  playsInline
                  onPlay={() => setIsPlayingDemo(true)}
                  onPause={() => setIsPlayingDemo(false)}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 z-10">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded bg-white/10 text-sky-300">
                      {currentCase.environmentCategory} â€¢ {currentCase.gameTitle}
                    </span>
                    <span className="text-xs font-mono text-slate-300 bg-black/40 px-2 py-0.5 rounded">
                      {currentCase.videoDuration}
                    </span>
                  </div>

                  <div className="my-auto text-center space-y-2 z-10 px-2">
                    <div className="text-base sm:text-lg font-extrabold text-white">
                      {currentCase.videoTitle}
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl mx-auto">
                      {currentCase.problemSummary}
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-4 py-2 text-xs sm:text-sm transition cursor-pointer shadow"
                      >
                        <span>{isPlayingDemo ? "Pausar DemonstraÃ§Ã£o" : "Reproduzir DemonstraÃ§Ã£o"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 z-10">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>
                        {isPlayingDemo
                          ? "Reproduzindo fluxo demonstrativo..."
                          : "Pronto para reproduzir"}
                      </span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Barra inferior de controles e marcadores */}
            <div className="bg-slate-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 text-xs transition cursor-pointer"
                >
                  {isPlayingDemo ? "Pausar" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 text-xs transition cursor-pointer"
                >
                  {isMuted ? "Sem Ã¡udio" : "Ãudio ativo"}
                </button>
              </div>
              <span className="text-[11px] text-slate-400">
                Coloque um MP4 em <code className="text-slate-200">public/videos/</code> se quiser vÃ­deo real local
              </span>
            </div>

            <div className="bg-slate-950 px-4 py-3 border-t border-slate-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Etapas demonstradas no cenÃ¡rio
              </div>
              <ul className="space-y-1 text-xs text-slate-300">
                {currentCase.sceneHighlights.map((step) => (
                  <li key={step}>â€¢ {step}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Como resolve demanda, viabilidade econÃ´mica e UX */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
              <div className="text-[11px] font-extrabold uppercase text-emerald-900 mb-1">
                Cobertura de Casos de Uso
              </div>
              <div className="text-lg font-black text-emerald-700">
                {currentCase.useCaseDemandSolvedPct}% resolvido
              </div>
              
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
              <div className="text-[11px] font-extrabold uppercase text-amber-900 mb-1">
                Viabilidade EconÃ´mica
              </div>
              <div className="text-sm font-extrabold text-amber-950">
                {currentCase.estimatedMonthlySavingsBRL}
              </div>
              <p className="text-xs text-amber-950/85 mt-1">
                {currentCase.economicViabilityImpact}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
              <div className="text-[11px] font-extrabold uppercase text-blue-900 mb-1">
                ExperiÃªncia do UsuÃ¡rio (UX)
              </div>
              <div className="text-sm font-extrabold text-blue-950">
                Clareza em 1 visualizaÃ§Ã£o
              </div>
              <p className="text-xs text-blue-950/85 mt-1">
                {currentCase.uxImprovementSummary}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
