"use client";

import React, { useEffect, useMemo, useState } from "react";

export type ViewerTier = "viewer" | "subscriber";

export interface StreamStageProps {
  streamKey: string;
  viewerTier?: ViewerTier;
  /** Escala base da reflexão definida pelo criador/pintor de vídeos (ex: 1.0 = padrão) */
  reflectionScale?: number;
  /** Pulso dinâmico externo (0 a 1) disparado por atividade do fluxo/áudio/segmentos */
  activityPulse?: number;
  children: React.ReactNode;
}

export default function StreamStage({
  streamKey,
  viewerTier = "viewer",
  reflectionScale = 1,
  activityPulse = 0,
  children,
}: StreamStageProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeMq = window.matchMedia("(max-width: 640px)");

    const updateMedia = () => {
      setPrefersReducedMotion(motionMq.matches);
      setIsCompactViewport(sizeMq.matches);
    };

    updateMedia();
    motionMq.addEventListener("change", updateMedia);
    sizeMq.addEventListener("change", updateMedia);

    return () => {
      motionMq.removeEventListener("change", updateMedia);
      sizeMq.removeEventListener("change", updateMedia);
    };
  }, []);

  const computedStyle = useMemo(() => {
    const tierMultiplier = viewerTier === "subscriber" ? 1.15 : 0.92;
    const viewportMultiplier = isCompactViewport ? 0.75 : 1;
    const clampedPulse = Math.max(0, Math.min(1, activityPulse));

    const effectiveScale = prefersReducedMotion
      ? 1
      : Math.max(
          0.7,
          Math.min(1.6, reflectionScale * tierMultiplier * viewportMultiplier * (1 + clampedPulse * 0.18))
        );

    const effectiveOpacity = prefersReducedMotion
      ? 0.08
      : Math.max(
          0.08,
          Math.min(0.55, (viewerTier === "subscriber" ? 0.28 : 0.16) + clampedPulse * 0.2)
        );

    return {
      "--stream-reflection-scale": effectiveScale.toFixed(3),
      "--stream-reflection-opacity": effectiveOpacity.toFixed(3),
      "--stream-accent": viewerTier === "subscriber" ? "rgba(56, 189, 248, 0.45)" : "rgba(163, 163, 163, 0.25)",
    } as React.CSSProperties;
  }, [viewerTier, isCompactViewport, prefersReducedMotion, reflectionScale, activityPulse]);

  return (
    <div
      data-stream-key={streamKey}
      data-viewer-tier={viewerTier}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
      style={computedStyle}
      className="group relative w-full max-w-5xl mx-auto overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800/80 shadow-2xl transition-colors duration-300"
    >
      {/* Camada de herança gráfica e reflexão escalada */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      >
        <div
          style={{
            transform: `translate3d(0, -18%, 0) scale(var(--stream-reflection-scale, 1))`,
            opacity: "var(--stream-reflection-opacity, 0.2)",
            background: `radial-gradient(ellipse 75% 45% at 50% 0%, var(--stream-accent, rgba(255,255,255,0.22)), transparent 72%)`,
            willChange: prefersReducedMotion ? "auto" : "transform, opacity",
          }}
          className="h-full w-full origin-top transition-transform duration-300 ease-out"
        />
      </div>

      {/* Conteúdo herdado (player, HUD e overlays) */}
      <div className="relative z-20 p-2 sm:p-4">
        {children}
      </div>
    </div>
  );
}
