"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { registerCerroWebComponents } from "./cerro-web-components";

export interface CerroSharedParams {
  moduleCode: string;
  discipline: string;
  chargePct: number;
  deliveryMode: string;
  participantKey: string;
}

interface CerroNavigationHubProps {
  initialCharge?: number;
  initialModuleCode?: string;
  initialDiscipline?: string;
  initialDeliveryMode?: string;
  onParamsChange?: (params: CerroSharedParams) => void;
}

const DISCIPLINES = [
  "Engenharia Eletrica & Energia",
  "Engenharia de Software",
  "Engenharia Civil & Estrutural",
  "Engenharia Mecanica & Controle"
];

const DELIVERY_MODES = ["hibrido", "disco_console", "streaming_nuvem"];

export default function CerroNavigationHub({
  initialCharge = 25,
  initialModuleCode = "ENG-101",
  initialDiscipline = "Engenharia Eletrica & Energia",
  initialDeliveryMode = "hibrido",
  onParamsChange
}: CerroNavigationHubProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [moduleCode, setModuleCode] = useState(
    searchParams.get("mod") || initialModuleCode
  );
  const [discipline, setDiscipline] = useState(
    searchParams.get("disc") || initialDiscipline
  );
  const [chargePct, setChargePct] = useState<number>(
    Number(searchParams.get("carga") || initialCharge) || 25
  );
  const [deliveryMode, setDeliveryMode] = useState(
    searchParams.get("entrega") || initialDeliveryMode
  );
  const [participantKey, setParticipantKey] = useState(
    searchParams.get("chave") || "CERRO-ART-2026"
  );
  const [overlayPreset, setOverlayPreset] = useState<"executivo" | "laboratorio" | "criativo">(
    "executivo"
  );

  useEffect(() => {
    registerCerroWebComponents();
  }, []);

  useEffect(() => {
    setChargePct(initialCharge);
  }, [initialCharge]);

  useEffect(() => {
    if (initialModuleCode) setModuleCode(initialModuleCode);
    if (initialDiscipline) setDiscipline(initialDiscipline);
    if (initialDeliveryMode) setDeliveryMode(initialDeliveryMode);
  }, [initialModuleCode, initialDiscipline, initialDeliveryMode]);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("mod", moduleCode);
    qs.set("disc", discipline);
    qs.set("carga", String(chargePct));
    qs.set("entrega", deliveryMode);
    qs.set("chave", participantKey);
    qs.set("ux", overlayPreset);
    return qs.toString();
  }, [moduleCode, discipline, chargePct, deliveryMode, participantKey, overlayPreset]);

  const navigateWithParams = (targetPath: string) => {
    const nextUrl = `?`;
    if (onParamsChange) {
      onParamsChange({
        moduleCode,
        discipline,
        chargePct,
        deliveryMode,
        participantKey
      });
    }
    router.push(nextUrl);
  };

  return (
    <nav
      aria-label="Menu Principal Cerro-Gradle com Parametros Compartilhados"
      className="cerro-nav-bar rounded-2xl p-4 text-stone-100"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="cerro-vector-badge">CERRO-GRADLE · HUB</span>
          <button
            type="button"
            onClick={() => navigateWithParams("/deque-engenharias")}
            className={`cerro-overlay-pill rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold `}
          >
            Deque &amp; Simuladores
          </button>
          <button
            type="button"
            onClick={() => navigateWithParams("/concurso-artistas")}
            className={`cerro-overlay-pill rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold `}
          >
            Cofre Concurso (Jornais IA)
          </button>
        </div>

        {/* Web Components nativos renderizados no overlay do menu */}
        <div className="flex flex-wrap items-center gap-2">
          <cerro-overlay-badge
            code={moduleCode}
            discipline={discipline}
            charge={String(chargePct)}
            mode={deliveryMode}
          />
          <cerro-vector-pulse charge={String(chargePct)} />
        </div>
      </div>

      {/* Controles de passagem por parametro/valor entre modulos */}
      <div className="cerro-adaptive-overlay mt-3 grid gap-2.5 rounded-xl p-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 font-mono text-[10px] text-stone-400">
          <span>PARAMETRO: DISCIPLINA</span>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-1.5 text-xs text-stone-100"
          >
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 font-mono text-[10px] text-stone-400">
          <span>PARAMETRO: MODULO / CODIGO</span>
          <input
            type="text"
            value={moduleCode}
            onChange={(e) => setModuleCode(e.target.value.toUpperCase())}
            className="rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-1.5 text-xs text-stone-100"
          />
        </label>

        <label className="flex flex-col gap-1 font-mono text-[10px] text-stone-400">
          <span>PARAMETRO: ENTREGA</span>
          <select
            value={deliveryMode}
            onChange={(e) => setDeliveryMode(e.target.value)}
            className="rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-1.5 text-xs text-stone-100"
          >
            {DELIVERY_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 font-mono text-[10px] text-stone-400">
          <span>OVERLAY UX: PERFIL</span>
          <select
            value={overlayPreset}
            onChange={(e) =>
              setOverlayPreset(e.target.value as "executivo" | "laboratorio" | "criativo")
            }
            className="rounded-lg border border-stone-700 bg-stone-950 px-2.5 py-1.5 text-xs text-stone-100"
          >
            <option value="executivo">Overlay Executivo (Escala &amp; Licencas)</option>
            <option value="laboratorio">Overlay Laboratorio (3F &amp; Telemetria)</option>
            <option value="criativo">Overlay Criativo (Vetor &amp; Autoria)</option>
          </select>
        </label>

        <div className="flex flex-col justify-end gap-1">
          <button
            type="button"
            onClick={() => navigateWithParams(pathname || "/deque-engenharias")}
            className="cerro-overlay-pill rounded-lg bg-teal-400 px-3 py-1.5 font-mono text-xs font-bold text-stone-950 hover:bg-teal-300"
          >
            Propagar Parametros na Rota
          </button>
        </div>
      </div>

      {/* Vetorizacao SVG decorativa de precisao no rodape do overlay de navegacao */}
      <svg
        viewBox="0 0 800 16"
        className="mt-2.5 h-3 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1="0"
          y1="4"
          x2="800"
          y2="4"
          stroke="#ef4444"
          strokeWidth="1.2"
          className="cerro-svg-animated-dash"
        />
        <line
          x1="0"
          y1="8"
          x2="800"
          y2="8"
          stroke="#f59e0b"
          strokeWidth="1.2"
          className="cerro-svg-animated-dash"
        />
        <line
          x1="0"
          y1="12"
          x2="800"
          y2="12"
          stroke="#38bdf8"
          strokeWidth="1.2"
          className="cerro-svg-animated-dash"
        />
      </svg>
    </nav>
  );
}
