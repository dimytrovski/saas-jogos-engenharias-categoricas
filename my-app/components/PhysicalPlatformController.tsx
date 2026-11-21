"use client";

import React, { useEffect, useState } from "react";
import type { PlatformName } from "@/data/heroBackgrounds";

interface PhysicalPlatformControllerProps {
  platform: PlatformName;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  onTrigger?: () => void;
}

const IMAGE_BY_PLATFORM: Record<PlatformName, string> = {
  PlayStation: "/controllers/playstation.png",
  Xbox: "/controllers/xbox.png",
  Nintendo: "/controllers/nintendo.png",
  Windows: "/controllers/windows.png",
  Mac: "/controllers/mac.png",
};

const LABEL_BY_PLATFORM: Record<PlatformName, string> = {
  PlayStation: "Controle DualSense PlayStation",
  Xbox: "Controle Sem Fio Xbox Series Robot White",
  Nintendo: "Controle Nintendo Switch Pro Controller",
  Windows: "Computador Clássico Microsoft Windows",
  Mac: "Símbolo Oficial Apple MacOS",
};

const BORDER_BY_PLATFORM: Record<PlatformName, string> = {
  PlayStation: "border-blue-600",
  Xbox: "border-emerald-500",
  Nintendo: "border-rose-500",
  Windows: "border-sky-500",
  Mac: "border-indigo-500",
};

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "w-11 h-11 p-1",
  md: "w-16 h-16 p-1.5",
  lg: "w-20 h-20 p-2",
};

function FallbackControllerGraphic({ platform }: { platform: PlatformName }) {
  if (platform === "Xbox") {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
        <path
          d="M14 21 C9 21 6 27 6 36 C6 44 10 49 15 49 C19 49 22 44 25 41 H39 C42 44 45 49 49 49 C54 49 58 44 58 36 C58 27 55 21 50 21 C45 21 42 24 39 24 H25 C22 24 19 21 14 21 Z"
          fill="#f8fafc"
          stroke="#0f172a"
          strokeWidth="2.5"
        />
        <circle cx="32" cy="18" r="4" fill="#0f172a" />
        <circle cx="22" cy="30" r="4" fill="#1e293b" />
        <path d="M21 37 V43 M18 40 H24" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="38" cy="37" r="4" fill="#1e293b" />
        <circle cx="46" cy="27" r="2.2" fill="#eab308" />
        <circle cx="49" cy="30" r="2.2" fill="#ef4444" />
        <circle cx="43" cy="30" r="2.2" fill="#3b82f6" />
        <circle cx="46" cy="33" r="2.2" fill="#22c55e" />
      </svg>
    );
  }

  if (platform === "Nintendo") {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
        <path
          d="M13 20 C8 20 5 26 5 35 C5 44 9 49 15 49 C19 49 22 44 25 41 H39 C42 44 45 49 49 49 C55 49 59 44 59 35 C59 26 56 20 51 20 C46 20 43 23 39 23 H25 C21 23 18 20 13 20 Z"
          fill="#334155"
          stroke="#0f172a"
          strokeWidth="2.5"
        />
        <circle cx="21" cy="28" r="4.2" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
        <path d="M21 35 V42 M17.5 38.5 H24.5" stroke="#e2e8f0" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="43" cy="37" r="4.2" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="45" cy="25" r="2" fill="#e2e8f0" />
        <circle cx="48.5" cy="28.5" r="2" fill="#e2e8f0" />
        <circle cx="45" cy="32" r="2" fill="#e2e8f0" />
        <circle cx="41.5" cy="28.5" r="2" fill="#e2e8f0" />
      </svg>
    );
  }

  if (platform === "Windows") {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
        <rect x="11" y="10" width="42" height="32" rx="3" fill="#e2e8f0" stroke="#475569" strokeWidth="2.5" />
        <rect x="15" y="14" width="34" height="24" fill="#38bdf8" />
        <rect x="21" y="18" width="9" height="8" fill="#ef4444" />
        <rect x="31" y="18" width="9" height="8" fill="#22c55e" />
        <rect x="21" y="27" width="9" height="8" fill="#3b82f6" />
        <rect x="31" y="27" width="9" height="8" fill="#eab308" />
        <rect x="13" y="45" width="38" height="8" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
      </svg>
    );
  }

  if (platform === "Mac") {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
        <path
          d="M37 14 C39.5 11.2 41 8.2 40.6 5 C37.5 5.2 34 7 32 9.5 C30.2 11.8 28.5 14.8 29 17.8 C32.4 18 34.8 16.5 37 14 Z"
          fill="#0f172a"
        />
        <path
          d="M44.5 34.5 C44.4 28.2 49.6 25.1 49.9 24.9 C46.9 20.6 42.3 20 40.7 19.9 C36.9 19.5 33.2 22.1 31.3 22.1 C29.3 22.1 26.3 20 23.1 20.1 C19 20.2 15.2 22.5 13.1 26.1 C8.8 33.5 12 44.5 16.1 50.4 C18.1 53.3 20.5 56.5 23.7 56.4 C26.8 56.3 28 54.4 31.8 54.4 C35.5 54.4 36.6 56.4 39.9 56.3 C43.2 56.2 45.3 53.4 47.3 50.5 C49.6 47.1 50.6 43.8 50.6 43.6 C50.5 43.5 44.6 41.2 44.5 34.5 Z"
          fill="#0f172a"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
      <path
        d="M14 21 C9 21 6 27 6 36 C6 44 10 49 15 49 C19 49 22 44 25 41 H39 C42 44 45 49 49 49 C54 49 58 44 58 36 C58 27 55 21 50 21 C45 21 42 24 39 24 H25 C22 24 19 21 14 21 Z"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="2.5"
      />
      <path d="M20 27 V33 M17 30 H23" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="44" cy="27" r="2.2" stroke="#22c55e" strokeWidth="1.8" />
      <circle cx="47.5" cy="30.5" r="2.2" stroke="#ef4444" strokeWidth="1.8" />
      <circle cx="44" cy="34" r="2.2" stroke="#3b82f6" strokeWidth="1.8" />
      <circle cx="40.5" cy="30.5" r="2.2" stroke="#ec4899" strokeWidth="1.8" />
    </svg>
  );
}

export default function PhysicalPlatformController({
  platform,
  isActive = false,
  size = "md",
  onTrigger,
}: PhysicalPlatformControllerProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = IMAGE_BY_PLATFORM[platform];
  const altLabel = LABEL_BY_PLATFORM[platform];

  useEffect(() => {
    setImgFailed(false);
  }, [platform, src]);

  const innerSpin = (
    <span
      className={`inline-flex items-center justify-center rounded-2xl bg-white border-2 shadow-sm overflow-hidden ${SIZE_CLASSES[size]} ${BORDER_BY_PLATFORM[platform]}`}
    >
      <span
        className="w-full h-full flex items-center justify-center animate-spin"
        style={{
          animationDuration: isActive ? "2.4s" : "6s",
        }}
      >
        {!imgFailed ? (
          <img
            src={src}
            alt={altLabel}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain select-none pointer-events-none"
          />
        ) : (
          <FallbackControllerGraphic platform={platform} />
        )}
      </span>
    </span>
  );

  if (onTrigger) {
    return (
      <button
        type="button"
        onMouseEnter={onTrigger}
        onFocus={onTrigger}
        onClick={onTrigger}
        aria-label={`${altLabel} girando`}
        title={`${altLabel} — passe o mouse ou clique para ativar`}
        className="inline-flex items-center justify-center rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/60 cursor-pointer shrink-0"
      >
        {innerSpin}
      </button>
    );
  }

  return innerSpin;
}