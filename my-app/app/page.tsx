"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Cpu,
  HeartHandshake,
  Layers,
  Lock,
  Palette,
  Radio,
  ShieldCheck,
  TrendingUp
} from "lucide-react";

type SectionKey = "artists" | "lives" | "psychology" | "core";

interface PortalNode {
  id: string;
  href: string;
  code: string;
  section: SectionKey;
  accent: string;
  progress: number;
  gated?: boolean;
  rgb: string;
  glow: string;
  speed: number;
  icon: React.ComponentType<{ className?: string }>;
}

const PORTAL_NODES: PortalNode[] = [
  {
    id: "digital-artists-contests",
    href: "/concurso-artistas",
    code: "ART",
    section: "artists",
    accent: "border-amber-400/40 bg-amber-500/10 text-amber-300 hover:border-amber-400",
    progress: 82,
    gated: true,
    rgb: "251, 191, 36",
    glow: "rgba(251, 191, 36, 0.20)",
    speed: 1.05,
    icon: Palette
  },
  {
    id: "live-streams-hub",
    href: "/lives",
    code: "LIVE",
    section: "lives",
    accent: "border-rose-400/40 bg-rose-500/10 text-rose-300 hover:border-rose-400",
    progress: 90,
    rgb: "251, 113, 133",
    glow: "rgba(251, 113, 133, 0.22)",
    speed: 1.45,
    icon: Radio
  },
  {
    id: "ai-psychology-shield",
    href: "/psicologia-ia",
    code: "MIND",
    section: "psychology",
    accent: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400",
    progress: 88,
    rgb: "52, 211, 153",
    glow: "rgba(52, 211, 153, 0.18)",
    speed: 0.72,
    icon: HeartHandshake
  },
  {
    id: "deque-studio",
    href: "/deque-engenharias",
    code: "DEQUE",
    section: "core",
    accent: "border-teal-400/40 bg-teal-500/10 text-teal-300 hover:border-teal-400",
    progress: 100,
    rgb: "45, 212, 191",
    glow: "rgba(45, 212, 191, 0.22)",
    speed: 1.15,
    icon: Layers
  },
  {
    id: "hypermedia-deck",
    href: "/synstrom-deck/index.html",
    code: "DECK",
    section: "core",
    accent: "border-sky-400/40 bg-sky-500/10 text-sky-300 hover:border-sky-400",
    progress: 85,
    rgb: "56, 189, 248",
    glow: "rgba(56, 189, 248, 0.20)",
    speed: 1.1,
    icon: Cpu
  },
  {
    id: "revenue-stream",
    href: "/receita",
    code: "PASS",
    section: "core",
    accent: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400",
    progress: 90,
    rgb: "34, 211, 238",
    glow: "rgba(34, 211, 238, 0.19)",
    speed: 1.0,
    icon: TrendingUp
  },
  {
    id: "telemetry-core",
    href: "/dashboard",
    code: "CORE",
    section: "core",
    accent: "border-indigo-400/40 bg-indigo-500/10 text-indigo-300 hover:border-indigo-400",
    progress: 95,
    rgb: "129, 140, 248",
    glow: "rgba(129, 140, 248, 0.20)",
    speed: 1.25,
    icon: Activity
  }
];

interface FlowParticle {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  alpha: number;
}

