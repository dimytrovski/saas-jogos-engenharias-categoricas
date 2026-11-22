"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type DeliveryMode = "disco_console" | "streaming_nuvem" | "hibrido";
export type SdlcStage =
  | "Planejamento & Escopo"
  | "Build & Empacotamento"
  | "Verificacao de Protocolos"
  | "Licenca Ativa em Producao";

export interface EngineeringGameNode {
  id: string;
  code: string;
  title: string;
  discipline: string;
  stockUnits: number;
  priceBrl: number;
  diskSizeGb: number;
  cloudBitrateMbps: number;
  sdlcProgress: number;
  sdlcStage: SdlcStage;
  protocols: {
    hmacWebhook: boolean;
    streamTokenGating: boolean;
    chunkIntegritySha256: boolean;
    sessionLeaseSync: boolean;
  };
  licenseActive: boolean;
  deliveryMode: DeliveryMode;
  lastServerSync: string;
}

interface EngineeringDequeStudioProps {
  initialDeque: EngineeringGameNode[];
  serverRenderedAt: string;
}

const SDLC_STAGES: { label: SdlcStage; pct: number }[] = [
  { label: "Planejamento & Escopo", pct: 25 },
  { label: "Build & Empacotamento", pct: 50 },
  { label: "Verificacao de Protocolos", pct: 75 },
  { label: "Licenca Ativa em Producao", pct: 100 }
];

