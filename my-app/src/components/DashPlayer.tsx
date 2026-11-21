"use client";

import React, { useEffect, useRef, useState } from "react";

interface DashPlayerProps {
  streamKey?: string;
  viewerTier?: "viewer" | "subscriber";
  className?: string;
}

type DashInstance = {
  initialize: (view: HTMLVideoElement | null, source: string, autoPlay: boolean) => void;
  updateSettings: (settings: Record<string, unknown>) => void;
  extend: (
    extensionName: string,
    extension: unknown,
    override?: boolean
  ) => void;
  reset: () => void;
  destroy?: () => void;
};

type DashModule = {
  MediaPlayer: () => {
    create: () => DashInstance;
  };
  Debug?: {
    LOG_LEVEL_WARNING?: number;
  };
};

function appendTokenToUrl(rawUrl: string, token: string): string {
  if (!token) return rawUrl;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const url = new URL(rawUrl, base);
    if (!url.searchParams.has("token")) {
      url.searchParams.set("token", token);
    }
    return url.pathname + url.search;
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}token=${encodeURIComponent(token)}`;
  }
}

export default function DashPlayer({
  streamKey = "teste",
  viewerTier = "viewer",
  className = "",
}: DashPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<string>("Solicitando token de stream...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let playerInstance: DashInstance | null = null;
    let cancelled = false;

    async function setupDash() {
      setErrorMsg(null);
      setStatus("Gerando token HMAC...");

      try {
        const res = await fetch("/api/stream-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamKey, viewerTier }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Falha ao obter token (HTTP ${res.status})`);
        }

        const data = (await res.json()) as { token?: string };
        if (!data.token) {
          throw new Error("Token ausente na resposta da API.");
        }

        const token = data.token;
        const manifestUrl = appendTokenToUrl(`/dash/${streamKey}/manifest.mpd`, token);

        setStatus("Carregando player MPEG-DASH...");
        let dashjsMod: DashModule | null = null;

        try {
          const imported = (await import("dashjs")) as unknown as {
            default?: DashModule;
          } & DashModule;
          dashjsMod = imported.default || imported;
        } catch {
          throw new Error(
            "Pacote 'dashjs' não instalado (verifique a conexão com o npm e rode 'npm install dashjs')."
          );
        }

        if (cancelled || !videoRef.current || !dashjsMod?.MediaPlayer) {
          return;
        }

        const player = dashjsMod.MediaPlayer().create();
        playerInstance = player;

        if (dashjsMod.Debug?.LOG_LEVEL_WARNING !== undefined) {
          player.updateSettings({
            debug: { logLevel: dashjsMod.Debug.LOG_LEVEL_WARNING },
            streaming: {
              lowLatencyEnabled: false,
              abr: { autoSwitchBitrate: { video: true, audio: true } },
            },
          });
        }

        // Anexa o token em requisições de segmentos/manifesto quando necessário
        player.extend(
          "RequestModifier",
          () => ({
            modifyRequestURL: (url: string) => appendTokenToUrl(url, token),
            modifyRequestHeader: (xhr: XMLHttpRequest) => {
              xhr.setRequestHeader("X-Stream-Token", token);
              return xhr;
            },
          }),
          true
        );

        player.initialize(videoRef.current, manifestUrl, true);
        setStatus("Reproduzindo fluxo DASH / fMP4");
      } catch (err: unknown) {
        if (controller.signal.aborted || cancelled) return;
        const message = err instanceof Error ? err.message : "Erro inesperado no DashPlayer.";
        setErrorMsg(message);
        setStatus("Erro de reprodução");
      }
    }

    setupDash();

    return () => {
      cancelled = true;
      controller.abort();
      if (playerInstance) {
        try {
          playerInstance.reset();
          playerInstance.destroy?.();
        } catch {
          // Ignora erros de limpeza em unmount
        }
      }
    };
  }, [streamKey, viewerTier]);

  return (
    <div className={`w-full rounded-xl border border-slate-700/70 bg-slate-950/90 p-3 text-slate-100 ${className}`}>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
        <span>DASH / fMP4 • canal: <strong>{streamKey}</strong></span>
        <span>{status}</span>
      </div>

      {errorMsg ? (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
          {errorMsg}
        </div>
      ) : (
        <video
          ref={videoRef}
          controls
          playsInline
          muted
          className="aspect-video w-full rounded-lg bg-black"
        />
      )}
    </div>
  );
}
