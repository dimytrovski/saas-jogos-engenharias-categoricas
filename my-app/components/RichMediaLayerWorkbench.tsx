"use client";

import React, { useEffect, useRef, useState } from "react";

export type MediaLayerMode = "2d_3f_canvas" | "svg_vector_grid" | "shader_wave_field";

interface RichMediaLayerWorkbenchProps {
  moduleCode: string;
  discipline: string;
  chargePct: number;
  sdlcProgress: number;
  licenseActive: boolean;
  soundEnabled: boolean;
  onChargeDelta: (delta: number) => void;
  onLogEvent: (msg: string, playElephant?: boolean) => void;
}

const PHI = 1.61803398875;

function triggerRichAcousticChord(freqBase: number, harmonicMode: "elephant" | "pulse" | "lock") {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const masterGain = ctx.createGain();

    if (harmonicMode === "elephant") {
      oscA.type = "sawtooth";
      oscA.frequency.setValueAtTime(140, now);
      oscA.frequency.exponentialRampToValueAtTime(345, now + 0.25);
      oscA.frequency.exponentialRampToValueAtTime(165, now + 0.88);

      oscB.type = "triangle";
      oscB.frequency.setValueAtTime(280, now);
      oscB.frequency.exponentialRampToValueAtTime(690, now + 0.25);
      oscB.frequency.exponentialRampToValueAtTime(220, now + 0.88);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(540, now);
      filter.frequency.exponentialRampToValueAtTime(1320, now + 0.25);
      filter.Q.setValueAtTime(3.2, now);
      masterGain.gain.setValueAtTime(0.13, now + 0.06);
      masterGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.92);
    } else if (harmonicMode === "lock") {
      oscA.type = "sine";
      oscA.frequency.setValueAtTime(freqBase, now);
      oscA.frequency.exponentialRampToValueAtTime(freqBase * 1.5, now + 0.22);

      oscB.type = "triangle";
      oscB.frequency.setValueAtTime(freqBase * 2, now);
      oscB.frequency.exponentialRampToValueAtTime(freqBase * 3, now + 0.22);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2200, now);
      masterGain.gain.setValueAtTime(0.09, now + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);
    } else {
      oscA.type = "sine";
      oscA.frequency.setValueAtTime(freqBase, now);
      oscA.frequency.exponentialRampToValueAtTime(freqBase * 1.18, now + 0.14);

      oscB.type = "sine";
      oscB.frequency.setValueAtTime(freqBase * PHI, now);
      oscB.frequency.exponentialRampToValueAtTime(freqBase * PHI * 1.12, now + 0.14);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600, now);
      masterGain.gain.setValueAtTime(0.06, now + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);
    }

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.95);
    oscB.stop(now + 0.95);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1050);
  } catch {
    // Ignora bloqueio de audio antes de gesto do usuario
  }
}