function formatBrl(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function deliveryLabel(mode: DeliveryMode) {
  if (mode === "disco_console") return "Disco / Console Local";
  if (mode === "streaming_nuvem") return "Streaming em Nuvem";
  return "Hibrido (Disco + Nuvem)";
}

function EngineeringVisualThumb({ discipline }: { discipline: string }) {
  const lower = discipline.toLowerCase();

  if (lower.includes("eletrica") || lower.includes("energia") || lower.includes("rede")) {
    return (
      <svg viewBox="0 0 240 96" className="h-24 w-full rounded-lg bg-slate-950 p-2 text-teal-400">
        <rect x="12" y="16" width="52" height="64" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        <rect x="94" y="24" width="52" height="48" rx="6" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
        <rect x="176" y="16" width="52" height="64" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        <path d="M64 48 H94 M146 48 H176" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="120" cy="48" r="10" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="120" y="86" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
          SUBESTACAO &amp; CARGA 3F
        </text>
      </svg>
    );
  }

  if (lower.includes("civil") || lower.includes("estrutural")) {
    return (
      <svg viewBox="0 0 240 96" className="h-24 w-full rounded-lg bg-slate-950 p-2 text-sky-400">
        <line x1="16" y1="68" x2="224" y2="68" stroke="#475569" strokeWidth="2" />
        <path d="M24 68 L68 28 L120 56 L172 28 L216 68" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M68 28 L68 68 M120 56 L120 68 M172 28 L172 68" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="120" y="86" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
          TRELICA &amp; TENSAO ESTRUTURAL
        </text>
      </svg>
    );
  }

  if (lower.includes("mecanica") || lower.includes("controle")) {
    return (
      <svg viewBox="0 0 240 96" className="h-24 w-full rounded-lg bg-slate-950 p-2 text-emerald-400">
        <rect x="18" y="38" width="204" height="20" rx="10" fill="none" stroke="#334155" strokeWidth="2" />
        <path d="M24 48 Q60 22 96 48 T168 48 T216 48" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="120" cy="48" r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x="120" y="86" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
          ESCOAMENTO &amp; MALHA PID
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 96" className="h-24 w-full rounded-lg bg-slate-950 p-2 text-teal-400">
      <rect x="24" y="20" width="56" height="52" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="92" y="20" width="56" height="52" rx="6" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
      <rect x="160" y="20" width="56" height="52" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M80 46 H92 M148 46 H160" stroke="#f59e0b" strokeWidth="2" />
      <text x="120" y="86" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
        TELEMETRIA &amp; NUVEM DISTRIBUIDA
      </text>
    </svg>
  );
}

function SampleStreamCanvas({
  node,
  mode,
  flowPulse
}: {
  node: EngineeringGameNode;
  mode: DeliveryMode;
  flowPulse: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let phase = flowPulse * 0.4;

    const renderFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      phase += 0.045;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, w, h);

      // Grade tecnica de fundo
      ctx.strokeStyle = "rgba(148, 163, 184, 0.10)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Onda de simulacao / sinal do modulo
      ctx.beginPath();
      for (let x = 16; x < w - 16; x += 4) {
        const norm = (x - 16) / (w - 32);
        const wave =
          Math.sin(norm * Math.PI * 4 - phase) * 24 +
          Math.cos(norm * Math.PI * 2 + phase * 0.6) * 10;
        const y = h * 0.52 + wave;
        if (x === 16) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = node.licenseActive ? "#2dd4bf" : "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Pacotes circulando da origem (Servidor/Deque) para o destino (Disco/Nuvem)
      const packetCount = mode === "hibrido" ? 6 : 4;
      for (let i = 0; i < packetCount; i++) {
        const progress = ((phase * 0.14 + i / packetCount) % 1 + 1) % 1;
        const px = 28 + progress * (w - 56);
        const py =
          h * 0.52 +
          Math.sin(progress * Math.PI * 4 - phase) * 24 +
          Math.cos(progress * Math.PI * 2 + phase * 0.6) * 10;

        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? "#2dd4bf" : "#f59e0b";
        ctx.fill();
      }

      // Cabecalho de telemetria dentro da amostra
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 12px monospace";
      ctx.fillText(
        `AMOSTRA AO VIVO // ${node.code} · ${deliveryLabel(mode).toUpperCase()}`,
        16,
        22
      );

      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px monospace";
      ctx.fillText(
        `SDLC ${node.sdlcProgress}% (${node.sdlcStage}) · LICENCA: ${
          node.licenseActive ? "ATIVA PRODUCAO" : "PENDENTE"
        }`,
        16,
        h - 14
      );

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [node, mode, flowPulse]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={190}
      className="h-44 w-full rounded-xl border border-slate-800 bg-slate-950"
    />
  );
}

export default function EngineeringDequeStudio({
  initialDeque,
  serverRenderedAt
}: EngineeringDequeStudioProps) {
  const [deque, setDeque] = useState<EngineeringGameNode[]>(initialDeque);
  const [selectedId, setSelectedId] = useState<string>(initialDeque[0]?.id ?? "");
  const [activeDelivery, setActiveDelivery] = useState<DeliveryMode>("hibrido");
  const [customTitle, setCustomTitle] = useState("");
  const [customDiscipline, setCustomDiscipline] = useState("Engenharia de Controle");
  const [customPrice, setCustomPrice] = useState("149.90");
  const [autoCirculate, setAutoCirculate] = useState(true);
  const [flowPulse, setFlowPulse] = useState(0);
  const [lastMoveDir, setLastMoveDir] = useState<"left" | "right">("right");
  const [eventLog, setEventLog] = useState<string[]>([
    `[SSR ${serverRenderedAt}] Deque ativo com ${initialDeque.length} modulos de Engenharia e telemetria visual.`
  ]);

  const selectedNode = useMemo(
    () => deque.find((item) => item.id === selectedId) ?? deque[0] ?? null,
    [deque, selectedId]
  );

  const pushLog = (msg: string) => {
    const now = new Date().toLocaleTimeString("pt-BR");
    setEventLog((prev) => [`[${now}] ${msg}`, ...prev.slice(0, 11)]);
  };

  const rotateDeque = (direction: "front_to_rear" | "rear_to_front", silent = false) => {
    if (deque.length <= 1) return;
    setLastMoveDir(direction === "front_to_rear" ? "right" : "left");
    setFlowPulse((p) => p + 1);
    setDeque((prev) => {
      const copy = [...prev];
      if (direction === "front_to_rear") {
        const first = copy.shift()!;
        copy.push(first);
      } else {
        const last = copy.pop()!;
        copy.unshift(last);
      }
      return copy;
    });
    if (!silent) {
      pushLog(
        direction === "front_to_rear"
          ? "DEQUE: Circulacao FRONT -> REAR executada."
          : "DEQUE: Circulacao REAR -> FRONT executada."
      );
    }
  };

  // Circulacao continua fluida no Deque quando habilitada
  useEffect(() => {
    if (!autoCirculate || deque.length <= 1) return;
    const timer = setInterval(() => {
      rotateDeque("front_to_rear", true);
    }, 3600);
    return () => clearInterval(timer);
  }, [autoCirculate, deque.length]);

  const insertNode = (end: "front" | "rear") => {
    const title = customTitle.trim() || `Simulador ${customDiscipline} v2.4`;
    const price = Math.max(19.9, Number(customPrice) || 149.9);
    const id = `eng-${Date.now().toString(36)}`;
    const code = `ENG-${Math.floor(100 + Math.random() * 899)}`;

    const newNode: EngineeringGameNode = {
      id,
      code,
      title,
      discipline: customDiscipline,
      stockUnits: 45,
      priceBrl: price,
      diskSizeGb: 18.4,
      cloudBitrateMbps: 14.5,
      sdlcProgress: 25,
      sdlcStage: "Planejamento & Escopo",
      protocols: {
        hmacWebhook: true,
        streamTokenGating: true,
        chunkIntegritySha256: true,
        sessionLeaseSync: true
      },
      licenseActive: false,
      deliveryMode: activeDelivery,
      lastServerSync: new Date().toLocaleTimeString("pt-BR")
    };

    setFlowPulse((p) => p + 1);
    setDeque((prev) => (end === "front" ? [newNode, ...prev] : [...prev, newNode]));
    setSelectedId(id);
    setCustomTitle("");
    pushLog(`DEQUE ${end.toUpperCase()}: Inserido "${title}" (${code}) no servidor.`);
  };

  const removeEnd = (end: "front" | "rear") => {
    if (deque.length === 0) return;
    const target = end === "front" ? deque[0] : deque[deque.length - 1];
    const remaining = end === "front" ? deque.slice(1) : deque.slice(0, deque.length - 1);
    setDeque(remaining);
    if (selectedId === target.id) {
      setSelectedId(remaining[0]?.id ?? "");
    }
    pushLog(`DEQUE ${end.toUpperCase()}: Removido "${target.title}".`);
  };

  const purchaseAndDownload = (nodeId: string, mode: DeliveryMode) => {
    setFlowPulse((p) => p + 2);
    setDeque((prev) =>
      prev.map((item) => {
        if (item.id !== nodeId) return item;
        if (item.stockUnits <= 0) {
          pushLog(`ESTOQUE ESGOTADO para ${item.code}.`);
          return item;
        }
        const nextStock = item.stockUnits - 1;
        const nextProgress = Math.min(
          100,
          item.sdlcProgress === 100 ? 100 : Math.max(item.sdlcProgress + 25, 75)
        );
        const stageObj =
          nextProgress >= 100
            ? SDLC_STAGES[3]
            : nextProgress >= 75
              ? SDLC_STAGES[2]
              : SDLC_STAGES[1];

        pushLog(
          `COMPRA & DOWNLOAD [${deliveryLabel(mode)}]: "${item.title}" baixado. Estoque: ${nextStock}. Licenca producao ativa.`
        );

        return {
          ...item,
          stockUnits: nextStock,
          deliveryMode: mode,
          licenseActive: true,
          sdlcProgress: stageObj.pct,
          sdlcStage: stageObj.label,
          lastServerSync: new Date().toLocaleTimeString("pt-BR")
        };
      })
    );
  };

  const advanceSdlcStage = (nodeId: string) => {
    setFlowPulse((p) => p + 1);
    setDeque((prev) =>
      prev.map((item) => {
        if (item.id !== nodeId) return item;
        const currentIdx = SDLC_STAGES.findIndex((s) => s.label === item.sdlcStage);
        const nextStage =
          SDLC_STAGES[Math.min(SDLC_STAGES.length - 1, Math.max(0, currentIdx + 1))];
        const active = nextStage.pct === 100 || item.licenseActive;
        pushLog(`SDLC [${item.code}]: ${nextStage.pct}% (${nextStage.label}).`);
        return {
          ...item,
          sdlcStage: nextStage.label,
          sdlcProgress: nextStage.pct,
          licenseActive: active,
          lastServerSync: new Date().toLocaleTimeString("pt-BR")
        };
      })
    );
  };

  const toggleProtocol = (
    nodeId: string,
    key: keyof EngineeringGameNode["protocols"]
  ) => {
    setFlowPulse((p) => p + 1);
    setDeque((prev) =>
      prev.map((item) => {
        if (item.id !== nodeId) return item;
        const updatedVal = !item.protocols[key];
        pushLog(`PROTOCOLO [${item.code}] ${key}: ${updatedVal ? "OK" : "CHECK"}.`);
        return {
          ...item,
          protocols: {
            ...item.protocols,
            [key]: updatedVal
          }
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de controle */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-teal-500/15 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                SSR DINAMICO
              </span>
              <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Estrutura: DEQUE (Double-Ended Queue)
              </span>
              <span className="text-xs text-zinc-500">
                Renderizado no servidor: {serverRenderedAt}
              </span>
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Circulacao em Deque de Jogos de Engenharia, Estoque e Licenca SDLC
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Compre do estoque nos servidores e baixe em Disco/Console, Streaming em Nuvem ou Hibrido com licenca de producao monitorada pelo SDLC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoCirculate((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                autoCirculate
                  ? "border-teal-600 bg-teal-600/10 text-teal-700 dark:border-teal-400 dark:text-teal-300"
                  : "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {autoCirculate ? "Circulacao Continua: ON" : "Circulacao Continua: OFF"}
            </button>
            <button
              type="button"
              onClick={() => rotateDeque("rear_to_front")}
              className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              Girar &larr; (REAR &rarr; FRONT)
            </button>
            <button
              type="button"
              onClick={() => rotateDeque("front_to_rear")}
              className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              Girar &rarr; (FRONT &rarr; REAR)
            </button>
          </div>
        </div>

        {/* Insercao no FRONT ou REAR */}
        <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-zinc-800">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Ex.: Simulador de Rede Eletrica"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <select
            value={customDiscipline}
            onChange={(e) => setCustomDiscipline(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option>Engenharia de Controle</option>
            <option>Engenharia Estrutural</option>
            <option>Engenharia de Software</option>
            <option>Engenharia Eletrica</option>
            <option>Engenharia Mecanica</option>
          </select>
          <input
            type="text"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            placeholder="Preco BRL"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="button"
            onClick={() => insertNode("front")}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:text-zinc-950"
          >
            + Inserir no FRONT
          </button>
          <button
            type="button"
            onClick={() => insertNode("rear")}
            className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950/40"
          >
            + Inserir no REAR
          </button>
        </div>
      </section>

      {/* Trilho visual do Deque com diagramas SVG e circulacao */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="rounded bg-zinc-900 px-2.5 py-1 text-white dark:bg-zinc-100 dark:text-zinc-950">
              FRONT
            </span>
            <span className="text-zinc-500">
              Circulacao Bidirecional ({deque.length} nos · sentido {lastMoveDir === "right" ? "FRONT -> REAR" : "REAR -> FRONT"})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => removeEnd("front")}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Remover FRONT
            </button>
            <button
              type="button"
              onClick={() => removeEnd("rear")}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Remover REAR
            </button>
            <span className="rounded bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
              REAR
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {deque.map((node, idx) => {
            const isFront = idx === 0;
            const isRear = idx === deque.length - 1;
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={`${node.id}-${idx}`}
                onClick={() => setSelectedId(node.id)}
                className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                  isSelected
                    ? "border-teal-600 bg-teal-50/30 ring-2 ring-teal-600/30 dark:border-teal-400 dark:bg-teal-950/20"
                    : "border-zinc-200 bg-zinc-50/70 hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/60"
                }`}
              >
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-zinc-500">
                    #{idx + 1} · {node.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {isFront && (
                      <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
                        FRONT
                      </span>
                    )}
                    {isRear && (
                      <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-zinc-300 dark:text-zinc-950">
                        REAR
                      </span>
                    )}
                  </div>
                </div>

                <EngineeringVisualThumb discipline={node.discipline} />

                <h2 className="mt-3 text-sm font-semibold leading-snug">{node.title}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{node.discipline}</p>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold tabular-nums">{formatBrl(node.priceBrl)}</span>
                  <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                    Estoque: <strong>{node.stockUnits}</strong>
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span className="truncate pr-2">SDLC: {node.sdlcStage}</span>
                    <span className="font-semibold tabular-nums">{node.sdlcProgress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full bg-teal-600 transition-all duration-300 dark:bg-teal-400"
                      style={{ width: `${node.sdlcProgress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-2.5 text-[11px] dark:border-zinc-800">
                  <span
                    className={`font-semibold ${
                      node.licenseActive
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {node.licenseActive ? "Licenca Producao Ativa" : "Aguardando Compra"}
                  </span>
                  <span className="text-zinc-500">{deliveryLabel(node.deliveryMode)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Amostra visual animada + Compra/Download + SDLC + Protocolos + Logs */}
      {selectedNode && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs text-teal-700 dark:text-teal-400">
                  AMOSTRA DO MODULO SELECIONADO · {selectedNode.code}
                </span>
                <h3 className="text-lg font-semibold">{selectedNode.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Disco/Console: {selectedNode.diskSizeGb} GB · Streaming Nuvem: {selectedNode.cloudBitrateMbps} Mbps · Sincronia: {selectedNode.lastServerSync}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold tabular-nums">
                  {formatBrl(selectedNode.priceBrl)}
                </div>
                <div className="text-xs text-zinc-500">
                  Estoque no servidor: {selectedNode.stockUnits}
                </div>
              </div>
            </div>

            <SampleStreamCanvas
              node={selectedNode}
              mode={activeDelivery}
              flowPulse={flowPulse}
            />

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Modalidade de Download &amp; Garantia de Licenca em Producao:
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {(["disco_console", "streaming_nuvem", "hibrido"] as DeliveryMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setActiveDelivery(mode)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        activeDelivery === mode
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                      }`}
                    >
                      {deliveryLabel(mode)}
                    </button>
                  )
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => purchaseAndDownload(selectedNode.id, activeDelivery)}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:text-zinc-950"
                >
                  Comprar &amp; Baixar ({deliveryLabel(activeDelivery)})
                </button>
                <button
                  type="button"
                  onClick={() => advanceSdlcStage(selectedNode.id)}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  Avancar Estagio SDLC ({selectedNode.sdlcProgress}%)
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Protocolos Auxiliares (Clique para validar ou inspecionar):
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["hmacWebhook", "Assinatura HMAC de Webhook"],
                    ["streamTokenGating", "Gating de Stream Token"],
                    ["chunkIntegritySha256", "Integridade de Pacotes (Disco/Nuvem)"],
                    ["sessionLeaseSync", "Sincronizacao de Sessao Ativa"]
                  ] as [keyof EngineeringGameNode["protocols"], string][]
                ).map(([key, label]) => {
                  const ok = selectedNode.protocols[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleProtocol(selectedNode.id, key)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                        ok
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                      }`}
                    >
                      <span>{label}</span>
                      <span className="font-mono text-[11px] font-bold">
                        {ok ? "OK" : "CHECK"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold">Telemetria do Deque &amp; Licencas</h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Registro em tempo real da circulacao, compras e protocolos.
            </p>
            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1 font-mono text-[11px]">
              {eventLog.map((entry, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                >
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
