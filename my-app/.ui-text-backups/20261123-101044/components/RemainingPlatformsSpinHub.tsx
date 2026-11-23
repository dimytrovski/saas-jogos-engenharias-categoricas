"use client";

import React, { useState } from "react";
import PhysicalPlatformController from "@/components/PhysicalPlatformController";

export type NonPlayStationPlatform = "Xbox" | "Nintendo" | "Windows" | "Mac";

export interface RemainingPlatformConfig {
  id: NonPlayStationPlatform;
  displayName: string;
  assetPath: string;
  description: string;
  accentClass: string;
}

export const REMAINING_PLATFORMS: RemainingPlatformConfig[] = [
  {
    id: "Xbox",
    displayName: "Xbox",
    assetPath: "/controllers/xbox.png",
    description: "Controle Sem Fio Xbox Series Robot White girando.",
    accentClass: "border-emerald-500 bg-emerald-50 text-emerald-950",
  },
  {
    id: "Nintendo",
    displayName: "Nintendo",
    assetPath: "/controllers/nintendo.png",
    description: "Nintendo Switch Pro Controller girando.",
    accentClass: "border-rose-500 bg-rose-50 text-rose-950",
  },
  {
    id: "Windows",
    displayName: "Windows",
    assetPath: "/controllers/windows.png",
    description: "Computador Clássico Microsoft Windows girando.",
    accentClass: "border-sky-500 bg-sky-50 text-sky-950",
  },
  {
    id: "Mac",
    displayName: "MacOS",
    assetPath: "/controllers/mac.png",
    description: "Símbolo Oficial Apple MacOS girando.",
    accentClass: "border-indigo-500 bg-indigo-50 text-indigo-950",
  },
];

interface RemainingPlatformsSpinHubProps {
  onSelectPlatform?: (platform: NonPlayStationPlatform) => void;
}

export default function RemainingPlatformsSpinHub({
  onSelectPlatform,
}: RemainingPlatformsSpinHubProps) {
  const [selected, setSelected] = useState<NonPlayStationPlatform>("Xbox");

  function handlePick(platform: NonPlayStationPlatform) {
    setSelected(platform);
    onSelectPlatform?.(platform);
  }

  return (
    <section
      aria-label="Controles giratórios de Xbox, Nintendo, Windows e MacOS"
      className="w-full max-w-6xl mx-auto mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
          Controles Giratórios (Xbox, Nintendo, Windows e MacOS)
        </h3>
        <span className="text-xs font-semibold text-slate-600">
          Ativo: <strong>{selected}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REMAINING_PLATFORMS.map((item) => {
          const isCurrent = item.id === selected;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handlePick(item.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                isCurrent
                  ? `${item.accentClass} shadow-sm`
                  : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
              }`}
            >
              <PhysicalPlatformController
                platform={item.id}
                isActive={isCurrent}
                size="md"
              />
              <div className="min-w-0">
                <div className="text-sm font-extrabold truncate">
                  {item.displayName}
                </div>
                <div className="text-[11px] text-slate-600 line-clamp-2">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}