export default function RichMediaLayerWorkbench({
  moduleCode,
  discipline,
  chargePct,
  sdlcProgress,
  licenseActive,
  soundEnabled,
  onChargeDelta,
  onLogEvent
}: RichMediaLayerWorkbenchProps) {
  const [layerMode, setLayerMode] = useState<MediaLayerMode>("2d_3f_canvas");
  const [svgOverlay, setSvgOverlay] = useState(true);
  const [shaderIntensity, setShaderIntensity] = useState(72);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const t0 = performance.now();

    const renderFrame = (now: number) => {
      const t = (now - t0) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const rOuter = Math.min(w, h) * 0.42;
      const rInner = rOuter / PHI;
      const energy = Math.max(0.08, chargePct / 100);
      const gainFactor = shaderIntensity / 100;

      ctx.clearRect(0, 0, w, h);

      // Fundo tecnico de alta definicao
      const grad = ctx.createRadialGradient(cx, cy * 0.85, rOuter * 0.1, cx, cy, rOuter * 1.25);
      grad.addColorStop(0, layerMode === "shader_wave_field" ? "#0d253f" : "#0b1626");
      grad.addColorStop(0.7, "#060c16");
      grad.addColorStop(1, "#03060b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Camada 1: Campo tipo Shader / Onda Generativa (R, S, T defasados em 120 graus)
      if (layerMode === "shader_wave_field" || layerMode === "2d_3f_canvas") {
        const phases = [
          { color: "rgba(239, 68, 68, 0.55)", shift: 0 },
          { color: "rgba(245, 158, 11, 0.55)", shift: (Math.PI * 2) / 3 },
          { color: "rgba(56, 189, 248, 0.55)", shift: (Math.PI * 4) / 3 }
        ];

        phases.forEach((ph) => {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 6) {
            const normX = (x - cx) / (w * 0.5);
            const amp = (14 + energy * 24) * gainFactor * Math.exp(-normX * normX * 1.3);
            const y = cy + Math.sin(x * 0.032 - t * (2.6 + energy * 4) + ph.shift) * amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = ph.color;
          ctx.lineWidth = layerMode === "shader_wave_field" ? 2.4 : 1.5;
          ctx.stroke();
        });
      }

      // Camada 2: Geometria Phi (1.618) + Emblema Elefante Trifasico
      ctx.strokeStyle = licenseActive ? "#2dd4bf" : "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Corpo e orelhas sintetizadas no canvas
      const u = rOuter * 0.42;
      ctx.fillStyle = energy >= 0.7 ? "rgba(45, 212, 191, 0.22)" : "rgba(30, 58, 95, 0.36)";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy - u * 0.15, u * 0.48, u * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tromba trifasica animada
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy + u * 0.12);
      ctx.quadraticCurveTo(
        cx + Math.sin(t * 3) * u * 0.14,
        cy + u * 0.56,
        cx - u * 0.06,
        cy + u * 0.88
      );
      ctx.stroke();

      // Rodape de telemetria grafica
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        ` · 3F:% · SDLC:% · SHADER:%`,
        cx,
        h - 12
      );

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [layerMode, chargePct, sdlcProgress, licenseActive, shaderIntensity, moduleCode]);

  const handleAcousticTest = (mode: "elephant" | "pulse" | "lock") => {
    if (soundEnabled) {
      triggerRichAcousticChord(mode === "lock" ? 440 : 220, mode);
    }
    if (mode === "elephant") {
      onChargeDelta(10);
      onLogEvent(
        `MIDIA 2D + AUDIO []: Pulso trifasico e trombeta disparados ().`,
        false
      );
    } else if (mode === "lock") {
      onLogEvent(
        `AUDIO PROTOCOLO []: Acorde harmônico de sincronizacao/licenca emitido.`,
        false
      );
    } else {
      onChargeDelta(5);
      onLogEvent(
        `SHADER / ONDA []: Campo trifasico calibrado em %.`,
        false
      );
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-400">
            CAMADAS DE MIDIA UNIFICADAS · CANVAS 2D + SVG + ONDA/SHADER + WEB AUDIO
          </span>
          <h3 className="text-base font-semibold">
            Bancada de Renderizacao Multimídia ({moduleCode} · {discipline})
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["2d_3f_canvas", "Canvas 2D + 3F"],
              ["svg_vector_grid", "SVG Vetorial"],
              ["shader_wave_field", "Onda / Shader 3F"]
            ] as [MediaLayerMode, string][]
          ).map(([modeKey, modeLabel]) => (
            <button
              key={modeKey}
              type="button"
              onClick={() => setLayerMode(modeKey)}
              className={
                layerMode === modeKey
                  ? "rounded-lg bg-zinc-900 px-3 py-1.5 font-mono text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
                  : "rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }
            >
              {modeLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-12 lg:items-center">
        {/* Container multimidia com Canvas 2D + Overlay SVG vetorial */}
        <div className="relative mx-auto flex w-full max-w-[300px] items-center justify-center lg:col-span-5">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="h-[280px] w-[280px] rounded-2xl border border-slate-800 bg-slate-950"
          />

          {svgOverlay && (
            <svg
              viewBox="0 0 280 280"
              className="pointer-events-none absolute inset-0 h-[280px] w-[280px]"
              aria-hidden="true"
            >
              <rect
                x="14"
                y="14"
                width="252"
                height="252"
                rx="18"
                fill="none"
                stroke="rgba(45, 212, 191, 0.35)"
                strokeDasharray="6 4"
                strokeWidth="1.2"
              />
              <circle
                cx="140"
                cy="140"
                r="116"
                fill="none"
                stroke="rgba(245, 158, 11, 0.25)"
                strokeWidth="1"
              />
              <text
                x="24"
                y="32"
                fill="#5eead4"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="700"
              >
                SVG·PHI·1.618
              </text>
              <text
                x="256"
                y="32"
                textAnchor="end"
                fill={licenseActive ? "#34d399" : "#fbbf24"}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="700"
              >
                {licenseActive ? "LIC:PROD" : "LIC:PEND"}
              </text>
            </svg>
          )}
        </div>

        {/* Controles de Shader/Onda, SVG e Sintese Acustica Web Audio API */}
        <div className="space-y-4 lg:col-span-7">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-medium">
              <span>Intensidade de Onda / Shader Trifasico</span>
              <span className="font-mono font-semibold text-teal-700 dark:text-teal-300">
                {shaderIntensity}%
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={100}
              value={shaderIntensity}
              onChange={(e) => setShaderIntensity(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSvgOverlay((v) => !v)}
              className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
            >
              {svgOverlay ? "Overlay SVG Vetorial: ON" : "Overlay SVG Vetorial: OFF"}
            </button>
            <button
              type="button"
              onClick={() => handleAcousticTest("pulse")}
              className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-500/20 dark:text-sky-300"
            >
              Pulso Harmônico (+5% Carga)
            </button>
            <button
              type="button"
              onClick={() => handleAcousticTest("lock")}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
            >
              Sinal Acústico de Licença
            </button>
            <button
              type="button"
              onClick={() => handleAcousticTest("elephant")}
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
            >
              Trombeta 3F (+10% Carga)
            </button>
          </div>

          {/* Camada editorial de apoio compacta */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="font-mono text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
              CAMADA EDITORIAL &amp; GOVERNANCA DE MIDIA
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Canvas 2D e ondas trifasicas respondem ao estado do modulo sem bloquear a UI; o SVG garante nitidez vetorial em qualquer DPI e a Web Audio API gera retorno acustico imediato. As diretrizes fechadas do concurso permanecem isoladas em{" "}
              <a href="/concurso-artistas" className="font-semibold underline">
                /concurso-artistas
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
