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

export interface DbProgressRecord {
  id?: number;
  module_code: string;
  event_type: string;
  charge_pct: number;
  delivery_mode: string;
  mission_title: string;
  challenge_title: string;
  legacy_title: string;
  created_at?: string;
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

// Som caracteristico de elefante (barrito grave/formante com modulacao de frequencia)
function playElephantTrumpetSound() {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Perfil de trombeta/barrito de elefante: subida rapida e vibrato nasal filtrado
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(135, now);
    osc1.frequency.exponentialRampToValueAtTime(340, now + 0.24);
    osc1.frequency.exponentialRampToValueAtTime(285, now + 0.58);
    osc1.frequency.exponentialRampToValueAtTime(160, now + 0.88);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(270, now);
    osc2.frequency.exponentialRampToValueAtTime(680, now + 0.24);
    osc2.frequency.exponentialRampToValueAtTime(220, now + 0.88);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(1280, now + 0.25);
    filter.frequency.exponentialRampToValueAtTime(460, now + 0.88);
    filter.Q.setValueAtTime(3.2, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.08);
    gain.gain.setValueAtTime(0.12, now + 0.48);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.92);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.94);
    osc2.stop(now + 0.94);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1050);
  } catch {
    // Ignora bloqueio antes de interacao
  }
}

interface TrunkHitBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pad: number;
}

