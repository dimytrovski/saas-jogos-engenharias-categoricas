"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type DeliveryMode = "disco_console" | "streaming_nuvem" | "hibrido";
export type SdlcStage =
  | "Planejamento & Escopo"
  | "Build & Empacotamento"
  | "Verificacao de Protocolos"
  | "Licenca Ativa em Producao";

export interface RawEngineeringSample {
  sampleRateHz: number;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  rawTelemetryFrame: string;
  payloadJson: string;
}

export interface EngineeringGameNode {
  id: string;
  code: string;
  title: string;
  discipline: string;
  realWorldProblem: string;
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
  rawSample: RawEngineeringSample;
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

function renderMediaArt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  node: EngineeringGameNode,
  mode: DeliveryMode,
  t: number,
  isMini: boolean
) {
  const lower = node.discipline.toLowerCase();

  // Fundo escuro de instrumentacao tecnica com gradiente sutil
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#050811");
  bg.addColorStop(0.55, "#091120");
  bg.addColorStop(1, "#060a14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Malha de engenharia de precisao
  const step = isMini ? 16 : 24;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Arte eletronica especifica por dominio de engenharia
  if (lower.includes("eletrica") || lower.includes("energia")) {
    const baseY = h * 0.56;
    const amp = isMini ? 14 : 30;
    // Tres fases senoidais defasadas (120 graus)
    const phases = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
    const colors = ["#2dd4bf", "#38bdf8", "#f59e0b"];

    phases.forEach((ph, idx) => {
      ctx.beginPath();
      for (let x = 8; x < w - 8; x += 3) {
        const norm = x / Math.max(1, w - 16);
        const y =
          baseY +
          Math.sin(norm * Math.PI * (isMini ? 3 : 5) - t * 2.4 + ph) * amp * Math.sin(norm * Math.PI);
        if (x === 8) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = colors[idx];
      ctx.lineWidth = isMini ? 1.5 : 2.2;
      ctx.stroke();
    });

    // Barramento e pico de transiente
    const pulseX = 16 + (((Math.sin(t * 1.5) + 1) / 2) * Math.max(1, w - 32));
    ctx.fillStyle = "rgba(45, 212, 191, 0.16)";
    ctx.beginPath();
    ctx.arc(pulseX, baseY, isMini ? 6 : 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (lower.includes("civil") || lower.includes("estrutural")) {
    // Trelica estrutural sob carga dinamica e mapa de tensao
    const padX = isMini ? 14 : 36;
    const topY = isMini ? 22 : 44;
    const botY = isMini ? h - 22 : h - 42;
    const bays = isMini ? 4 : 6;
    const span = (w - padX * 2) / bays;
    const deflection = Math.sin(t * 2.0) * (isMini ? 3 : 8);

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = isMini ? 1.5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(padX, botY);
    ctx.lineTo(w - padX, botY);
    ctx.stroke();

    for (let i = 0; i < bays; i++) {
      const x1 = padX + i * span;
      const x2 = x1 + span;
      const midX = (x1 + x2) / 2;
      const midY = topY + deflection * Math.sin(((i + 0.5) / bays) * Math.PI);

      ctx.strokeStyle = i % 2 === 0 ? "#38bdf8" : "#2dd4bf";
      ctx.lineWidth = isMini ? 1.5 : 2;
      ctx.beginPath();
      ctx.moveTo(x1, botY);
      ctx.lineTo(midX, midY);
      ctx.lineTo(x2, botY);
      ctx.lineTo(midX, midY);
      ctx.stroke();

      // Vetor de carga vertical
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(midX, Math.max(8, midY - (isMini ? 8 : 16)));
      ctx.lineTo(midX, midY);
      ctx.stroke();
    }
  } else if (lower.includes("mecanica") || lower.includes("controle")) {
    // Escoamento turbulento em duto + malha de controle
    const ductTop = isMini ? 24 : 46;
    const ductBot = isMini ? h - 24 : h - 46;
    const midY = (ductTop + ductBot) / 2;

    ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
    ctx.lineWidth = isMini ? 1.5 : 2;
    ctx.strokeRect(12, ductTop, Math.max(20, w - 24), Math.max(16, ductBot - ductTop));

    const particles = isMini ? 10 : 22;
    for (let i = 0; i < particles; i++) {
      const u = ((t * 0.28 + i / particles) % 1 + 1) % 1;
      const px = 16 + u * Math.max(10, w - 32);
      const py =
        midY +
        Math.sin(u * Math.PI * 6 + t * 3 + i) * ((ductBot - ductTop) * 0.28);
      ctx.fillStyle = i % 3 === 0 ? "#f59e0b" : "#2dd4bf";
      ctx.beginPath();
      ctx.arc(px, py, isMini ? 2 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Malha distribuida de telemetria / nuvem / disco / streaming
    const cols = isMini ? 4 : 7;
    const rows = isMini ? 2 : 3;
    const gx = (w - 32) / Math.max(1, cols - 1);
    const gy = (h - 44) / Math.max(1, rows - 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = 16 + c * gx;
        const cy = 24 + r * gy;
        const active = ((Math.floor(t * 3 + r + c)) % 5) === 0;

        if (c < cols - 1) {
          ctx.strokeStyle = active ? "rgba(45, 212, 191, 0.55)" : "rgba(56, 189, 248, 0.18)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + gx, cy);
          ctx.stroke();
        }

        ctx.fillStyle = active ? "#2dd4bf" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(cx, cy, isMini ? 2.5 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Pacotes de entrega (Disco / Nuvem / Hibrido)
  const packetCount = mode === "hibrido" ? (isMini ? 4 : 8) : (isMini ? 2 : 5);
  for (let p = 0; p < packetCount; p++) {
    const prog = ((t * 0.22 + p / packetCount) % 1 + 1) % 1;
    const px = 12 + prog * Math.max(10, w - 24);
    const py = h - (isMini ? 10 : 18);
    ctx.fillStyle = p % 2 === 0 ? "#2dd4bf" : "#38bdf8";
    ctx.fillRect(px - 3, py - 2, 6, 4);
  }

  if (!isMini) {
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px monospace";
    ctx.fillText(
      `${node.code} · ${node.discipline.toUpperCase()} · ${deliveryLabel(mode).toUpperCase()}`,
      14,
      18
    );

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.fillText(
      `${node.rawSample.primaryMetricLabel}: ${node.rawSample.primaryMetricValue} | ${node.rawSample.secondaryMetricLabel}: ${node.rawSample.secondaryMetricValue} | SDLC ${node.sdlcProgress}%`,
      14,
      h - 28
    );
  }
}

function EngineeringMediaCanvas({
  node,
  mode,
  flowPulse,
  isMini = false
}: {
  node: EngineeringGameNode;
  mode: DeliveryMode;
  flowPulse: number;
  isMini?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let start = performance.now() - flowPulse * 350;

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      renderMediaArt(ctx, canvas.width, canvas.height, node, mode, elapsed, isMini);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [node, mode, flowPulse, isMini]);

  return (
    <canvas
      ref={canvasRef}
      width={isMini ? 320 : 760}
      height={isMini ? 116 : 240}
      className={
        isMini
          ? "h-28 w-full rounded-lg border border-slate-800 bg-slate-950"
          : "h-56 w-full rounded-xl border border-slate-800 bg-slate-950"
      }
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
  const [customPrice, setCustomPrice] = useState("189.00");
  const [autoCirculate, setAutoCirculate] = useState(true);
  const [flowPulse, setFlowPulse] = useState(0);
  const [lastMoveDir, setLastMoveDir] = useState<"left" | "right">("right");
  const [rawTab, setRawTab] = useState<"telemetry" | "json">("telemetry");
  const [eventLog, setEventLog] = useState<string[]>([
    `[SSR ${serverRenderedAt}] Deque carregado com ${initialDeque.length} modulos de Engenharia e dados brutos.`
  ]);

  const selectedNode = useMemo(
    () => deque.find((item) => item.id === selectedId) ?? deque[0] ?? null,
    [deque, selectedId]
  );

  const pushLog = (msg: string) => {
    const now = new Date().toLocaleTimeString("pt-BR");
    setEventLog((prev) => [`[${now}] ${msg}`, ...prev.slice(0, 12)]);
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

  useEffect(() => {
    if (!autoCirculate || deque.length <= 1) return;
    const timer = setInterval(() => {
      rotateDeque("front_to_rear", true);
    }, 3800);
    return () => clearInterval(timer);
  }, [autoCirculate, deque.length]);

  const insertNode = (end: "front" | "rear") => {
    const title = customTitle.trim() || `Planta Piloto ${customDiscipline} v3.1`;
    const price = Math.max(29.0, Number(customPrice) || 189.0);
    const id = `eng-${Date.now().toString(36)}`;
    const code = `ENG-${Math.floor(100 + Math.random() * 899)}`;

    const newNode: EngineeringGameNode = {
      id,
      code,
      title,
      discipline: customDiscipline,
      realWorldProblem:
        "Estabilidade dinamica, resposta em malha fechada e integridade de pacotes sob carga real.",
      stockUnits: 60,
      priceBrl: price,
      diskSizeGb: 21.4,
      cloudBitrateMbps: 16.5,
      sdlcProgress: 50,
      sdlcStage: "Build & Empacotamento",
      protocols: {
        hmacWebhook: true,
        streamTokenGating: true,
        chunkIntegritySha256: true,
        sessionLeaseSync: true
      },
      licenseActive: false,
      deliveryMode: activeDelivery,
      lastServerSync: new Date().toLocaleTimeString("pt-BR"),
      rawSample: {
        sampleRateHz: 1000,
        primaryMetricLabel: "Variavel Processo",
        primaryMetricValue: "98.42%",
        secondaryMetricLabel: "Latencia Loop",
        secondaryMetricValue: "4.2 ms",
        rawTelemetryFrame: `FRM|${code}|TS=${Date.now()}|V=230.4|I=18.7|CRC=0x9F4A`,
        payloadJson: JSON.stringify(
          {
            moduleCode: code,
            discipline: customDiscipline,
            delivery: activeDelivery,
            licenseModel: "production_perpetual_lease",
            protocols: ["HMAC-SHA256", "STREAM-TOKEN", "CHUNK-SHA256", "LEASE-SYNC"]
          },
          null,
          2
        )
      }
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
      {/* Cabecalho e controle do Deque */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-teal-500/15 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                SSR DINAMICO
              </span>
              <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                DEQUE (Double-Ended Queue)
              </span>
              <span className="rounded-md bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                DADOS BRUTOS &amp; ARTE DE MIDIA
              </span>
              <span className="text-xs text-zinc-500">SSR: {serverRenderedAt}</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Laboratorio de Circulacao em Deque: Simuladores de Engenharia, Estoque e Licenca SDLC
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Cada modulo circula entre FRONT e REAR, exibe arte tecnica animada do problema real de engenharia, expoe dados brutos e permite compra/download em Disco/Console, Streaming em Nuvem ou Hibrido com licenca de producao.
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

      {/* Trilho visual do Deque */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="rounded bg-zinc-900 px-2.5 py-1 text-white dark:bg-zinc-100 dark:text-zinc-950">
              FRONT
            </span>
            <span className="text-zinc-500">
              Deque Bidirecional ({deque.length} nos · {lastMoveDir === "right" ? "FRONT -> REAR" : "REAR -> FRONT"})
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
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isSelected
                    ? "border-teal-600 bg-teal-50/30 ring-2 ring-teal-600/30 dark:border-teal-400 dark:bg-teal-950/20"
                    : "border-zinc-200 bg-zinc-50/70 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/60"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
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

                <EngineeringMediaCanvas
                  node={node}
                  mode={node.deliveryMode}
                  flowPulse={flowPulse}
                  isMini={true}
                />

                <h2 className="mt-3 text-sm font-semibold leading-snug">{node.title}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{node.realWorldProblem}</p>

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

      {/* Bancada tecnica: Arte de Midia + Compra/Download + Dados Brutos + Protocolos */}
      {selectedNode && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs text-teal-700 dark:text-teal-400">
                  BANCADA DE DEMONSTRACAO · {selectedNode.code} · {selectedNode.rawSample.sampleRateHz} Hz
                </span>
                <h3 className="text-lg font-semibold">{selectedNode.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedNode.realWorldProblem} · Disco/Console: {selectedNode.diskSizeGb} GB · Nuvem: {selectedNode.cloudBitrateMbps} Mbps
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold tabular-nums">
                  {formatBrl(selectedNode.priceBrl)}
                </div>
                <div className="text-xs text-zinc-500">
                  Unidades em estoque: {selectedNode.stockUnits}
                </div>
              </div>
            </div>

            <EngineeringMediaCanvas
              node={selectedNode}
              mode={activeDelivery}
              flowPulse={flowPulse}
              isMini={false}
            />

            {/* Compra e download */}
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Comprar do Estoque do Servidor, Baixar e Garantir Licenca em Producao:
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

            {/* Dados brutos para recursos tecnicos */}
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Dados Brutos de Engenharia &amp; Telemetria:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setRawTab("telemetry")}
                    className={`rounded px-2 py-1 text-[11px] font-medium ${
                      rawTab === "telemetry"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    Frame Bruto
                  </button>
                  <button
                    type="button"
                    onClick={() => setRawTab("json")}
                    className={`rounded px-2 py-1 text-[11px] font-medium ${
                      rawTab === "json"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    Payload JSON
                  </button>
                </div>
              </div>

              <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-teal-300">
                {rawTab === "telemetry"
                  ? `${selectedNode.rawSample.rawTelemetryFrame}\nDELIVERY=${activeDelivery.toUpperCase()} | LICENSE=${selectedNode.licenseActive ? "ACTIVE_PROD" : "PENDING"} | SDLC=${selectedNode.sdlcProgress}%`
                  : selectedNode.rawSample.payloadJson}
              </pre>
            </div>

            {/* Protocolos auxiliares */}
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
            <div className="mt-3 max-h-120 space-y-2 overflow-y-auto pr-1 font-mono text-[11px]">
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
