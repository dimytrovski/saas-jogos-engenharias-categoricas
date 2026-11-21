"use client";

import React from "react";
import type { PlatformName } from "@/data/heroBackgrounds";

interface PlatformArtworkProps {
  platform: PlatformName;
  compact?: boolean;
}

const ART_CONFIG: Record<
  PlatformName,
  {
    title: string;
    subtitle: string;
    from: string;
    to: string;
    accent: string;
  }
> = {
  Xbox: {
    title: "XBOX",
    subtitle: "CONTROLLER • ARENA • MULTIPLAYER",
    from: "#064e3b",
    to: "#107c10",
    accent: "#4ade80",
  },
  PlayStation: {
    title: "PLAYSTATION",
    subtitle: "DUALSENSE • ACTION • STORY",
    from: "#172554",
    to: "#003791",
    accent: "#60a5fa",
  },
  Nintendo: {
    title: "NINTENDO",
    subtitle: "JOY-CON • PORTABLE • ARCADE",
    from: "#4c0519",
    to: "#e60012",
    accent: "#fb7185",
  },
  Windows: {
    title: "WINDOWS",
    subtitle: "PC GAMING • HIGH FPS • TACTICAL",
    from: "#0c4a6e",
    to: "#0078d4",
    accent: "#38bdf8",
  },
  Mac: {
    title: "MAC",
    subtitle: "APPLE SILICON • INDIE • STUDIO",
    from: "#1e1b4b",
    to: "#4338ca",
    accent: "#a5b4fc",
  },
};

export default function PlatformArtwork({
  platform,
  compact = false,
}: PlatformArtworkProps) {
  const cfg = ART_CONFIG[platform];

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${
        compact ? "h-full min-h-[360px]" : "h-44"
      }`}
      style={{
        background: `linear-gradient(135deg, ${cfg.from} 0%, ${cfg.to} 100%)`,
      }}
    >
      <svg
        viewBox="0 0 800 360"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        aria-label={`Arte temática da plataforma ${platform}`}
      >
        <defs>
          <pattern
            id={`grid-${platform}`}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={cfg.accent}
              strokeOpacity="0.22"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="800" height="360" fill={`url(#grid-${platform})`} />
        <circle cx="650" cy="80" r="130" fill={cfg.accent} fillOpacity="0.18" />
        <circle cx="140" cy="300" r="150" fill={cfg.accent} fillOpacity="0.14" />

        {platform === "Xbox" && (
          <g stroke={cfg.accent} strokeWidth="6" fill="none" opacity="0.9">
            <circle cx="400" cy="145" r="54" />
            <path d="M362 108 L438 182" />
            <path d="M438 108 L362 182" />
          </g>
        )}

        {platform === "PlayStation" && (
          <g stroke={cfg.accent} strokeWidth="6" fill="none" opacity="0.9">
            <polygon points="400,92 452,182 348,182" />
            <rect x="520" y="114" width="60" height="60" rx="6" />
            <circle cx="245" cy="144" r="32" />
          </g>
        )}

        {platform === "Nintendo" && (
          <g stroke={cfg.accent} strokeWidth="6" fill="none" opacity="0.9">
            <rect x="305" y="96" width="82" height="106" rx="28" />
            <rect x="413" y="96" width="82" height="106" rx="28" />
            <circle cx="346" cy="134" r="12" />
            <circle cx="454" cy="164" r="12" />
          </g>
        )}

        {platform === "Windows" && (
          <g fill={cfg.accent} fillOpacity="0.8">
            <rect x="336" y="96" width="58" height="54" rx="4" />
            <rect x="404" y="96" width="66" height="54" rx="4" />
            <rect x="336" y="158" width="58" height="54" rx="4" />
            <rect x="404" y="158" width="66" height="54" rx="4" />
          </g>
        )}

        {platform === "Mac" && (
          <g stroke={cfg.accent} strokeWidth="6" fill="none" opacity="0.9">
            <rect x="315" y="94" width="170" height="110" rx="14" />
            <line x1="365" y1="222" x2="435" y2="222" />
            <line x1="400" y1="204" x2="400" y2="222" />
          </g>
        )}

        <text
          x="400"
          y="265"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="38"
          fontWeight="800"
          fontFamily="Arial, sans-serif"
          letterSpacing="4"
        >
          {cfg.title}
        </text>
        <text
          x="400"
          y="302"
          textAnchor="middle"
          fill={cfg.accent}
          fontSize="15"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
          letterSpacing="3"
        >
          {cfg.subtitle}
        </text>
      </svg>
    </div>
  );
}