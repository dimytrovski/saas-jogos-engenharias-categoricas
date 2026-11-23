"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Lock,
  ShieldCheck,
  Sparkles,
  Unlock,
  Volume2,
  Waves
} from "lucide-react";
import { cn } from "@/lib/cn";

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

const PHI = 1.61803398875;

function playNativeCue(freq: number, kind: "pulse" | "trunk" | "lock") {
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

    if (kind === "trunk") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.24);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.78);
      gain.gain.setValueAtTime(0.11, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.82);
    } else {
      osc.type = kind === "lock" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * PHI, now + 0.16);
      gain.gain.setValueAtTime(0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.2);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.85);
    setTimeout(() => ctx.close().catch(() => {}), 950);
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
  const [mode, setMode] = useState<"2d" | "svg" | "wave">("2d");
  const [gainPct, setGainPct] = useState(75);
  const [sessionToken, setSessionToken] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const t0 = performance.now();

    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.4;
      const amp = (12 + (chargePct / 100) * 24) * (gainPct / 100);

      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(cx, cy * 0.8, 6, cx, cy, r * 1.3);
      g.addColorStop(0, mode === "wave" ? "#13315c" : "#0b192c");
      g.addColorStop(1, "#030711");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const palette = ["rgba(239,68,68,0.7)", "rgba(245,158,11,0.7)", "rgba(56,189,248,0.7)"];
      palette.forEach((strokeCol, idx) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 5) {
          const nx = (x - cx) / (w * 0.5);
          const y =
            cy +
            Math.sin(x * 0.036 - t * 3.1 + (idx * Math.PI * 2) / 3) *
              amp *
              Math.exp(-nx * nx);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = mode === "wave" ? 2.6 : 1.7;
        ctx.stroke();
      });

      ctx.strokeStyle = licenseActive ? "#2dd4bf" : "#f59e0b";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.12, r * 0.24, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 5.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.04);
      ctx.quadraticCurveTo(cx + Math.sin(t * 3.4) * r * 0.14, cy + r * 0.36, cx, cy + r * 0.6);
      ctx.stroke();

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [mode, chargePct, gainPct, licenseActive]);

  const issueRuntimeToken = async () => {
    try {
      const res = await fetch("/api/license-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue", moduleCode })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.token) setSessionToken(String(data.token));
      }
    } catch {
      // Background silencioso
    }
  };

  const triggerStep = async (delta: number, kind: "pulse" | "trunk" | "lock", href?: string) => {
    if (soundEnabled) playNativeCue(kind === "lock" ? 440 : 220, kind);
    if (delta > 0) onChargeDelta(delta);
    onLogEvent("", false);

    if (kind === "lock") {
      await issueRuntimeToken();
    }

    if (rootRef.current) {
      rootRef.current.dataset.tokenReady = sessionToken ? "1" : "0";
      rootRef.current.dispatchEvent(
        new CustomEvent("cerro:media-step", {
          bubbles: true,
          detail: { moduleCode, discipline, chargePct, sdlcProgress, kind }
        })
      );
    }

    if (href) {
      window.location.assign(href);
    }
  };

  const qs = `mod=&disc=&carga=`;

  return (
    <section
      ref={rootRef}
      data-mod={moduleCode}
      data-disc={discipline}
      data-charge={chargePct}
      data-sdlc={sdlcProgress}
      data-lic={licenseActive ? "1" : "0"}
      data-has-token={sessionToken ? "1" : "0"}
      className="cerro-glass-panel p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {licenseActive ? (
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          ) : (
            <Lock className="h-4 w-4 text-amber-400" />
          )}
          <div className="h-2.5 w-28 overflow-hidden rounded-full bg-slate-900">
            <div className="cerro-meter-fill" style={{ width: `%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="2d"
            onClick={() => {
              setMode("2d");
              triggerStep(0, "pulse");
            }}
            className={cn(
              "cerro-action-btn h-8 w-10",
              mode === "2d" ? "bg-teal-400 text-slate-950" : "border border-slate-700 bg-slate-900/80 text-slate-300"
            )}
          >
            <Activity className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="svg"
            onClick={() => {
              setMode("svg");
              triggerStep(0, "pulse");
            }}
            className={cn(
              "cerro-action-btn h-8 w-10",
              mode === "svg" ? "bg-teal-400 text-slate-950" : "border border-slate-700 bg-slate-900/80 text-slate-300"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="wave"
            onClick={() => {
              setMode("wave");
              triggerStep(0, "pulse");
            }}
            className={cn(
              "cerro-action-btn h-8 w-10",
              mode === "wave" ? "bg-teal-400 text-slate-950" : "border border-slate-700 bg-slate-900/80 text-slate-300"
            )}
          >
            <Waves className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-12 lg:items-center">
        <div className="cerro-vector-stage relative mx-auto flex h-[256px] w-[256px] items-center justify-center lg:col-span-5">
          <canvas ref={canvasRef} width={248} height={248} className="h-[248px] w-[248px]" />
          {mode === "svg" && (
            <svg viewBox="0 0 248 248" className="pointer-events-none absolute inset-0 h-full w-full">
              <circle
                cx="124"
                cy="124"
                r="106"
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="1.5"
                strokeDasharray="7 5"
              />
              <polygon
                points="124,24 210,174 38,174"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.2"
                opacity="0.65"
              />
            </svg>
          )}
        </div>

        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <input
              type="range"
              min={15}
              max={100}
              value={gainPct}
              aria-label="gain"
              onChange={(e) => setGainPct(Number(e.target.value))}
              className="w-full accent-teal-400"
            />
            <div className="cerro-meter-track mt-3">
              <div className="cerro-meter-fill" style={{ width: `%` }} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            <button
              type="button"
              aria-label="pulse"
              onClick={() => triggerStep(5, "pulse")}
              className="cerro-action-btn h-11 border border-sky-400/40 bg-sky-500/15 text-sky-300"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="trunk"
              onClick={() => triggerStep(10, "trunk")}
              className="cerro-action-btn h-11 border border-amber-400/40 bg-amber-500/15 text-amber-300"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <a
              href={`/concurso-artistas?`}
              aria-label="vault"
              onClick={(e) => {
                e.preventDefault();
                triggerStep(0, "lock", `/concurso-artistas?`);
              }}
              className="cerro-action-btn h-11 border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
            >
              <Unlock className="h-4 w-4" />
            </a>
            <a
              href={`/receita?`}
              aria-label="revenue"
              onClick={(e) => {
                e.preventDefault();
                triggerStep(0, "pulse", `/receita?`);
              }}
              className="cerro-action-btn h-11 border border-teal-400/40 bg-teal-500/15 text-teal-300"
            >
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}