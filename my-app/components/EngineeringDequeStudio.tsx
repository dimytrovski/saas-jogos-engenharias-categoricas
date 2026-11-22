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

// Sintese acustica limpa via Web Audio API (sem dependencia externa)
function playAcousticPulse(freqHz = 220, durationSec = 0.24) {
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
    osc.frequency.exponentialRampToValueAtTime(freqHz * 1.35, ctx.currentTime + durationSec * 0.7);

    sub.type = "sine";
    sub.frequency.setValueAtTime(freqHz * 0.5, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
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
    // Ignora caso o navegador bloqueie audio antes de gesto do usuario
  }
}

function renderCerroGradle3D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  boostLevel: number,
  isMini: boolean
) {
  // Projecao 3D isometrica com rotacao sutil
  const yaw = Math.sin(t * 0.9) * 0.22;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const pitch = 0.26;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const scale = isMini ? Math.min(w, h) * 0.26 : Math.min(w, h) * 0.34;
  const cx = w * (isMini ? 0.52 : 0.46);
  const cy = h * (isMini ? 0.58 : 0.56);

  const project3D = (x: number, y: number, z: number) => {
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const y2 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;
    const persp = 4.2 / Math.max(1.8, 4.2 + z2);
    return {
      px: cx + x1 * scale * persp,
      py: cy + y2 * scale * persp,
      depth: z2
    };
  };

  // Fundo escuro com grade espacial 3D
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#04070f");
  bg.addColorStop(0.5, "#081224");
  bg.addColorStop(1, "#050914");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
  ctx.lineWidth = 1;
  const gridStep = isMini ? 18 : 28;
  for (let gx = 0; gx <= w; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = 0; gy <= h; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  // Corpo estrutural do elefante em malha 3D (elipsoide + cabeca + patas + tromba energizada)
  const bodyRings = isMini ? 8 : 14;
  const ringPts = isMini ? 10 : 16;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.32)";
  ctx.lineWidth = isMini ? 1 : 1.3;

  for (let i = 0; i <= bodyRings; i++) {
    const u = (i / bodyRings) * Math.PI;
    const bx = Math.cos(u) * 1.15 - 0.15;
    const rx = Math.sin(u) * 0.78;
    const rz = Math.sin(u) * 0.66;

    ctx.beginPath();
    for (let j = 0; j <= ringPts; j++) {
      const v = (j / ringPts) * Math.PI * 2;
      const pt = project3D(bx, -Math.cos(v) * rx + 0.05, Math.sin(v) * rz);
      if (j === 0) ctx.moveTo(pt.px, pt.py);
      else ctx.lineTo(pt.px, pt.py);
    }
    ctx.stroke();
  }

  // Cabeca e orelhas estruturais 3D
  const headCenter = project3D(0.88, -0.22, 0.08);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = isMini ? 1.4 : 2;
  ctx.beginPath();
  ctx.arc(headCenter.px, headCenter.py, scale * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  // Quatro patas em coordenadas 3D
  const legs = [
    [-0.75, 0.45, 0.38],
    [-0.75, 0.45, -0.38],
    [0.52, 0.45, 0.38],
    [0.52, 0.45, -0.38]
  ];
  legs.forEach(([lx, ly, lz]) => {
    const top = project3D(lx, ly - 0.22, lz);
    const bot = project3D(lx, ly + 0.55, lz);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
    ctx.lineWidth = isMini ? 2 : 3.2;
    ctx.beginPath();
    ctx.moveTo(top.px, top.py);
    ctx.lineTo(bot.px, bot.py);
    ctx.stroke();
  });

  // Tromba curva 3D turbinada por fiacao eletrica multifasica
  const trunkSteps = isMini ? 16 : 28;
  const trunkPoints: { x: number; y: number; z: number }[] = [];
  for (let s = 0; s <= trunkSteps; s++) {
    const k = s / trunkSteps;
    const tx = 1.18 + Math.sin(k * Math.PI * 0.85) * 0.65;
    const ty = -0.1 + k * 0.88 - Math.sin(k * Math.PI) * 0.16;
    const tz = 0.12 + Math.cos(k * Math.PI * 1.2) * 0.18;
    trunkPoints.push({ x: tx, y: ty, z: tz });
  }

  // Nucleo da tromba
  ctx.strokeStyle = "#2dd4bf";
  ctx.lineWidth = isMini ? 3.5 : 6.5;
  ctx.beginPath();
  trunkPoints.forEach((pt, idx) => {
    const p = project3D(pt.x, pt.y, pt.z);
    if (idx === 0) ctx.moveTo(p.px, p.py);
    else ctx.lineTo(p.px, p.py);
  });
  ctx.stroke();

  // Tres cabos de fiacao eletrica helicoidais envolvendo e turbinando a tromba
  const wires = [
    { color: "#f59e0b", offset: 0 },
    { color: "#38bdf8", offset: (Math.PI * 2) / 3 },
    { color: "#2dd4bf", offset: (Math.PI * 4) / 3 }
  ];

  wires.forEach((wire) => {
    ctx.strokeStyle = wire.color;
    ctx.lineWidth = isMini ? 1.2 : 2;
    ctx.beginPath();
    trunkPoints.forEach((pt, idx) => {
      const k = idx / trunkSteps;
      const rad = (0.14 - k * 0.06) * (1 + boostLevel * 0.12);
      const ang = k * Math.PI * 6 - t * (5 + boostLevel * 2) + wire.offset;
      const wx = pt.x + Math.cos(ang) * rad * 0.4;
      const wy = pt.y + Math.sin(ang) * rad;
      const wz = pt.z + Math.sin(ang) * rad;
      const p = project3D(wx, wy, wz);
      if (idx === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    });
    ctx.stroke();
  });

  // Fagulhas / pulsos de energia disparando na ponta da tromba
  const tip = trunkPoints[trunkPoints.length - 1];
  const tipProj = project3D(tip.x, tip.y, tip.z);
  const sparkCount = isMini ? 4 : 9;
  for (let sp = 0; sp < sparkCount; sp++) {
    const phase = ((t * (1.8 + boostLevel * 0.5) + sp / sparkCount) % 1 + 1) % 1;
    const angle = sp * 0.75 + t * 2.2;
    const dist = phase * (isMini ? 16 : 36);
    const sx = tipProj.px + Math.cos(angle) * dist;
    const sy = tipProj.py + Math.sin(angle) * dist * 0.7;

    ctx.fillStyle = sp % 2 === 0 ? "#2dd4bf" : "#f59e0b";
    ctx.beginPath();
    ctx.arc(sx, sy, isMini ? 2 : 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!isMini) {
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 11px monospace";
    ctx.fillText(
      `CERRO-GRADLE 3D // FIACAO ELETRICA NA TROMBA · BUILD & PIPELINE SE ENGENHARIA DE SOFTWARE`,
      14,
      18
    );

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.fillText(
      `PULSO ACUSTICO HARMONICO · FASES 3F ATIVAS · TURBO=${boostLevel}x`,
      14,
      h - 14
    );
  }
}

function CerroGradleMediaCanvas({
  node,
  mode,
  flowPulse,
  soundEnabled,
  isMini = false
}: {
  node: EngineeringGameNode;
  mode: DeliveryMode;
  flowPulse: number;
  soundEnabled: boolean;
  isMini?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCerroGradle =
    node.title.toLowerCase().includes("cerro-gradle") ||
    node.discipline.toLowerCase().includes("software");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now() - flowPulse * 300;
    const boostLevel = 1 + (flowPulse % 5) * 0.25 + (node.licenseActive ? 0.5 : 0);

    const renderLoop = (now: number) => {
      const t = (now - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      if (isCerroGradle) {
        renderCerroGradle3D(ctx, w, h, t, boostLevel, isMini);
      } else {
        // Renderizacao tecnica padrao para demais engenharias no Deque
        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0, "#050811");
        bg.addColorStop(1, "#091222");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= w; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        ctx.beginPath();
        for (let x = 12; x < w - 12; x += 4) {
          const u = x / Math.max(1, w - 24);
          const y = h * 0.5 + Math.sin(u * Math.PI * 5 - t * 3) * (isMini ? 16 : 34);
          if (x === 12) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = node.licenseActive ? "#2dd4bf" : "#38bdf8";
        ctx.lineWidth = isMini ? 1.8 : 2.5;
        ctx.stroke();

        if (!isMini) {
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "600 11px monospace";
          ctx.fillText(
            `${node.code} · ${node.discipline.toUpperCase()} · ${deliveryLabel(mode).toUpperCase()}`,
            14,
            18
          );
        }
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [node, mode, flowPulse, isCerroGradle, isMini]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={isMini ? 320 : 760}
        height={isMini ? 124 : 250}
        className={
          isMini
            ? "h-30 w-full rounded-lg border border-slate-800 bg-slate-950"
            : "h-60 w-full rounded-xl border border-slate-800 bg-slate-950"
        }
      />
      {!isMini && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span>
            {isCerroGradle
              ? "Visual 3D: Fiaca eletrica energizando a tromba do elefante em rotacao espacial."
              : `Telemetria ativa em ${deliveryLabel(mode)}.`}
          </span>
          <button
            type="button"
            onClick={() => playAcousticPulse(isCerroGradle ? 264 : 220, 0.28)}
            disabled={!soundEnabled}
            className="rounded-md border border-teal-600/40 bg-teal-600/10 px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-600/20 disabled:opacity-40 dark:text-teal-300"
          >
            Disparar Pulso Acustico
          </button>
        </div>
      )}
    </div>
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
  const [flowPulse, setFlowPulse] = useState(0);
  const [lastMoveDir, setLastMoveDir] = useState<"left" | "right">("right");
  const [rawTab, setRawTab] = useState<"telemetry" | "json">("telemetry");
  const [eventLog, setEventLog] = useState<string[]>([
    `[SSR ${serverRenderedAt}] Deque ativo com Cerro-Gradle 3D, fiacao eletrica na tromba e dados brutos.`
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
        "Pipeline de compilacao, entrega de pacotes em disco/nuvem e validacao de licenca em producao.",
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
        primaryMetricValue: "19.2k req/s",
        secondaryMetricLabel: "Latencia P99",
        secondaryMetricValue: "6.4 ms",
        rawTelemetryFrame: `RAW|${code}|ENGINE=CERRO-GRADLE|BUS=3F_TURBO|HMAC=OK|CRC=7B91`,
        payloadJson: JSON.stringify(
          {
            module: title,
            code,
            discipline: customDiscipline,
            delivery: activeDelivery,
            licenseModel: "production_enterprise",
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
                3D + FIACAO ELETRICA + ACUSTICA
              </span>
              <span className="text-xs text-zinc-500">SSR: {serverRenderedAt}</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Cerro-Gradle: Circulacao em Deque, Fiaca Eletrica 3D e Licenca SDLC para Engenharia de Software
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Modelagem 3D com fiacao eletrica energizando a tromba, retorno acustico tecnico, dados brutos inspecionaveis e compra/download em Disco/Console, Nuvem ou Hibrido.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            placeholder="Ex.: Cerro-Gradle Pipeline Core"
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

      {/* Trilho visual em Deque */}
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

                <CerroGradleMediaCanvas
                  node={node}
                  mode={node.deliveryMode}
                  flowPulse={flowPulse}
                  soundEnabled={soundEnabled}
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

      {/* Bancada 3D + Compra/Download + Dados Brutos + Protocolos + Logs */}
      {selectedNode && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs text-teal-700 dark:text-teal-400">
                  BANCADA 3D &amp; ACUSTICA · {selectedNode.code} · {selectedNode.rawSample.sampleRateHz} Hz
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

            <CerroGradleMediaCanvas
              node={selectedNode}
              mode={activeDelivery}
              flowPulse={flowPulse}
              soundEnabled={soundEnabled}
              isMini={false}
            />

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
