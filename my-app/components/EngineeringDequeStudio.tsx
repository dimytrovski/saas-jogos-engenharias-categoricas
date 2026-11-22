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

const PHI = 1.61803398875;

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

function playAcousticPulse(freqHz = 264, durationSec = 0.22) {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freqHz, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freqHz * PHI, ctx.currentTime + durationSec * 0.75);

    sub.type = "sine";
    sub.frequency.setValueAtTime(freqHz / PHI, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.075, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + durationSec);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    sub.start();
    osc.stop(ctx.currentTime + durationSec + 0.02);
    sub.stop(ctx.currentTime + durationSec + 0.02);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, (durationSec + 0.1) * 1000);
  } catch {
    // Ignora bloqueio antes de interacao
  }
}

function renderClosedAppIcon3D(
  ctx: CanvasRenderingContext2D,
  size: number,
  t: number,
  boostLevel: number,
  showGuides: boolean
) {
  // Proporcoes fechadas baseadas no raio de icone R e na razao aurea PHI
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = outerR / PHI;
  const safeR = outerR * 0.86;

  ctx.clearRect(0, 0, size, size);

  // Fundo escuro profundo do icone
  const bg = ctx.createRadialGradient(cx, cy * 0.85, outerR * 0.1, cx, cy, outerR * 1.15);
  bg.addColorStop(0, "#0f1c33");
  bg.addColorStop(0.65, "#070d19");
  bg.addColorStop(1, "#03060c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Moldura fechada de icone (squircle / circulo geometrico)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(45, 212, 191, 0.55)";
  ctx.lineWidth = Math.max(1.5, size * 0.008);
  ctx.stroke();

  // Anel de proporcao aurea (R / phi)
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  if (showGuides) {
    // Eixos geometricos e grade de construcao do icone
    ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - safeR, cy);
    ctx.lineTo(cx + safeR, cy);
    ctx.moveTo(cx, cy - safeR);
    ctx.lineTo(cx, cy + safeR);
    ctx.moveTo(cx - safeR * 0.707, cy - safeR * 0.707);
    ctx.lineTo(cx + safeR * 0.707, cy + safeR * 0.707);
    ctx.moveTo(cx + safeR * 0.707, cy - safeR * 0.707);
    ctx.lineTo(cx - safeR * 0.707, cy + safeR * 0.707);
    ctx.stroke();
  }

  // Recorte circular fechado para manter o emblema contido dentro do icone
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 2, 0, Math.PI * 2);
  ctx.clip();

  // Projecao 3D contida dentro do raio do icone
  const yaw = Math.sin(t * 1.1) * 0.2;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const pitch = 0.24;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const unit = safeR * 0.44;

  const project3D = (x: number, y: number, z: number) => {
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const y2 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;
    const persp = 4.5 / Math.max(2.2, 4.5 + z2);
    return {
      px: cx + x1 * unit * persp,
      py: cy + (y2 + 0.08) * unit * persp
    };
  };

  // Corpo 3D compacto e simetrico do elefante
  const rings = 10;
  const pts = 12;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.36)";
  ctx.lineWidth = Math.max(1, size * 0.0045);

  for (let i = 0; i <= rings; i++) {
    const u = (i / rings) * Math.PI;
    const bx = Math.cos(u) * 0.92 - 0.16;
    const rx = Math.sin(u) * 0.62;
    const rz = Math.sin(u) * 0.52;

    ctx.beginPath();
    for (let j = 0; j <= pts; j++) {
      const v = (j / pts) * Math.PI * 2;
      const p = project3D(bx, -Math.cos(v) * rx, Math.sin(v) * rz);
      if (j === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
  }

  // Cabeca geometrica
  const head = project3D(0.68, -0.18, 0.05);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = Math.max(1.2, size * 0.006);
  ctx.beginPath();
  ctx.arc(head.px, head.py, unit * 0.34, 0, Math.PI * 2);
  ctx.stroke();

  // Quatro apoios/patas proporcionais
  const legs = [
    [-0.58, 0.34, 0.3],
    [-0.58, 0.34, -0.3],
    [0.4, 0.34, 0.3],
    [0.4, 0.34, -0.3]
  ];
  legs.forEach(([lx, ly, lz]) => {
    const top = project3D(lx, ly - 0.14, lz);
    const bot = project3D(lx, ly + 0.42, lz);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
    ctx.lineWidth = Math.max(1.5, size * 0.009);
    ctx.beginPath();
    ctx.moveTo(top.px, top.py);
    ctx.lineTo(bot.px, bot.py);
    ctx.stroke();
  });

  // Tromba curva 3D turbinada por fiacao eletrica multifasica
  const trunkSteps = 22;
  const trunk: { x: number; y: number; z: number }[] = [];
  for (let s = 0; s <= trunkSteps; s++) {
    const k = s / trunkSteps;
    const tx = 0.92 + Math.sin(k * Math.PI * 0.85) * 0.48;
    const ty = -0.08 + k * 0.66 - Math.sin(k * Math.PI) * 0.12;
    const tz = 0.08 + Math.cos(k * Math.PI * 1.1) * 0.14;
    trunk.push({ x: tx, y: ty, z: tz });
  }

  ctx.strokeStyle = "#2dd4bf";
  ctx.lineWidth = Math.max(2.5, size * 0.017);
  ctx.beginPath();
  trunk.forEach((pt, idx) => {
    const p = project3D(pt.x, pt.y, pt.z);
    if (idx === 0) ctx.moveTo(p.px, p.py);
    else ctx.lineTo(p.px, p.py);
  });
  ctx.stroke();

  // Fiaca eletrica helicoidal envolvendo e turbinando a tromba
  const wires = [
    { color: "#f59e0b", offset: 0 },
    { color: "#38bdf8", offset: (Math.PI * 2) / 3 },
    { color: "#2dd4bf", offset: (Math.PI * 4) / 3 }
  ];

  wires.forEach((wire) => {
    ctx.strokeStyle = wire.color;
    ctx.lineWidth = Math.max(1.1, size * 0.0055);
    ctx.beginPath();
    trunk.forEach((pt, idx) => {
      const k = idx / trunkSteps;
      const rad = (0.11 - k * 0.045) * (1 + boostLevel * 0.1);
      const ang = k * Math.PI * 6 - t * (5 + boostLevel * 2) + wire.offset;
      const p = project3D(
        pt.x + Math.cos(ang) * rad * 0.35,
        pt.y + Math.sin(ang) * rad,
        pt.z + Math.sin(ang) * rad
      );
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.stroke();
  });

  // Pulsos de energia na extremidade da tromba
  const tip = trunk[trunk.length - 1];
  const tipP = project3D(tip.x, tip.y, tip.z);
  const sparks = 6;
  for (let i = 0; i < sparks; i++) {
    const phase = ((t * (1.8 + boostLevel * 0.45) + i / sparks) % 1 + 1) % 1;
    const ang = i * 1.05 + t * 2.4;
    const dist = phase * unit * 0.42;
    ctx.fillStyle = i % 2 === 0 ? "#2dd4bf" : "#f59e0b";
    ctx.beginPath();
    ctx.arc(
      tipP.px + Math.cos(ang) * dist,
      tipP.py + Math.sin(ang) * dist * 0.75,
      Math.max(1.6, size * 0.0085),
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

function CerroGradleIconCanvas({
  node,
  flowPulse,
  showGuides,
  sizePx
}: {
  node: EngineeringGameNode;
  flowPulse: number;
  showGuides: boolean;
  sizePx: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now() - flowPulse * 300;
    const boost = 1 + (flowPulse % 5) * 0.25 + (node.licenseActive ? 0.5 : 0);

    const loop = (now: number) => {
      const elapsed = (now - start) / 1000;
      renderClosedAppIcon3D(ctx, canvas.width, elapsed, boost, showGuides);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [node, flowPulse, showGuides, sizePx]);

  return (
    <canvas
      ref={canvasRef}
      width={sizePx}
      height={sizePx}
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
      className="mx-auto block rounded-2xl border border-slate-800 bg-slate-950 shadow-sm"
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
  const [customDiscipline, setCustomDiscipline] = useState("Engenharia de Software");
  const [customPrice, setCustomPrice] = useState("189.00");
  const [autoCirculate, setAutoCirculate] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [flowPulse, setFlowPulse] = useState(0);
  const [lastMoveDir, setLastMoveDir] = useState<"left" | "right">("right");
  const [rawTab, setRawTab] = useState<"telemetry" | "json">("telemetry");
  const [eventLog, setEventLog] = useState<string[]>([
    `[SSR ${serverRenderedAt}] Icone Cerro-Gradle em proporcao fechada (1:1, phi=1.618) ativo no Deque.`
  ]);

  const selectedNode = useMemo(
    () => deque.find((item) => item.id === selectedId) ?? deque[0] ?? null,
    [deque, selectedId]
  );

  const pushLog = (msg: string, acousticFreq?: number) => {
    const now = new Date().toLocaleTimeString("pt-BR");
    setEventLog((prev) => [`[${now}] ${msg}`, ...prev.slice(0, 12)]);
    if (soundEnabled && acousticFreq) {
      playAcousticPulse(acousticFreq, 0.22);
    }
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
          : "DEQUE: Circulacao REAR -> FRONT executada.",
        196
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
    const title = customTitle.trim() || `Cerro-Gradle ${customDiscipline} Node`;
    const price = Math.max(29.0, Number(customPrice) || 189.0);
    const id = `eng-${Date.now().toString(36)}`;
    const code = `ENG-${Math.floor(100 + Math.random() * 899)}`;

    const newNode: EngineeringGameNode = {
      id,
      code,
      title,
      discipline: customDiscipline,
      realWorldProblem:
        "Pipeline de compilacao, entrega em disco/nuvem e validacao de licenca em producao.",
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
        sampleRateHz: 4800,
        primaryMetricLabel: "Throughput Build",
        primaryMetricValue: "21.6k req/s",
        secondaryMetricLabel: "Latencia P99",
        secondaryMetricValue: "5.8 ms",
        rawTelemetryFrame: `RAW|${code}|ICON=CERRO-GRADLE|PHI=1.618|TRUNK_BUS=3F|CRC=9E2C`,
        payloadJson: JSON.stringify(
          {
            module: title,
            code,
            discipline: customDiscipline,
            iconRatio: "1:1_phi_1.618",
            delivery: activeDelivery,
            licenseModel: "production_enterprise"
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
    pushLog(`DEQUE ${end.toUpperCase()}: Inserido "${title}" (${code}).`, 293.66);
  };

  const removeEnd = (end: "front" | "rear") => {
    if (deque.length === 0) return;
    const target = end === "front" ? deque[0] : deque[deque.length - 1];
    const remaining = end === "front" ? deque.slice(1) : deque.slice(0, deque.length - 1);
    setDeque(remaining);
    if (selectedId === target.id) {
      setSelectedId(remaining[0]?.id ?? "");
    }
    pushLog(`DEQUE ${end.toUpperCase()}: Removido "${target.title}".`, 164.81);
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
          `COMPRA & DOWNLOAD [${deliveryLabel(mode)}]: "${item.title}" baixado. Estoque: ${nextStock}. Licenca producao ativa.`,
          329.63
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
        pushLog(`SDLC [${item.code}]: ${nextStage.pct}% (${nextStage.label}).`, 261.63);
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
        pushLog(`PROTOCOLO [${item.code}] ${key}: ${updatedVal ? "OK" : "CHECK"}.`, 246.94);
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
                ICONE FECHADO · PHI 1.618
              </span>
              <span className="text-xs text-zinc-500">SSR: {serverRenderedAt}</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Cerro-Gradle: Emblema em Proporcao Geometrica Fechada, Deque e Licenca SDLC
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Visual fechado em proporcoes geometricas ideais de icone de aplicativo, com fiacao eletrica 3D na tromba, retorno acustico, dados brutos e licenca de producao.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuides((g) => !g)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                showGuides
                  ? "border-teal-600 bg-teal-600/10 text-teal-700 dark:border-teal-400 dark:text-teal-300"
                  : "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {showGuides ? "Guias Geometricas: ON" : "Guias Geometricas: OFF"}
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((s) => !s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                soundEnabled
                  ? "border-sky-600 bg-sky-600/10 text-sky-700 dark:border-sky-400 dark:text-sky-300"
                  : "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {soundEnabled ? "Acustica: ON" : "Acustica: OFF"}
            </button>
            <button
              type="button"
              onClick={() => setAutoCirculate((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                autoCirculate
                  ? "border-teal-600 bg-teal-600/10 text-teal-700 dark:border-teal-400 dark:text-teal-300"
                  : "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {autoCirculate ? "Deque Auto: ON" : "Deque Auto: OFF"}
            </button>
            <button
              type="button"
              onClick={() => rotateDeque("rear_to_front")}
              className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              Girar &larr;
            </button>
            <button
              type="button"
              onClick={() => rotateDeque("front_to_rear")}
              className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              Girar &rarr;
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-zinc-800">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Ex.: Cerro-Gradle Core"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <select
            value={customDiscipline}
            onChange={(e) => setCustomDiscipline(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option>Engenharia de Software</option>
            <option>Engenharia Eletrica &amp; Energia</option>
            <option>Engenharia Civil &amp; Estrutural</option>
            <option>Engenharia Mecanica &amp; Controle</option>
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

      {/* Trilho Deque com icones fechados 1:1 */}
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

                <CerroGradleIconCanvas
                  node={node}
                  flowPulse={flowPulse}
                  showGuides={showGuides}
                  sizePx={164}
                />

                <h2 className="mt-3 text-center text-sm font-semibold leading-snug">
                  {node.title}
                </h2>
                <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {node.discipline}
                </p>

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

      {/* Bancada fechada de icone + Compra/Download + Dados Brutos + Protocolos + Logs */}
      {selectedNode && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs text-teal-700 dark:text-teal-400">
                  ICONE EM PROPORCAO FECHADA · {selectedNode.code} · PHI = 1.618
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

            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <CerroGradleIconCanvas
                node={selectedNode}
                flowPulse={flowPulse}
                showGuides={showGuides}
                sizePx={240}
              />
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => playAcousticPulse(264, 0.25)}
                  disabled={!soundEnabled}
                  className="rounded-md border border-teal-600/40 bg-teal-600/10 px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-600/20 disabled:opacity-40 dark:text-teal-300"
                >
                  Disparar Pulso Acustico
                </button>
                <span className="font-mono text-[11px] text-zinc-500">
                  {selectedNode.rawSample.primaryMetricLabel}: {selectedNode.rawSample.primaryMetricValue} · {selectedNode.rawSample.secondaryMetricLabel}: {selectedNode.rawSample.secondaryMetricValue}
                </span>
              </div>
            </div>

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
