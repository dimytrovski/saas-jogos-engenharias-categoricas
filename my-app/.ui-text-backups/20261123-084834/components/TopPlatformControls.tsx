"use client";

import React, { useState } from "react";
import type { PlatformName } from "@/data/heroBackgrounds";
import PhysicalPlatformController from "@/components/PhysicalPlatformController";

export interface InitialPlatformItem {
  id: PlatformName;
  label: string;
  badgeClass: string;
  summary: string;
}

export const INITIAL_PLATFORM_CONTROLS: InitialPlatformItem[] = [
  {
    id: "Xbox",
    label: "Xbox",
    badgeClass: "bg-emerald-600 text-white border-emerald-500",
    summary: "Controle físico de Xbox girando na entrada do microSaaS.",
  },
  {
    id: "PlayStation",
    label: "PlayStation",
    badgeClass: "bg-blue-700 text-white border-blue-600",
    summary: "Controle físico de PlayStation girando na entrada do microSaaS.",
  },
  {
    id: "Nintendo",
    label: "Nintendo",
    badgeClass: "bg-rose-600 text-white border-rose-500",
    summary: "Controle físico de Nintendo girando na entrada do microSaaS.",
  },
  {
    id: "Windows",
    label: "Windows",
    badgeClass: "bg-sky-700 text-white border-sky-600",
    summary: "Controle físico de computador Windows girando na entrada do microSaaS.",
  },
  {
    id: "Mac",
    label: "MacOS",
    badgeClass: "bg-indigo-700 text-white border-indigo-600",
    summary: "Controle físico de MacOS girando na entrada do microSaaS.",
  },
];

export default function TopPlatformControls() {
  const [activePlatform, setActivePlatform] = useState<PlatformName>("Xbox");

  const currentItem =
    INITIAL_PLATFORM_CONTROLS.find((item) => item.id === activePlatform) ??
    INITIAL_PLATFORM_CONTROLS[0];

  function handleSelect(platform: PlatformName) {
    setActivePlatform(platform);
    const target = document.getElementById("plataformas-carrossel");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section
      id="controles-iniciais"
      aria-label="Controles físicos giratórios de Xbox, PlayStation, Nintendo, Windows e MacOS"
      className="w-full max-w-6xl mx-auto mt-6 rounded-2xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 block">
            Acesso Direto na Entrada do MicroSaaS
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            Controles Físicos por Plataforma
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
          Selecionado: <strong>{currentItem.label}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {INITIAL_PLATFORM_CONTROLS.map((item) => {
          const isSelected = item.id === activePlatform;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-pressed={isSelected}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? `${item.badgeClass} shadow-md scale-[1.02]`
                  : "bg-slate-50 text-slate-900 border-slate-300 hover:bg-slate-100"
              }`}
            >
              <PhysicalPlatformController
                platform={item.id}
                isActive={isSelected}
                size="sm"
              />
              <span className="text-sm font-extrabold truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 mt-3">{currentItem.summary}</p>
    </section>
  );
}