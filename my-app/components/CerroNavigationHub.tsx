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

  const [moduleCode, setModuleCode] = useState(searchParams.get("mod") || initialModuleCode);
  const [discipline, setDiscipline] = useState(searchParams.get("disc") || initialDiscipline);
  const [chargePct, setChargePct] = useState<number>(
    Number(searchParams.get("carga") || initialCharge) || 25
  );
  const [deliveryMode, setDeliveryMode] = useState(
    searchParams.get("entrega") || initialDeliveryMode
  );
  const [participantKey] = useState(searchParams.get("chave") || "CERRO-ART-2026");

  useEffect(() => {
    registerCerroWebComponents();
  }, []);

  useEffect(() => {
    setChargePct(initialCharge);
  }, [initialCharge]);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("mod", moduleCode);
    qs.set("disc", discipline);
    qs.set("carga", String(chargePct));
    qs.set("entrega", deliveryMode);
    qs.set("chave", participantKey);
    return qs.toString();
  }, [moduleCode, discipline, chargePct, deliveryMode, participantKey]);

  const go = (route: string) => {
    if (onParamsChange) {
      onParamsChange({ moduleCode, discipline, chargePct, deliveryMode, participantKey });
    }
    router.push(`?`);
  };

  return (
    <nav
      data-mod={moduleCode}
      data-disc={discipline}
      data-charge={chargePct}
      data-mode={deliveryMode}
      className="cerro-nav-bar flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="deque"
          onClick={() => go("/deque-engenharias")}
          className={`cerro-action-btn h-9 w-9 border `}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-teal-300" />
        </button>

        <button
          type="button"
          aria-label="contest"
          onClick={() => go("/concurso-artistas")}
          className={`cerro-action-btn h-9 w-9 border `}
        >
          <span className="h-2.5 w-2.5 rotate-45 bg-amber-300" />
        </button>

        <select
          aria-label="discipline"
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 text-xs text-slate-200"
        >
          {DISCIPLINES.map((d, i) => (
            <option key={d} value={d}>
              {`0`}
            </option>
          ))}
        </select>

        <select
          aria-label="delivery"
          value={deliveryMode}
          onChange={(e) => setDeliveryMode(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 text-xs text-slate-200"
        >
          {DELIVERY_MODES.map((m, i) => (
            <option key={m} value={m}>
              {`M`}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <cerro-vector-pulse charge={String(chargePct)} />
        <button
          type="button"
          aria-label="sync"
          onClick={() => {
            setModuleCode((c) => c);
            go(pathname || "/deque-engenharias");
          }}
          className="cerro-action-btn h-9 w-9 bg-teal-400"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-slate-950" />
        </button>
      </div>
    </nav>
  );
}
