"use client";

import React from "react";
import type { PlatformName } from "@/data/heroBackgrounds";
import PhysicalPlatformController from "@/components/PhysicalPlatformController";

interface SpinningPlatformControlProps {
  platform: PlatformName;
  accentHex?: string;
  isCircuitActive?: boolean;
  onActivateCircuit?: () => void;
}

interface RightConnectionCircuitProps {
  platform: PlatformName;
  accentHex?: string;
  isVisible: boolean;
}

const ACCENT_BY_PLATFORM: Record<PlatformName, string> = {
  Xbox: "#4ade80",
  PlayStation: "#60a5fa",
  Nintendo: "#fb7185",
  Windows: "#38bdf8",
  Mac: "#a5b4fc",
};

export function SpinningPlatformControl({
  platform,
  isCircuitActive = false,
  onActivateCircuit,
}: SpinningPlatformControlProps) {
  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <PhysicalPlatformController
        platform={platform}
        isActive={isCircuitActive}
        size="lg"
        onTrigger={onActivateCircuit}
      />
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
        {isCircuitActive ? "Circuito ativo" : "Girando"}
      </span>
    </div>
  );
}

export function RightConnectionCircuit({
  platform,
  accentHex,
  isVisible,
}: RightConnectionCircuitProps) {
  if (!isVisible) {
    return null;
  }

  const color = accentHex ?? ACCENT_BY_PLATFORM[platform];

  return (
    <div
      aria-label={`Circuito de conexão à direita para ${platform}`}
      className="hidden sm:flex items-center justify-end w-44 md:w-56 h-16 shrink-0 select-none"
    >
      <svg
        viewBox="0 0 240 70"
        className="w-full h-full overflow-visible"
        fill="none"
      >
        <path
          d="M 6 35 H 74 L 104 14 H 176 L 202 35 H 232"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 44 35 V 55 H 148 L 170 35"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="74"
          cy="35"
          r="5"
          fill="#090d16"
          stroke={color}
          strokeWidth="2.5"
        />
        <circle cx="104" cy="14" r="4.5" fill={color} />
        <circle
          cx="176"
          cy="14"
          r="4.5"
          fill="#090d16"
          stroke={color}
          strokeWidth="2.5"
        />
        <circle
          cx="232"
          cy="35"
          r="6"
          fill={color}
          className="animate-ping"
        />
        <circle cx="232" cy="35" r="5" fill={color} />
      </svg>
    </div>
  );
}