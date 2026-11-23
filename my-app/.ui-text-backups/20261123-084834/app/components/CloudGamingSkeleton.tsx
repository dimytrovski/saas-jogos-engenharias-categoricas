import React from "react";

export default function CloudGamingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando dados da nuvem..."
      className="w-full max-w-2xl mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6"
    >
      <div className="flex flex-col items-center justify-center py-4">
        <svg viewBox="0 0 260 150" className="w-56 h-32 animate-pulse" fill="none">
          <path
            d="M78 84H182C195 84 205 74 205 61C205 49 196 39 184 38C180 24 167 14 151 14C138 14 127 21 121 32C117 30 113 29 109 29C94 29 82 41 82 56C69 58 60 68 60 80C60 82 62 84 65 84H78Z"
            fill="#38bdf8"
            fillOpacity="0.25"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <path d="M55 126L105 84" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M130 128L130 84" stroke="#818cf8" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M205 126L155 84" stroke="#a855f7" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="35" y="122" width="40" height="18" rx="6" fill="#1e293b" stroke="#38bdf8" />
          <rect x="110" y="124" width="40" height="18" rx="6" fill="#1e293b" stroke="#818cf8" />
          <rect x="185" y="122" width="40" height="18" rx="6" fill="#1e293b" stroke="#a855f7" />
        </svg>
        <p className="mt-2 text-xs uppercase tracking-wider text-sky-400 animate-pulse">
          Sincronizando sinais dos periféricos na nuvem...
        </p>
      </div>

      <div className="space-y-3 animate-pulse">
        <div className="h-12 rounded-xl bg-slate-800" />
        <div className="h-12 rounded-xl bg-slate-800" />
        <div className="h-12 rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}