function FlowFieldCanvas({
  rgb,
  speedMultiplier
}: {
  rgb: string;
  speedMultiplier: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef({ rgb, speedMultiplier });
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    themeRef.current = { rgb, speedMultiplier };
  }, [rgb, speedMultiplier]);

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
    let rafId = 0;
    let tick = 0;
    let isVisible = document.visibilityState === "visible";

    const particleCount = width < 640 ? 48 : 96;
    const particles: FlowParticle[] = [];

    const spawnParticle = (initial = false): FlowParticle => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const maxLife = 90 + Math.random() * 140;
      return {
        x,
        y,
        px: x,
        py: y,
        vx: 0,
        vy: 0,
        life: initial ? Math.random() * maxLife : 0,
        maxLife,
        alpha: 0.08 + Math.random() * 0.16
      };
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
    };

    resize();
    for (let i = 0; i < particleCount; i++) {
      particles.push(spawnParticle(true));
    }

    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    const onVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible && !reducedMotion && !rafId) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    const renderFrame = (stepOnce: boolean) => {
      tick += 0.0045 * themeRef.current.speedMultiplier;
      ctx.clearRect(0, 0, width, height);

      const { rgb: activeRgb, speedMultiplier } = themeRef.current;
      const ptr = pointerRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.px = p.x;
        p.py = p.y;

        const nx = p.x * 0.0024;
        const ny = p.y * 0.0024;
        const angle =
          Math.sin(nx * 2.1 + tick) * Math.cos(ny * 2.1 - tick * 0.8) * Math.PI * 1.45 +
          Math.sin((nx + ny) * 1.3 + tick * 0.5) * 0.65;

        let forceX = Math.cos(angle) * 0.85 * speedMultiplier;
        let forceY = Math.sin(angle) * 0.85 * speedMultiplier;

        if (ptr.active) {
          const dx = ptr.x - p.x;
          const dy = ptr.y - p.y;
          const distSq = dx * dx + dy * dy;
          const radius = 190;
          if (distSq > 1 && distSq < radius * radius) {
            const dist = Math.sqrt(distSq);
            const pull = (1 - dist / radius) * 0.55;
            const swirlX = -dy / dist;
            const swirlY = dx / dist;
            forceX += (dx / dist) * pull * 0.45 + swirlX * pull * 0.85;
            forceY += (dy / dist) * pull * 0.45 + swirlY * pull * 0.85;
          }
        }

        p.vx = p.vx * 0.86 + forceX * 0.14;
        p.vy = p.vy * 0.86 + forceY * 0.14;
        p.x += p.vx;
        p.y += p.vy;
        p.life += stepOnce ? 1 : 0.6;

        const fade = Math.sin(Math.min(p.life / p.maxLife, 1) * Math.PI);
        const strokeAlpha = Math.max(0, p.alpha * fade);

        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${activeRgb}, ${strokeAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();

        if (
          p.life >= p.maxLife ||
          p.x < -30 ||
          p.x > width + 30 ||
          p.y < -30 ||
          p.y > height + 30
        ) {
          particles[i] = spawnParticle(false);
        }
      }
    };

    const render = () => {
      rafId = 0;
      if (!isVisible) return;
      renderFrame(true);
      rafId = window.requestAnimationFrame(render);
    };

    renderFrame(false);
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

export default function SaaSRootPortal() {
  const [activeId, setActiveId] = useState<string>("digital-artists-contests");
  const activeNode = PORTAL_NODES.find((n) => n.id === activeId) || PORTAL_NODES[0];

  return (
    <main
      data-portal="synstrom-root"
      data-brand="SynStrom"
      data-bg-engine="flow-field-coupled"
      data-active-route={activeNode.href}
      data-active-code={activeNode.code}
      data-active-section={activeNode.section}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#040811] px-4 py-10 text-slate-100"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 18%, ${activeNode.glow} 0%, rgba(15, 36, 68, 0.42) 38%, rgba(4, 8, 17, 1) 76%)`
      }}
    >
      <FlowFieldCanvas rgb={activeNode.rgb} speedMultiplier={activeNode.speed} />

      <section
        className="relative z-10 w-full max-w-4xl rounded-3xl border border-sky-400/20 bg-slate-950/70 p-6 shadow-2xl transition-colors duration-300"
        style={{
          backdropFilter: "blur(14px) saturate(130%)",
          WebkitBackdropFilter: "blur(14px) saturate(130%)"
        }}
      >
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: `rgb(${activeNode.rgb})`,
                boxShadow: `0 0 12px rgba(${activeNode.rgb}, 0.85)`
              }}
            />
            <span className="font-mono text-xs font-semibold tracking-[0.28em] text-slate-200">
              SYNSTROM
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-sky-400 transition-all duration-300"
                style={{ width: `${activeNode.progress}%` }}
              />
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
        </header>

        <nav aria-label="root-navigation" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {PORTAL_NODES.map((node) => {
            const Icon = node.icon;
            const isSelected = node.id === activeId;

            return (
              <a
                key={node.id}
                href={node.href}
                aria-label={node.code}
                data-route={node.href}
                data-section={node.section}
                data-gated={node.gated ? "1" : "0"}
                onMouseEnter={() => setActiveId(node.id)}
                onFocus={() => setActiveId(node.id)}
                className={`group relative flex h-28 flex-col items-center justify-between rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-1 ${node.accent} ${
                  isSelected ? "ring-2 ring-teal-400/60" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest opacity-85">
                    {node.code}
                  </span>
                  {node.gated ? (
                    <Lock className="h-3.5 w-3.5 text-amber-400/90" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  )}
                </div>

                <Icon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110" />

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950/90">
                  <div
                    className="h-full bg-current opacity-80 transition-all duration-300"
                    style={{ width: `${node.progress}%` }}
                  />
                </div>
              </a>
            );
          })}
        </nav>

        <footer className="mt-6 flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-3">
          <span className="font-mono text-xs text-slate-400">{activeNode.href}</span>
          <a
            href={activeNode.href}
            aria-label="enter-active"
            data-target-route={activeNode.href}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal-400 px-4 font-mono text-xs font-semibold text-slate-950 transition-transform hover:scale-105"
          >
            <span>{activeNode.code}</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </footer>
      </section>
    </main>
  );
}