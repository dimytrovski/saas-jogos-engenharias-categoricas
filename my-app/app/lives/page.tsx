"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Cpu,
  KeyRound,
  Radio,
  ShieldCheck,
  Tv,
  Users
} from "lucide-react";

interface SpringNode {
  bx: number;
  by: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LiveChannelSlot {
  id: string;
  code: string;
  route: string;
  load: number;
  locked?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const LIVE_SLOTS: LiveChannelSlot[] = [
  {
    id: "stream-stage-01",
    code: "CH-01",
    route: "/synstrom-deck/index.html",
    load: 92,
    icon: Radio
  },
  {
    id: "partner-link-02",
    code: "PARTNER",
    route: "/receita",
    load: 84,
    icon: Users
  },
  {
    id: "external-cast-03",
    code: "CAST",
    route: "/dashboard",
    load: 78,
    icon: Tv
  },
  {
    id: "token-gate-04",
    code: "TOKEN",
    route: "/deque-engenharias",
    load: 88,
    locked: true,
    icon: KeyRound
  }
];

function MagneticSpringCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false, impulse: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cols = 0;
    let rows = 0;
    let nodes: SpringNode[] = [];
    let rafId = 0;
    let isVisible = document.visibilityState === "visible";

    const spacing = width < 640 ? 44 : 52;

    const buildGrid = () => {
      cols = Math.ceil(width / spacing) + 2;
      rows = Math.ceil(height / spacing) + 2;
      const offsetX = (width - (cols - 1) * spacing) / 2;
      const offsetY = (height - (rows - 1) * spacing) / 2;
      nodes = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = offsetX + c * spacing;
          const by = offsetY + r * spacing;
          nodes.push({ bx, by, x: bx, y: by, vx: 0, vy: 0 });
        }
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
    };

    resize();

    const onPointerMove = (e: PointerEvent) => {
      const prevX = pointerRef.current.x;
      const prevY = pointerRef.current.y;
      const delta = pointerRef.current.active
        ? Math.hypot(e.clientX - prevX, e.clientY - prevY)
        : 12;
      pointerRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
        impulse: Math.min(24, delta * 0.45)
      };
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
      pointerRef.current.impulse = 0;
    };

    const onVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible && !reducedMotion && !rafId) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    const stiffness = 0.065;
    const damping = 0.84;
    const magnetRadius = 185;

    const stepAndDraw = () => {
      ctx.clearRect(0, 0, width, height);
      const ptr = pointerRef.current;
      ptr.impulse *= 0.88;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        let ax = (n.bx - n.x) * stiffness;
        let ay = (n.by - n.y) * stiffness;

        if (ptr.active && !reducedMotion) {
          const dx = n.x - ptr.x;
          const dy = n.y - ptr.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0.01 && distSq < magnetRadius * magnetRadius) {
            const dist = Math.sqrt(distSq);
            const factor = (1 - dist / magnetRadius) * (1.35 + ptr.impulse * 0.04);
            const nx = dx / dist;
            const ny = dy / dist;
            // Repulsao magnetica radial + torque tangencial para efeito de corrente
            ax += nx * factor * 2.4 - ny * factor * 1.15;
            ay += ny * factor * 2.4 + nx * factor * 1.15;
          }
        }

        n.vx = (n.vx + ax) * damping;
        n.vy = (n.vy + ay) * damping;
        n.x += n.vx;
        n.y += n.vy;
      }

      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const a = nodes[idx];
          const disp = Math.min(1, Math.hypot(a.x - a.bx, a.y - a.by) / 28);

          if (c + 1 < cols) {
            const b = nodes[idx + 1];
            const alpha = 0.06 + disp * 0.28;
            ctx.strokeStyle = `rgba(251, 113, 133, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }

          if (r + 1 < rows) {
            const d = nodes[idx + cols];
            const alpha = 0.05 + disp * 0.24;
            ctx.strokeStyle = `rgba(244, 63, 94, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(d.x, d.y);
            ctx.stroke();
          }

          const dotRadius = 1.1 + disp * 2.1;
          ctx.fillStyle = `rgba(253, 164, 175, ${(0.12 + disp * 0.55).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(a.x, a.y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const render = () => {
      rafId = 0;
      if (!isVisible) return;
      stepAndDraw();
      rafId = window.requestAnimationFrame(render);
    };

    stepAndDraw();
    if (!reducedMotion && isVisible) {
      rafId = window.requestAnimationFrame(render);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}

export default function LivesStreamPortal() {
  const [selectedId, setSelectedId] = useState<string>("stream-stage-01");
  const current = LIVE_SLOTS.find((s) => s.id === selectedId) || LIVE_SLOTS[0];

  return (
    <main
      data-portal="synstrom-lives"
      data-brand="SynStrom"
      data-bg-engine="magnetic-spring-mesh"
      data-active-slot={current.code}
      data-active-route={current.route}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#06060d] px-4 py-10 text-slate-100"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 16%, rgba(244, 63, 94, 0.22) 0%, rgba(24, 10, 22, 0.55) 42%, rgba(6, 6, 13, 1) 78%)"
      }}
    >
      <MagneticSpringCanvas />

      <section
        className="relative z-10 w-full max-w-3xl rounded-3xl border border-rose-400/25 bg-slate-950/70 p-6 shadow-2xl"
        style={{
          backdropFilter: "blur(14px) saturate(130%)",
          WebkitBackdropFilter: "blur(14px) saturate(130%)"
        }}
      >
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <a
              href="/"
              aria-label="back-root"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition-colors hover:border-rose-400/50 hover:text-rose-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.9)]" />
            <span className="font-mono text-xs font-semibold tracking-[0.26em] text-slate-200">
              SYNSTROM // LIVE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-amber-300 transition-all duration-300"
                style={{ width: `${current.load}%` }}
              />
            </div>
            <ShieldCheck className="h-4 w-4 text-rose-400" />
          </div>
        </header>

        <nav aria-label="live-slots" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LIVE_SLOTS.map((slot) => {
            const Icon = slot.icon;
            const active = slot.id === selectedId;

            return (
              <button
                key={slot.id}
                type="button"
                aria-label={slot.code}
                data-slot={slot.code}
                data-route={slot.route}
                data-locked={slot.locked ? "1" : "0"}
                onMouseEnter={() => setSelectedId(slot.id)}
                onFocus={() => setSelectedId(slot.id)}
                onClick={() => setSelectedId(slot.id)}
                className={`group flex h-28 flex-col items-center justify-between rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 ${
                  active
                    ? "border-rose-400 bg-rose-500/15 text-rose-200 ring-2 ring-rose-400/50"
                    : "border-slate-800/90 bg-slate-900/55 text-slate-300 hover:border-rose-400/40"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest opacity-85">
                    {slot.code}
                  </span>
                  <Cpu className="h-3.5 w-3.5 opacity-60" />
                </div>

                <Icon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950/90">
                  <div
                    className="h-full bg-rose-400/85 transition-all duration-300"
                    style={{ width: `${slot.load}%` }}
                  />
                </div>
              </button>
            );
          })}
        </nav>

        <footer className="mt-6 flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-3">
          <span className="font-mono text-xs text-slate-400">{current.route}</span>
          <a
            href={current.route}
            aria-label="launch-slot"
            data-target-route={current.route}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-rose-400 px-4 font-mono text-xs font-semibold text-slate-950 transition-transform hover:scale-105"
          >
            <span>{current.code}</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </footer>
      </section>
    </main>
  );
}