function drawThreePhaseElephantScene(
  ctx: CanvasRenderingContext2D,
  size: number,
  t: number,
  chargePct: number,
  isTouchingTrunk: boolean,
  showGuides: boolean,
  hitBoxRef: React.MutableRefObject<TrunkHitBox>
) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.43;
  const innerR = outerR / PHI;
  const chargeFactor = Math.max(0, Math.min(1, chargePct / 100));

  ctx.clearRect(0, 0, size, size);

  // Ambiente exclusivo de Engenharia Eletrica (subestacao, barramento e malha de potencia)
  const bg = ctx.createRadialGradient(cx, cy * 0.85, outerR * 0.1, cx, cy, outerR * 1.15);
  bg.addColorStop(0, chargeFactor > 0.2 ? "#0e2238" : "#0b1524");
  bg.addColorStop(0.65, "#060c17");
  bg.addColorStop(1, "#03060c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.strokeStyle =
    chargeFactor >= 1
      ? "#2dd4bf"
      : isTouchingTrunk
        ? "#f59e0b"
        : "rgba(56, 189, 248, 0.55)";
  ctx.lineWidth = Math.max(2, size * 0.008);
  ctx.stroke();

  // Anel de proporcao aurea
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(245, 158, 11, 0.22)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  if (showGuides) {
    ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - innerR, cy);
    ctx.lineTo(cx + innerR, cy);
    ctx.moveTo(cx, cy - innerR);
    ctx.lineTo(cx, cy + innerR);
    ctx.stroke();
  }

  // Recorte circular fechado do emblema
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 2, 0, Math.PI * 2);
  ctx.clip();

  // Barramento trifasico de fundo (R, S, T)
  const busYTop = cy - outerR * 0.62;
  const busSpacing = outerR * 0.09;
  const busColors = ["#ef4444", "#f59e0b", "#38bdf8"]; // Fases R, S, T
  busColors.forEach((col, idx) => {
    const by = busYTop + idx * busSpacing;
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.25 + chargeFactor * 0.55;
    ctx.lineWidth = Math.max(1, size * 0.004);
    ctx.beginPath();
    ctx.moveTo(cx - outerR * 0.72, by);
    ctx.lineTo(cx + outerR * 0.72, by);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // Escala proporcional do elefante dentro do icone fechado
  const u = outerR * 0.46;
  const bodyCx = cx - u * 0.28;
  const bodyCy = cy + u * 0.12;
  const bodyRx = u * 0.78;
  const bodyRy = u * 0.54;

  // 4 patas solidas e bem definidas (sem empilhamento de elipses)
  const legDefs = [
    { x: bodyCx - bodyRx * 0.62, yTop: bodyCy + bodyRy * 0.45, h: u * 0.58, w: u * 0.24 },
    { x: bodyCx - bodyRx * 0.25, yTop: bodyCy + bodyRy * 0.52, h: u * 0.54, w: u * 0.22 },
    { x: bodyCx + bodyRx * 0.26, yTop: bodyCy + bodyRy * 0.52, h: u * 0.54, w: u * 0.22 },
    { x: bodyCx + bodyRx * 0.6, yTop: bodyCy + bodyRy * 0.45, h: u * 0.58, w: u * 0.24 }
  ];

  legDefs.forEach((leg) => {
    const gradLeg = ctx.createLinearGradient(leg.x, leg.yTop, leg.x, leg.yTop + leg.h);
    gradLeg.addColorStop(0, chargeFactor > 0.1 ? "#1e3a5f" : "#1e293b");
    gradLeg.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradLeg;
    ctx.strokeStyle = chargeFactor > 0.35 ? "#2dd4bf" : "#64748b";
    ctx.lineWidth = Math.max(1.2, size * 0.005);
    ctx.beginPath();
    ctx.roundRect(leg.x - leg.w / 2, leg.yTop, leg.w, leg.h, leg.w * 0.28);
    ctx.fill();
    ctx.stroke();
  });

  // Corpo unico, coeso e carregado eletricamente pelo contato na tromba trifasica
  const bodyGrad = ctx.createLinearGradient(
    bodyCx - bodyRx,
    bodyCy - bodyRy,
    bodyCx + bodyRx,
    bodyCy + bodyRy
  );
  bodyGrad.addColorStop(0, "#16263d");
  bodyGrad.addColorStop(0.5, chargeFactor > 0.15 ? "#134e4a" : "#1e293b");
  bodyGrad.addColorStop(1, "#0f172a");

  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = chargeFactor > 0.2 ? "#2dd4bf" : "#94a3b8";
  ctx.lineWidth = Math.max(1.8, size * 0.007);
  ctx.beginPath();
  ctx.moveTo(bodyCx - bodyRx, bodyCy);
  ctx.bezierCurveTo(
    bodyCx - bodyRx * 0.95,
    bodyCy - bodyRy * 1.15,
    bodyCx + bodyRx * 0.85,
    bodyCy - bodyRy * 1.1,
    bodyCx + bodyRx,
    bodyCy - bodyRy * 0.1
  );
  ctx.bezierCurveTo(
    bodyCx + bodyRx * 0.95,
    bodyCy + bodyRy * 0.85,
    bodyCx - bodyRx * 0.85,
    bodyCy + bodyRy * 0.85,
    bodyCx - bodyRx,
    bodyCy
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ondas de energia trifasica percorrendo o corpo conforme ele e carregado
  if (chargeFactor > 0.02) {
    ctx.save();
    ctx.clip();
    const pulseCount = 3;
    for (let p = 0; p < pulseCount; p++) {
      const waveOffset = ((t * (1.5 + chargeFactor * 3.5) + p / pulseCount) % 1) * bodyRx * 2;
      const wx = bodyCx - bodyRx + waveOffset;
      ctx.strokeStyle = busColors[p % 3];
      ctx.globalAlpha = 0.25 + chargeFactor * 0.55;
      ctx.lineWidth = Math.max(1.5, size * 0.007);
      ctx.beginPath();
      ctx.moveTo(wx, bodyCy - bodyRy);
      ctx.quadraticCurveTo(wx + u * 0.14, bodyCy, wx - u * 0.06, bodyCy + bodyRy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Cabeca bem definida (cranio, orelha estrutural e presa/bornes)
  const headX = bodyCx + bodyRx * 0.92;
  const headY = bodyCy - bodyRy * 0.34;
  const headR = u * 0.42;

  // Orelha grande e definida
  ctx.fillStyle = "#162840";
  ctx.strokeStyle = chargeFactor > 0.3 ? "#38bdf8" : "#94a3b8";
  ctx.lineWidth = Math.max(1.5, size * 0.006);
  ctx.beginPath();
  ctx.ellipse(
    headX - headR * 0.28,
    headY + headR * 0.05,
    headR * 0.44,
    headR * 0.66,
    -0.2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // Cabeca nitida com contorno fechado
  ctx.fillStyle = "#1e334d";
  ctx.strokeStyle = chargeFactor > 0.2 ? "#2dd4bf" : "#cbd5e1";
  ctx.lineWidth = Math.max(1.8, size * 0.007);
  ctx.beginPath();
  ctx.arc(headX, headY, headR * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Olho / indicador optico nitido
  ctx.fillStyle = chargeFactor >= 0.7 ? "#2dd4bf" : "#e2e8f0";
  ctx.beginPath();
  ctx.arc(headX + headR * 0.28, headY - headR * 0.14, Math.max(2, size * 0.008), 0, Math.PI * 2);
  ctx.fill();

  // TROMBA COMO CABO TRIFASICO (3 condutores R, S, T em bainha de isolacao)
  const startX = headX + headR * 0.56;
  const startY = headY + headR * 0.22;
  const ctrl1X = startX + u * 0.55;
  const ctrl1Y = startY + u * 0.05;
  const ctrl2X = startX + u * 0.68;
  const ctrl2Y = startY + u * 0.68;
  const endX = startX + u * 0.22;
  const endY = startY + u * 0.88;

  hitBoxRef.current = {
    x1: Math.min(startX, ctrl2X, endX),
    y1: startY - u * 0.12,
    x2: Math.max(startX, ctrl1X, ctrl2X) + u * 0.1,
    y2: endY + u * 0.14,
    pad: Math.max(12, size * 0.045)
  };

  // Bainha externa do cabo trifasico
  ctx.strokeStyle = isTouchingTrunk || chargeFactor > 0.1 ? "#f59e0b" : "#475569";
  ctx.lineWidth = Math.max(7, size * 0.032);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
  ctx.stroke();

  // Tres condutores internos trifasicos (Fases R, S, T) com pulsos de corrente
  const conductorOffsets = [-2.4, 0, 2.4];
  conductorOffsets.forEach((off, idx) => {
    ctx.strokeStyle = busColors[idx];
    ctx.lineWidth = Math.max(1.5, size * 0.0065);
    ctx.beginPath();
    ctx.moveTo(startX + off, startY + off * 0.4);
    ctx.bezierCurveTo(
      ctrl1X + off,
      ctrl1Y + off * 0.4,
      ctrl2X + off,
      ctrl2Y + off * 0.4,
      endX + off,
      endY + off * 0.4
    );
    ctx.stroke();
  });

  // Indicador de carga no topo da barra de tensao
  ctx.fillStyle = "#e2e8f0";
  ctx.font = `600 ${Math.max(10, Math.round(size * 0.038))}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(
    `3F CARGA: ${chargePct}% ${isTouchingTrunk ? "[CONTATO ATIVO]" : ""}`,
    cx,
    cy + outerR * 0.82
  );

  ctx.restore();
}

function ThreePhaseElephantCanvas({
  node,
  chargePct,
  onTrunkChargeTick,
  onTrunkRelease,
  showGuides,
  sizePx
}: {
  node: EngineeringGameNode;
  chargePct: number;
  onTrunkChargeTick: (delta: number) => void;
  onTrunkRelease: () => void;
  showGuides: boolean;
  sizePx: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitBoxRef = useRef<TrunkHitBox>({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    pad: 16
  });
  const [isTouchingTrunk, setIsTouchingTrunk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const renderLoop = (now: number) => {
      const elapsed = (now - start) / 1000;
      drawThreePhaseElephantScene(
        ctx,
        canvas.width,
        elapsed,
        chargePct,
        isTouchingTrunk,
        showGuides,
        hitBoxRef
      );
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [node, chargePct, isTouchingTrunk, showGuides, sizePx]);

  const checkPointerOnTrunk = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const hb = hitBoxRef.current;
    return (
      x >= hb.x1 - hb.pad &&
      x <= hb.x2 + hb.pad &&
      y >= hb.y1 - hb.pad &&
      y <= hb.y2 + hb.pad
    );
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const overTrunk = checkPointerOnTrunk(e.clientX, e.clientY);
    setIsTouchingTrunk(overTrunk);
    if (overTrunk) {
      onTrunkChargeTick(3.5);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const overTrunk = checkPointerOnTrunk(e.clientX, e.clientY);
    setIsTouchingTrunk(overTrunk);
    if (overTrunk) {
      onTrunkChargeTick(12);
    }
  };

  const handlePointerLeave = () => {
    if (isTouchingTrunk) {
      setIsTouchingTrunk(false);
      onTrunkRelease();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={sizePx}
      height={sizePx}
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      title="Passe ou clique na tromba (cabo trifasico) para carregar o corpo do elefante"
      className="mx-auto block cursor-crosshair rounded-2xl border border-slate-800 bg-slate-950 shadow-sm"
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
  const [customDiscipline, setCustomDiscipline] = useState("Engenharia Eletrica & Energia");
  const [customPrice, setCustomPrice] = useState("189.00");
  const [autoCirculate, setAutoCirculate] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [chargePct, setChargePct] = useState(25);
  const [lastMoveDir, setLastMoveDir] = useState<"left" | "right">("right");
  const [rawTab, setRawTab] = useState<"telemetry" | "json">("telemetry");
  const [dbRecords, setDbRecords] = useState<DbProgressRecord[]>([]);
  const [dbStatusLabel, setDbStatusLabel] = useState("Sincronizando MariaDB...");
  const [eventLog, setEventLog] = useState<string[]>([
    `[SSR ${serverRenderedAt}] Ambiente de Engenharia Eletrica ativo. Passe o mouse na tromba trifasica para carregar o corpo.`
  ]);

  const trumpetedAtFullChargeRef = useRef(false);

  const selectedNode = useMemo(
    () => deque.find((item) => item.id === selectedId) ?? deque[0] ?? null,
    [deque, selectedId]
  );

  // Missoes, desafios e legados derivados naturalmente do contato humano com o app
  const missionsAndLegacies = useMemo(() => {
    const hasCharged = chargePct >= 70;
    const isFullCharge = chargePct >= 100;
    const hasLicensed = deque.some((n) => n.licenseActive);
    const hasSdlcDone = deque.some((n) => n.sdlcProgress >= 100);

    return [
      {
        id: "m1",
        mission: "Energizar o Cabo Trifasico (R/S/T) via contato na tromba",
        challenge: "Elevar a carga do corpo do elefante ate 100% sem perda de fase",
        legacy: "Especialista em Energizacao Trifasica",
        completed: isFullCharge || hasCharged
      },
      {
        id: "m2",
        mission: "Adquirir e baixar simulador do estoque para Disco/Console ou Nuvem",
        challenge: "Garantir licenca de producao valida apos compra e download",
        legacy: "Guiao de Licencas & Entrega Hibrida",
        completed: hasLicensed
      },
      {
        id: "m3",
        mission: "Conduzir modulo pelo Ciclo de Vida do Software (SDLC) ate 100%",
        challenge: "Manter protocolos auxiliares validados (HMAC, Token, Integridade, Sessao)",
        legacy: "Arquiteto de Confiabilidade & SDLC",
        completed: hasSdlcDone
      }
    ];
  }, [chargePct, deque]);

  const loadDbRecords = async () => {
    try {
      const res = await fetch("/api/deque-progress", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.records)) {
        setDbRecords(data.records);
      }
      setDbStatusLabel(
        data.persisted
          ? "MariaDB Conectado (engineering_deque_progress)"
          : "Modo Fallback Local (MariaDB pendente)"
      );
    } catch {
      setDbStatusLabel("Modo Fallback Local");
    }
  };

  useEffect(() => {
    loadDbRecords();
  }, []);

  const persistProgressToDb = async (
    node: EngineeringGameNode,
    eventType: string,
    nextCharge: number,
    mode: DeliveryMode
  ) => {
    const activeItem =
      missionsAndLegacies.find((m) => m.completed) ?? missionsAndLegacies[0];
    try {
      const res = await fetch("/api/deque-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleCode: node.code,
          eventType,
          chargePct: nextCharge,
          deliveryMode: mode,
          missionTitle: activeItem.mission,
          challengeTitle: activeItem.challenge,
          legacyTitle: activeItem.legacy,
          rawPayload: {
            code: node.code,
            title: node.title,
            chargePct: nextCharge,
            licenseActive: node.licenseActive,
            sdlcProgress: node.sdlcProgress
          }
        })
      });
      const data = await res.json();
      if (data.persisted) {
        setDbStatusLabel("MariaDB Conectado (Gravado)");
        await loadDbRecords();
      }
    } catch {
      // Silencioso em caso de falha de rede local
    }
  };

  const pushLog = (msg: string, playElephant = false) => {
    const now = new Date().toLocaleTimeString("pt-BR");
    setEventLog((prev) => [`[${now}] ${msg}`, ...prev.slice(0, 12)]);
    if (soundEnabled && playElephant) {
      playElephantTrumpetSound();
    }
  };

  const handleTrunkChargeTick = (delta: number) => {
    setChargePct((prev) => {
      const next = Math.min(100, Math.round(prev + delta));
      if (next >= 100 && !trumpetedAtFullChargeRef.current) {
        trumpetedAtFullChargeRef.current = true;
        pushLog(
          "CARGA TRIFASICA 100%: Corpo do elefante energizado pelo contato na tromba! Som emitido.",
          true
        );
        if (selectedNode) {
          persistProgressToDb(selectedNode, "trunk_full_charge", 100, activeDelivery);
        }
      } else if (next < 100) {
        trumpetedAtFullChargeRef.current = false;
      }
      return next;
    });
  };

  const handleTrunkRelease = () => {
    if (selectedNode) {
      persistProgressToDb(selectedNode, "trunk_contact_release", chargePct, activeDelivery);
    }
  };

  const rotateDeque = (direction: "front_to_rear" | "rear_to_front", silent = false) => {
    if (deque.length <= 1) return;
    setLastMoveDir(direction === "front_to_rear" ? "right" : "left");
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
    const title = customTitle.trim() || `Subestacao Trifasica ${customDiscipline}`;
    const price = Math.max(29.0, Number(customPrice) || 189.0);
    const id = `eng-${Date.now().toString(36)}`;
    const code = `ENG-${Math.floor(100 + Math.random() * 899)}`;

    const newNode: EngineeringGameNode = {
      id,
      code,
      title,
      discipline: customDiscipline,
      realWorldProblem:
        "Operacao trifasica R/S/T, chaveamento de barramento, entrega em disco/nuvem e licenca de producao.",
      stockUnits: 60,
      priceBrl: price,
      diskSizeGb: 22.4,
      cloudBitrateMbps: 17.5,
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
        primaryMetricLabel: "Carga Trifasica",
        primaryMetricValue: `${chargePct}%`,
        secondaryMetricLabel: "Defasagem",
        secondaryMetricValue: "120.0 deg",
        rawTelemetryFrame: `RAW|${code}|BUS=3F_RST|CHARGE=${chargePct}%|FREQ=60.00Hz|CRC=9E2C`,
        payloadJson: JSON.stringify(
          {
            module: title,
            code,
            discipline: customDiscipline,
            chargePct,
            delivery: activeDelivery,
            licenseModel: "production_enterprise"
          },
          null,
          2
        )
      }
    };

    setDeque((prev) => (end === "front" ? [newNode, ...prev] : [...prev, newNode]));
    setSelectedId(id);
    setCustomTitle("");
    pushLog(`DEQUE ${end.toUpperCase()}: Inserido "${title}" (${code}).`);
    persistProgressToDb(newNode, `deque_insert_${end}`, chargePct, activeDelivery);
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
    let updatedNode: EngineeringGameNode | null = null;
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

        updatedNode = {
          ...item,
          stockUnits: nextStock,
          deliveryMode: mode,
          licenseActive: true,
          sdlcProgress: stageObj.pct,
          sdlcStage: stageObj.label,
          lastServerSync: new Date().toLocaleTimeString("pt-BR")
        };

        pushLog(
          `COMPRA & DOWNLOAD [${deliveryLabel(mode)}]: "${item.title}" baixado. Estoque: ${nextStock}. Licenca producao ativa.`,
          true
        );

        return updatedNode;
      })
    );
    if (updatedNode) {
      persistProgressToDb(updatedNode, "purchase_and_download", chargePct, mode);
    }
  };

  const advanceSdlcStage = (nodeId: string) => {
    let updatedNode: EngineeringGameNode | null = null;
    setDeque((prev) =>
      prev.map((item) => {
        if (item.id !== nodeId) return item;
        const currentIdx = SDLC_STAGES.findIndex((s) => s.label === item.sdlcStage);
        const nextStage =
          SDLC_STAGES[Math.min(SDLC_STAGES.length - 1, Math.max(0, currentIdx + 1))];
        const active = nextStage.pct === 100 || item.licenseActive;
        updatedNode = {
          ...item,
          sdlcStage: nextStage.label,
          sdlcProgress: nextStage.pct,
          licenseActive: active,
          lastServerSync: new Date().toLocaleTimeString("pt-BR")
        };
        pushLog(`SDLC [${item.code}]: ${nextStage.pct}% (${nextStage.label}).`);
        return updatedNode;
      })
    );
    if (updatedNode) {
      persistProgressToDb(updatedNode, "sdlc_advance", chargePct, activeDelivery);
    }
  };

  const toggleProtocol = (
    nodeId: string,
    key: keyof EngineeringGameNode["protocols"]
  ) => {
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
      {/* Cabecalho de Engenharia Eletrica e controle do Deque */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-teal-500/15 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                ENGENHARIA ELETRICA · 60 Hz / 3F
              </span>
              <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                DEQUE (Double-Ended Queue)
              </span>
              <span className="rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                {dbStatusLabel}
              </span>
              <span className="text-xs text-zinc-500">SSR: {serverRenderedAt}</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Cerro-Gradle: Cabo Trifasico na Tromba, Carga do Corpo e Licenca de Producao
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Passe ou clique na tromba (cabo trifasico) para carregar o corpo do elefante, emitir o som caracteristico e registrar missoes, desafios e legados no banco de dados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => pushLog("Som de elefante acionado manualmente.", true)}
              className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
            >
              Som do Elefante
            </button>
            <button
              type="button"
              onClick={() => setShowGuides((g) => !g)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                showGuides
                  ? "border-teal-600 bg-teal-600/10 text-teal-700 dark:border-teal-400 dark:text-teal-300"
                  : "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {showGuides ? "Guias: ON" : "Guias: OFF"}
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
              {soundEnabled ? "Audio: ON" : "Audio: OFF"}
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

        {/* Insercao no FRONT ou REAR */}
        <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-zinc-800">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Ex.: Subestacao Cerro-Gradle 138kV"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <select
            value={customDiscipline}
            onChange={(e) => setCustomDiscipline(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option>Engenharia Eletrica &amp; Energia</option>
            <option>Engenharia de Software</option>
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

      {/* Trilho Deque com anatomia limpa e cabo trifasico */}
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

                <ThreePhaseElephantCanvas
                  node={node}
                  chargePct={chargePct}
                  onTrunkChargeTick={handleTrunkChargeTick}
                  onTrunkRelease={handleTrunkRelease}
                  showGuides={showGuides}
                  sizePx={168}
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

      {/* Bancada interativa de carga trifasica + Compra/Download + Dados Brutos + Protocolos + Logs */}
      {selectedNode && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs text-teal-700 dark:text-teal-400">
                  BANCADA DE ENGENHARIA ELETRICA · {selectedNode.code} · CARGA DO CORPO: {chargePct}%
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
                  Estoque no servidor: {selectedNode.stockUnits}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <ThreePhaseElephantCanvas
                node={selectedNode}
                chargePct={chargePct}
                onTrunkChargeTick={handleTrunkChargeTick}
                onTrunkRelease={handleTrunkRelease}
                showGuides={showGuides}
                sizePx={248}
              />
              <div className="mt-3 w-full max-w-md">
                <div className="mb-1 flex justify-between text-xs font-medium">
                  <span>Carga Trifasica no Corpo (via contato na tromba)</span>
                  <span className="tabular-nums font-semibold text-teal-700 dark:text-teal-300">
                    {chargePct}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-sky-400 to-teal-400 transition-all duration-200"
                    style={{ width: `${chargePct}%` }}
                  />
                </div>
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
                  Dados Brutos de Engenharia Eletrica:
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
                  ? `${selectedNode.rawSample.rawTelemetryFrame}\nTRUNK_3F_CHARGE=${chargePct}% | DELIVERY=${activeDelivery.toUpperCase()} | LICENSE=${selectedNode.licenseActive ? "ACTIVE_PROD" : "PENDING"}`
                  : selectedNode.rawSample.payloadJson}
              </pre>
            </div>

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Protocolos Auxiliares:
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
              Eventos de contato trifasico, compras e licencas.
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

      {/* Area propria e dedicada: Missoes, Desafios e Legados + Registros do Banco de Dados */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-400">
              PROGRESSO HUMANO DERIVADO &amp; PERSISTIDO EM BANCO DE DADOS
            </span>
            <h2 className="text-lg font-semibold">
              Missoes, Desafios e Legados Conquistados no Aplicativo
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Derivados naturalmente da interacao humana com a tromba trifasica, compras/downloads, SDLC e gravados na tabela engineering_deque_progress.
            </p>
          </div>
          <button
            type="button"
            onClick={loadDbRecords}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          >
            Atualizar Registros do Banco
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {missionsAndLegacies.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 ${
                item.completed
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-teal-700 dark:text-teal-400">MISSAO</span>
                <span
                  className={
                    item.completed
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-zinc-500"
                  }
                >
                  {item.completed ? "CONQUISTADA" : "EM PROGRESSO"}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold">{item.mission}</p>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                <strong>Desafio:</strong> {item.challenge}
              </p>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                <strong>Legado:</strong> {item.legacy}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Historico Gravado no Banco de Dados ({dbRecords.length} registros):
          </div>
          {dbRecords.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Interaja com a tromba trifasica, compre/baixe ou avance o SDLC para gravar novos registros no banco.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                    <th className="py-2 pr-3">Modulo</th>
                    <th className="py-2 pr-3">Evento</th>
                    <th className="py-2 pr-3">Carga</th>
                    <th className="py-2 pr-3">Missao / Legado</th>
                  </tr>
                </thead>
                <tbody>
                  {dbRecords.slice(0, 8).map((rec, i) => (
                    <tr
                      key={rec.id ?? i}
                      className="border-b border-zinc-100 dark:border-zinc-800/60"
                    >
                      <td className="py-2 pr-3 font-semibold">{rec.module_code}</td>
                      <td className="py-2 pr-3">{rec.event_type}</td>
                      <td className="py-2 pr-3">{rec.charge_pct}%</td>
                      <td className="py-2 pr-3">{rec.legacy_title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
