"use client";

import React, { useEffect, useRef, useState } from "react";

interface HypermediaModuleDeckProps {
  moduleCode: string;
  discipline: string;
  chargePct: number;
  sdlcProgress: number;
  licenseActive: boolean;
  soundEnabled: boolean;
  onChargeDelta: (delta: number) => void;
  onLogEvent: (msg: string, playElephant?: boolean) => void;
}

interface BackendModuleSpec {
  code: string;
  ruleSummary: string;
  missionRule: string;
  licenseRule: string;
  telemetryRule: string;
  clearanceLevel: string;
}

const PHI = 1.61803398875;

function emitHyperAudio(mode: "pulse" | "lock" | "trunk") {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (mode === "trunk") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.24);
      osc.frequency.exponentialRampToValueAtTime(170, now + 0.75);
      gain.gain.setValueAtTime(0.11, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.8);
    } else if (mode === "lock") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.18);
      gain.gain.setValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(220 * PHI, now + 0.15);
      gain.gain.setValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.82);
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    // Sem acao
  }
}

export default function HypermediaModuleDeck({
  moduleCode,
  discipline,
  chargePct,
  sdlcProgress,
  licenseActive,
  soundEnabled,
  onChargeDelta,
  onLogEvent
}: HypermediaModuleDeckProps) {
  const [layerMode, setLayerMode] = useState<"2d" | "svg" | "wave">("2d");
  const [waveGain, setWaveGain] = useState(75);
  const [accessKey, setAccessKey] = useState("CERRO-OP-2026");
  const [spec, setSpec] = useState<BackendModuleSpec | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const t0 = performance.now();

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.39;
      const ampBase = (12 + (chargePct / 100) * 22) * (waveGain / 100);

      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(cx, cy * 0.8, 8, cx, cy, r * 1.3);
      g.addColorStop(0, layerMode === "wave" ? "#102a43" : "#0b192c");
      g.addColorStop(1, "#040811");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const colors = ["rgba(239,68,68,0.68)", "rgba(245,158,11,0.68)", "rgba(56,189,248,0.68)"];
      colors.forEach((col, idx) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const norm = (x - cx) / (w * 0.5);
          const y = cy + Math.sin(x * 0.035 - t * 3 + (idx * Math.PI * 2) / 3) * ampBase * Math.exp(-norm * norm);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = col;
        ctx.lineWidth = layerMode === "wave" ? 2.5 : 1.6;
        ctx.stroke();
      });

      ctx.strokeStyle = licenseActive ? "#2dd4bf" : "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.12, r * 0.24, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.04);
      ctx.quadraticCurveTo(cx + Math.sin(t * 3.2) * r * 0.12, cy + r * 0.35, cx, cy + r * 0.58);
      ctx.stroke();

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [layerMode, chargePct, waveGain, licenseActive]);

  const dispatchHyperTransition = (targetHref: string, kind: "pulse" | "lock" | "trunk", delta: number) => {
    if (soundEnabled) emitHyperAudio(kind);
    if (delta > 0) onChargeDelta(delta);
    onLogEvent(` · `, false);

    if (hostRef.current) {
      hostRef.current.dataset.lastModule = moduleCode;
      hostRef.current.dataset.lastCharge = String(chargePct);
      hostRef.current.dispatchEvent(
        new CustomEvent("cerro:hyper-transition", {
          bubbles: true,
          detail: { moduleCode, kind, targetHref }
        })
      );
    }

    if (targetHref) {
      window.location.assign(targetHref);
    }
  };

  const inspectBackendRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/module-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey, moduleCode })
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setSpec(null);
        setAuthError(data.message || "Sem permissao.");
        return;
      }
      setSpec(data.spec);
      if (soundEnabled) emitHyperAudio("lock");
    } catch {
      setAuthError("Falha de conexao.");
    } finally {
      setUnlocking(false);
    }
  };

  const queryParams = `mod=&disc=&carga=`;

  return (
    <section
      ref={hostRef}
      data-module={moduleCode}
      data-charge={chargePct}
      className="cerro-glass-panel p-5"
    >
      {/* Barra superior compacta: apenas indicadores e modos de midia */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="cerro-chip-tag text-teal-300">{moduleCode}</span>
          <span className="cerro-chip-tag text-amber-300">3F {chargePct}%</span>
          <span className="cerro-chip-tag text-emerald-300">SDLC {sdlcProgress}%</span>
          <span className="cerro-chip-tag text-sky-300">
            {licenseActive ? "LIC ON" : "LIC OFF"}
          </span>
        </div>

        <div className="flex gap-1.5">
          {(
            [
              ["2d", "2D"],
              ["svg", "SVG"],
              ["wave", "ONDA"]
            ] as const
          ).map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setLayerMode(k)}
              className={
                layerMode === k
                  ? "cerro-action-btn bg-teal-400 px-3 py-1 font-mono text-xs text-slate-950"
                  : "cerro-action-btn border border-slate-700 bg-slate-900/80 px-3 py-1 font-mono text-xs text-slate-300"
              }
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Palco de hipermídia + gatilhos transitivos */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12 lg:items-center">
        <div className="cerro-vector-stage relative mx-auto flex h-[248px] w-[248px] items-center justify-center lg:col-span-5">
          <canvas ref={canvasRef} width={240} height={240} className="h-[240px] w-[240px]" />
          {layerMode === "svg" && (
            <svg
              viewBox="0 0 240 240"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <circle
                cx="120"
                cy="120"
                r="102"
                fill="none"
                stroke="rgba(45,212,191,0.45)"
                strokeWidth="1.4"
                strokeDasharray="6 5"
              />
              <text x="14" y="22" fill="#5eead4" fontSize="9" fontFamily="monospace" fontWeight="700">
                PHI 1.618
              </text>
            </svg>
          )}
        </div>

        <div className="space-y-3 lg:col-span-7">
          <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3">
            <div className="mb-1.5 flex justify-between font-mono text-[11px] text-slate-300">
              <span>GANHO</span>
              <span className="text-teal-300">{waveGain}%</span>
            </div>
            <input
              type="range"
              min={15}
              max={100}
              value={waveGain}
              onChange={(e) => setWaveGain(Number(e.target.value))}
              className="w-full accent-teal-400"
            />
            <div className="cerro-meter-track mt-2">
              <div className="cerro-meter-fill" style={{ width: `%` }} />
            </div>
          </div>

          {/* Gatilhos transitivos de hipermídia */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => dispatchHyperTransition("", "pulse", 5)}
              className="cerro-action-btn border border-sky-400/35 bg-sky-500/10 px-2.5 py-2 font-mono text-xs text-sky-200"
            >
              +5% 3F
            </button>
            <button
              type="button"
              onClick={() => dispatchHyperTransition("", "trunk", 10)}
              className="cerro-action-btn border border-amber-400/35 bg-amber-500/10 px-2.5 py-2 font-mono text-xs text-amber-200"
            >
              +10% 3F
            </button>
            <a
              href={`/concurso-artistas?`}
              onClick={(e) => {
                e.preventDefault();
                dispatchHyperTransition(`/concurso-artistas?`, "lock", 0);
              }}
              className="cerro-action-btn border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-2 font-mono text-xs text-emerald-200"
            >
              Cofre &rarr;
            </a>
            <a
              href={`/receita?`}
              onClick={(e) => {
                e.preventDefault();
                dispatchHyperTransition(`/receita?`, "pulse", 0);
              }}
              className="cerro-action-btn border border-teal-400/35 bg-teal-500/10 px-2.5 py-2 font-mono text-xs text-teal-200"
            >
              Receita &rarr;
            </a>
          </div>

          {/* Acesso validado no backend para inspecionar regras do modulo */}
          <form
            onSubmit={inspectBackendRules}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/75 p-2.5"
          >
            <input
              type="text"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              aria-label="Chave de operacao validada"
              className="min-w-[150px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-slate-100"
            />
            <button
              type="submit"
              disabled={unlocking}
              className="cerro-action-btn bg-amber-400 px-3 py-1.5 font-mono text-xs text-slate-950 disabled:opacity-50"
            >
              {unlocking ? "..." : "Regras (Backend)"}
            </button>
            {spec && (
              <button
                type="button"
                onClick={() => setSpec(null)}
                className="cerro-action-btn border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-slate-300"
              >
                Ocultar
              </button>
            )}
          </form>

          {authError && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 font-mono text-xs text-rose-200">
              {authError}
            </div>
          )}

          {spec && (
            <div className="space-y-1.5 rounded-xl border border-teal-400/35 bg-slate-950/90 p-3 font-mono text-xs text-slate-200">
              <div className="flex items-center justify-between text-[10px] font-bold text-teal-300">
                <span>{spec.code}</span>
                <span>{spec.clearanceLevel}</span>
              </div>
              <div>{spec.ruleSummary}</div>
              <div className="text-amber-200">{spec.missionRule}</div>
              <div className="text-sky-200">{spec.licenseRule}</div>
              <div className="text-emerald-200">{spec.telemetryRule}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
