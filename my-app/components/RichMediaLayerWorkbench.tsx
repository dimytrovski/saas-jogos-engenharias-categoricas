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

function playAcousticCue(freqBase: number, mode: "elephant" | "pulse" | "lock") {
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
    const gain = ctx.createGain();

    if (mode === "elephant") {
      oscA.type = "sawtooth";
      oscA.frequency.setValueAtTime(140, now);
      oscA.frequency.exponentialRampToValueAtTime(345, now + 0.25);
      oscA.frequency.exponentialRampToValueAtTime(165, now + 0.85);
      oscB.type = "triangle";
      oscB.frequency.setValueAtTime(280, now);
      oscB.frequency.exponentialRampToValueAtTime(690, now + 0.25);
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(620, now);
      filter.Q.setValueAtTime(3.0, now);
      gain.gain.setValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.9);
    } else if (mode === "lock") {
      oscA.type = "sine";
      oscA.frequency.setValueAtTime(freqBase, now);
      oscA.frequency.exponentialRampToValueAtTime(freqBase * 1.5, now + 0.2);
      oscB.type = "triangle";
      oscB.frequency.setValueAtTime(freqBase * 2, now);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, now);
      gain.gain.setValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.25);
    } else {
      oscA.type = "sine";
      oscA.frequency.setValueAtTime(freqBase, now);
      oscA.frequency.exponentialRampToValueAtTime(freqBase * 1.18, now + 0.14);
      oscB.type = "sine";
      oscB.frequency.setValueAtTime(freqBase * PHI, now);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1500, now);
      gain.gain.setValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);
    }

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.92);
    oscB.stop(now + 0.92);
    setTimeout(() => ctx.close().catch(() => {}), 1000);
  } catch {
    // Sem acao
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
  const [shaderIntensity, setShaderIntensity] = useState(75);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const t0 = performance.now();

    const render = (now: number) => {
      const t = (now - t0) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const rOuter = Math.min(w, h) * 0.4;
      const rInner = rOuter / PHI;
      const energy = Math.max(0.1, chargePct / 100);
      const gain = shaderIntensity / 100;

      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createRadialGradient(cx, cy * 0.8, rOuter * 0.1, cx, cy, rOuter * 1.25);
      bg.addColorStop(0, layerMode === "shader_wave_field" ? "#0f2947" : "#0b192c");
      bg.addColorStop(0.75, "#060d18");
      bg.addColorStop(1, "#03060c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const phases = [
        { color: "rgba(239, 68, 68, 0.65)", shift: 0 },
        { color: "rgba(245, 158, 11, 0.65)", shift: (Math.PI * 2) / 3 },
        { color: "rgba(56, 189, 248, 0.65)", shift: (Math.PI * 4) / 3 }
      ];

      phases.forEach((ph) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 5) {
          const normX = (x - cx) / (w * 0.5);
          const amp = (14 + energy * 24) * gain * Math.exp(-normX * normX * 1.2);
          const y = cy + Math.sin(x * 0.032 - t * (2.6 + energy * 3.8) + ph.shift) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = ph.color;
        ctx.lineWidth = layerMode === "shader_wave_field" ? 2.6 : 1.7;
        ctx.stroke();
      });

      ctx.strokeStyle = licenseActive ? "#2dd4bf" : "#f59e0b";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const u = rOuter * 0.42;
      ctx.fillStyle = energy >= 0.7 ? "rgba(45, 212, 191, 0.24)" : "rgba(30, 58, 95, 0.38)";
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy - u * 0.15, u * 0.48, u * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#fbbf24";
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

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [layerMode, chargePct, licenseActive, shaderIntensity]);

  const runCue = (mode: "elephant" | "pulse" | "lock") => {
    if (soundEnabled) playAcousticCue(mode === "lock" ? 440 : 220, mode);
    if (mode === "elephant") {
      onChargeDelta(10);
      onLogEvent(`3F +10% · `, false);
    } else if (mode === "lock") {
      onLogEvent(`AUDIO LICENCA · `, false);
    } else {
      onChargeDelta(5);
      onLogEvent(`ONDA % · +5% 3F`, false);
    }
  };

  return (
    <section className="cerro-glass-panel p-5">
      {/* Cabecalho visual em badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="cerro-chip-tag text-teal-300">{moduleCode}</span>
          <span className="cerro-chip-tag text-sky-300">{discipline}</span>
          <span className="cerro-chip-tag text-amber-300">3F {chargePct}%</span>
          <span className="cerro-chip-tag text-emerald-300">SDLC {sdlcProgress}%</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["2d_3f_canvas", "Canvas 2D"],
              ["svg_vector_grid", "Vetor SVG"],
              ["shader_wave_field", "Onda 3F"]
            ] as [MediaLayerMode, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayerMode(key)}
              className={
                layerMode === key
                  ? "cerro-action-btn bg-teal-400 px-3 py-1.5 font-mono text-xs text-slate-950"
                  : "cerro-action-btn border border-slate-700 bg-slate-900/80 px-3 py-1.5 font-mono text-xs text-slate-300"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grade visual: Palco grafico + Controles diretos */}
      <div className="mt-4 grid gap-5 lg:grid-cols-12 lg:items-center">
        <div className="cerro-vector-stage relative mx-auto flex h-[272px] w-[272px] items-center justify-center lg:col-span-5">
          <canvas ref={canvasRef} width={264} height={264} className="h-[264px] w-[264px]" />
          {svgOverlay && (
            <svg
              viewBox="0 0 264 264"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <circle
                cx="132"
                cy="132"
                r="114"
                fill="none"
                stroke="rgba(45, 212, 191, 0.35)"
                strokeWidth="1.2"
                strokeDasharray="6 5"
              />
              <text
                x="16"
                y="24"
                fill="#5eead4"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="700"
              >
                PHI 1.618
              </text>
              <text
                x="248"
                y="24"
                textAnchor="end"
                fill={licenseActive ? "#34d399" : "#fbbf24"}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="700"
              >
                {licenseActive ? "ATIVO" : "PENDENTE"}
              </text>
            </svg>
          )}
        </div>

        <div className="space-y-4 lg:col-span-7">
          {/* Medidor visual de onda/carga */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3.5">
            <div className="mb-2 flex items-center justify-between font-mono text-xs">
              <span className="text-slate-300">GANHO DE ONDA 3F</span>
              <span className="font-bold text-teal-300">{shaderIntensity}%</span>
            </div>
            <input
              type="range"
              min={15}
              max={100}
              value={shaderIntensity}
              onChange={(e) => setShaderIntensity(Number(e.target.value))}
              className="w-full accent-teal-400"
            />
            <div className="cerro-meter-track mt-2.5">
              <div className="cerro-meter-fill" style={{ width: `%` }} />
            </div>
          </div>

          {/* Botoes visuais de acao rapida */}
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSvgOverlay((v) => !v)}
              className="cerro-action-btn border border-teal-400/35 bg-teal-400/10 px-3 py-2 text-xs text-teal-200"
            >
              <span>SVG {svgOverlay ? "ON" : "OFF"}</span>
            </button>
            <button
              type="button"
              onClick={() => runCue("pulse")}
              className="cerro-action-btn border border-sky-400/35 bg-sky-400/10 px-3 py-2 text-xs text-sky-200"
            >
              <span>Pulso +5%</span>
            </button>
            <button
              type="button"
              onClick={() => runCue("lock")}
              className="cerro-action-btn border border-emerald-400/35 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"
            >
              <span>Som Licença</span>
            </button>
            <button
              type="button"
              onClick={() => runCue("elephant")}
              className="cerro-action-btn border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-xs text-amber-200"
            >
              <span>Trombeta +10%</span>
            </button>
          </div>

          {/* Atalho visual limpo para a sala fechada do concurso */}
          <div className="flex items-center justify-between rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-2.5">
            <span className="font-mono text-[11px] font-semibold text-amber-200">
              CONCURSO &amp; JORNAIS IA (FECHADO)
            </span>
            <a
              href="/concurso-artistas"
              className="cerro-action-btn bg-amber-400 px-3 py-1 font-mono text-[11px] text-slate-950"
            >
              Abrir Cofre &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
