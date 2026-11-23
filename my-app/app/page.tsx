"use client";

import React, { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Cpu,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from "lucide-react";

interface PortalNode {
  id: string;
  href: string;
  code: string;
  accent: string;
  progress: number;
  gated?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const PORTAL_NODES: PortalNode[] = [
  {
    id: "deque-studio",
    href: "/deque-engenharias",
    code: "DEQUE",
    accent: "border-teal-400/40 bg-teal-500/10 text-teal-300 hover:border-teal-400",
    progress: 100,
    icon: Layers
  },
  {
    id: "hypermedia-deck",
    href: "/synstrom-deck/index.html",
    code: "DECK",
    accent: "border-sky-400/40 bg-sky-500/10 text-sky-300 hover:border-sky-400",
    progress: 85,
    icon: Cpu
  },
  {
    id: "contest-vault",
    href: "/concurso-artistas",
    code: "VAULT",
    accent: "border-amber-400/40 bg-amber-500/10 text-amber-300 hover:border-amber-400",
    progress: 70,
    gated: true,
    icon: Sparkles
  },
  {
    id: "revenue-stream",
    href: "/receita",
    code: "PASS",
    accent: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400",
    progress: 90,
    icon: TrendingUp
  },
  {
    id: "telemetry-core",
    href: "/dashboard",
    code: "CORE",
    accent: "border-indigo-400/40 bg-indigo-500/10 text-indigo-300 hover:border-indigo-400",
    progress: 95,
    icon: Activity
  }
];

export default function SaaSRootPortal() {
  const [activeId, setActiveId] = useState<string>("deque-studio");
  const activeNode = PORTAL_NODES.find((n) => n.id === activeId) || PORTAL_NODES[0];

  return (
    <main
      data-portal="synstrom-root"
      data-brand="SynStrom"
      data-active-route={activeNode.href}
      data-active-code={activeNode.code}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#040811] px-4 py-10 text-slate-100"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 12%, rgba(19, 49, 92, 0.72) 0%, rgba(4, 8, 17, 1) 70%)"
      }}
    >
      <section
        className="w-full max-w-3xl rounded-3xl border border-sky-400/20 bg-slate-950/70 p-6 shadow-2xl"
        style={{
          backdropFilter: "blur(14px) saturate(130%)",
          WebkitBackdropFilter: "blur(14px) saturate(130%)"
        }}
      >
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.85)]" />
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
            <ShieldCheck className="h-4 w-4 text-emerald-400"/>
          </div>
        </header>

        <nav aria-label="root-navigation" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PORTAL_NODES.map((node) => {
            const Icon = node.icon;
            const isSelected = node.id === activeId;

            return (
              <a
                key={node.id}
                href={node.href}
                aria-label={node.code}
                data-route={node.href}
                data-gated={node.gated ? "1" : "0"}
                onMouseEnter={() => setActiveId(node.id)}
                onFocus={() => setActiveId(node.id)}
                className={`group relative flex h-28 flex-col items-center justify-between rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 ${node.accent} ${
                  isSelected ? "ring-2 ring-teal-400/60" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest opacity-80">
                    {node.code}
                  </span>
                  {node.gated ? (
                    <Lock className="h-3.5 w-3.5 text-amber-400/90"/>
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"/>
                  )}
                </div>

                <Icon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110"/>

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
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal-400 px-4 font-mono text-xs font-semibold text-slate-950 transition-transform hover:scale-105"
          >
            <span>{activeNode.code}</span>
            <ArrowUpRight className="h-4 w-4"/>
          </a>
        </footer>
      </section>
    </main>
  );
}