"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import StreamStage, { ViewerTier } from "./StreamStage";

type DiagnosticStage = "token" | "m3u8" | "ts" | "ativo" | "erro";

interface HlsPlayerProps {
  streamKey?: string;
  viewerTier?: ViewerTier;
  reflectionScale?: number;
  /** Se true, mantém ?token= na URL para compatibilidade com auth_request via args; se false, envia também header X-Stream-Token */
  attachTokenInQuery?: boolean;
}

function normalizeStreamPath(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    if (parsed.pathname.startsWith("/hls/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function appendTokenToUrl(rawUrl: string, token: string): string {
  const normalized = normalizeStreamPath(rawUrl);
  try {
    const url = new URL(normalized, window.location.origin);
    if (!url.searchParams.has("token")) {
      url.searchParams.set("token", token);
    }
    return `${url.pathname}${url.search}`;
  } catch {
    const separator = normalized.includes("?") ? "&" : "?";
    return `${normalized}${separator}token=${encodeURIComponent(token)}`;
  }
}

function classifyUrlStage(rawUrl: string): "m3u8" | "ts" | "recurso" {
  const clean = rawUrl.split("?")[0].toLowerCase();
  if (clean.endsWith(".m3u8")) return "m3u8";
  if (clean.endsWith(".ts") || clean.endsWith(".m4s")) return "ts";
  return "recurso";
}

export default function HlsPlayer({
  streamKey = "teste",
  viewerTier = "viewer",
  reflectionScale = 1,
  attachTokenInQuery = true,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [status, setStatus] = useState<string>("Etapa 1/3 (Token): solicitando autorização...");
  const [diagDetail, setDiagDetail] = useState<string>("Aguardando validação de sessão");
  const [stage, setStage] = useState<DiagnosticStage>("token");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activityPulse, setActivityPulse] = useState<number>(0);
  const [reconnectNonce, setReconnectNonce] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let pulseDecayTimeout: ReturnType<typeof setTimeout> | null = null;
    let slowStepInterval: ReturnType<typeof setInterval> | null = null;

    let currentStepLabel = "Token";
    let stepStartedAt = Date.now();

    const setStepTimer = (label: string, nextStage: DiagnosticStage, detail: string) => {
      if (cancelled) return;
      currentStepLabel = label;
      stepStartedAt = Date.now();
      setStage(nextStage);
      setDiagDetail(detail);
    };

    const triggerPulse = (intensity = 0.85) => {
      if (cancelled) return;
      setActivityPulse(intensity);
      if (pulseDecayTimeout) clearTimeout(pulseDecayTimeout);
      pulseDecayTimeout = setTimeout(() => {
        if (!cancelled) setActivityPulse(0);
      }, 450);
    };

    slowStepInterval = setInterval(() => {
      if (cancelled) return;
      const elapsedSec = Math.floor((Date.now() - stepStartedAt) / 1000);
      if (elapsedSec >= 2 && (currentStepLabel === "Token" || currentStepLabel === "Manifesto" || currentStepLabel === "Segmento")) {
        setDiagDetail(`${currentStepLabel} em andamento há ${elapsedSec}s...`);
      }
    }, 1000);

    async function initStream() {
      try {
        setErrorMsg(null);
        setStepTimer("Token", "token", "Validando credenciais temporárias de transmissão...");
        setStatus("Etapa 1/3 (Token): validando acesso...");

        const tokenStart = performance.now();
        const res = await fetch("/api/stream-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({ streamKey, viewerTier }),
        });
        const tokenMs = Math.round(performance.now() - tokenStart);

        if (!res.ok) {
          throw new Error(`Autorização negada ou indisponível (HTTP ${res.status}) em ${tokenMs}ms.`);
        }

        const data: { token: string; manifestUrl: string } = await res.json();
        if (cancelled || !videoRef.current || !data.token || !data.manifestUrl) {
          return;
        }

        const video = videoRef.current;
        const basePath = normalizeStreamPath(data.manifestUrl);
        const sourceUrl = attachTokenInQuery ? appendTokenToUrl(basePath, data.token) : basePath;

        setStepTimer(
          "Manifesto",
          "m3u8",
          `Acesso autorizado em ${tokenMs}ms · Solicitando manifesto...`
        );
        setStatus("Etapa 2/3 (Manifesto .m3u8): carregando playlist...");

        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            manifestLoadingMaxRetry: 6,
            manifestLoadingRetryDelay: 1000,
            xhrSetup: (xhr, url) => {
              const targetUrl = attachTokenInQuery
                ? appendTokenToUrl(url, data.token)
                : normalizeStreamPath(url);
              const kind = classifyUrlStage(targetUrl);

              if (kind === "m3u8") {
                setStepTimer("Manifesto", "m3u8", "Carregando manifesto de transmissão...");
                setStatus("Etapa 2/3 (Manifesto .m3u8): baixando manifesto...");
              } else if (kind === "ts") {
                setStepTimer("Segmento", "ts", "Carregando segmento de vídeo...");
              }

              xhr.open("GET", targetUrl, true);
              xhr.setRequestHeader("X-Stream-Token", data.token);
            },
          });
          hlsRef.current = hls;

          hls.on(Hls.Events.MANIFEST_LOADING, () => {
            if (!cancelled) {
              setStepTimer("Manifesto", "m3u8", "Aguardando resposta do servidor de fluxo...");
              setStatus("Etapa 2/3 (Manifesto .m3u8): aguardando manifesto...");
            }
          });

          hls.on(Hls.Events.FRAG_LOADING, (_ev, fragData) => {
            if (!cancelled) {
              const sn = fragData.frag?.sn ?? "?";
              setStepTimer("Segmento", "ts", `Carregando segmento #${sn}...`);
              setStatus(`Etapa 3/3 (Segmento .ts): carregando segmento #${sn}...`);
            }
          });

          hls.on(Hls.Events.FRAG_LOADED, (_ev, fragData) => {
            if (!cancelled) {
              const sn = fragData.frag?.sn ?? "?";
              const loadTime = fragData.frag?.stats
                ? Math.round(fragData.frag.stats.loading.end - fragData.frag.stats.loading.start)
                : 0;
              setDiagDetail(`Segmento #${sn} entregue em ${loadTime}ms`);
              triggerPulse(0.55);
            }
          });

          hls.on(Hls.Events.MANIFEST_PARSED, (_ev, parsedData) => {
            if (!cancelled) {
              const levels = parsedData.levels?.length ?? 1;
              setStage("ativo");
              setStatus("Transmissão ativa (Etapa 3/3: segmentos .ts)");
              setDiagDetail(`Fluxo pronto (${levels} qualidade/nível) · Reprodução disponível`);
              triggerPulse(1);
              video.play().catch(() => {});
            }
          });

          hls.on(Hls.Events.ERROR, (_event, errData) => {
            if (cancelled) return;

            const httpCode = errData.response?.code ? ` · HTTP ${errData.response.code}` : "";

            if (
              errData.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
              errData.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT
            ) {
              setStepTimer(
                "Manifesto",
                errData.fatal ? "erro" : "m3u8",
                `Falha ou atraso no manifesto (${errData.details}${httpCode})`
              );
              setStatus(`Etapa 2/3 (Manifesto .m3u8): ${errData.details}${httpCode}`);
            } else if (
              errData.details === Hls.ErrorDetails.FRAG_LOAD_ERROR ||
              errData.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT
            ) {
              setStepTimer(
                "Segmento",
                errData.fatal ? "erro" : "ts",
                `Falha ou atraso no segmento (${errData.details}${httpCode})`
              );
              setStatus(`Etapa 3/3 (Segmento .ts): ${errData.details}${httpCode}`);
            } else {
              setDiagDetail(`Evento de fluxo: ${errData.details}${httpCode}`);
            }

            if (errData.fatal) {
              setStage("erro");
              setErrorMsg(`${errData.details}${httpCode}`);
              setStatus("Reconectando ao fluxo...");
              if (errData.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (errData.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                hls.destroy();
                retryTimeout = setTimeout(initStream, 2000);
              }
            }
          });

          hls.loadSource(sourceUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          setStepTimer("Manifesto", "m3u8", "Usando suporte nativo HLS do navegador");
          video.src = sourceUrl;
          video.addEventListener("loadedmetadata", () => {
            if (!cancelled) {
              setStage("ativo");
              setStatus("Transmissão ativa (HLS nativo)");
              setDiagDetail("Fluxo pronto · Reprodução disponível");
              triggerPulse(0.9);
              video.play().catch(() => {});
            }
          });
        } else {
          setStage("erro");
          setErrorMsg("Este navegador não suporta reprodução HLS.");
          setDiagDetail("Reprodução indisponível neste dispositivo");
        }
      } catch (err) {
        if (!cancelled && !controller.signal.aborted) {
          const msg = err instanceof Error ? err.message : "Erro inesperado na conexão.";
          setStage("erro");
          setErrorMsg(msg);
          setDiagDetail(msg);
          setStatus("Aguardando nova tentativa...");
          retryTimeout = setTimeout(initStream, 3000);
        }
      }
    }

    initStream();

    return () => {
      cancelled = true;
      controller.abort();
      if (slowStepInterval) clearInterval(slowStepInterval);
      if (retryTimeout) clearTimeout(retryTimeout);
      if (pulseDecayTimeout) clearTimeout(pulseDecayTimeout);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamKey, viewerTier, attachTokenInQuery, reconnectNonce]);

  return (
    <StreamStage
      streamKey={streamKey}
      viewerTier={viewerTier}
      reflectionScale={reflectionScale}
      activityPulse={activityPulse}
    >
      <div
        role="region"
        aria-label={`Player de transmissão ao vivo do canal ${streamKey}`}
        className="w-full space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-300">
          <span className="font-medium text-neutral-100">
            Canal: {streamKey}{" "}
            <span className="text-neutral-400">
              ({viewerTier === "subscriber" ? "Assinante" : "Espectador"})
            </span>
          </span>

          <div className="flex items-center gap-2">
            <span aria-live="polite" className="font-mono text-cyan-300">
              {status}
            </span>
            <button
              type="button"
              onClick={() => setReconnectNonce((n) => n + 1)}
              aria-label={`Reconectar transmissão do canal ${streamKey}`}
              className="rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-neutral-200 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition"
            >
              Reconectar
            </button>
          </div>
        </div>

        <video
          ref={videoRef}
          controls
          playsInline
          muted
          aria-label={`Vídeo ao vivo do canal ${streamKey}`}
          className="w-full rounded-lg bg-black aspect-video object-contain focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        />

        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-800 bg-neutral-900/75 px-3 py-1.5 text-[11px] font-mono text-neutral-300"
        >
          <span>
            ETAPA: <strong className="uppercase text-cyan-300">{stage}</strong> · {diagDetail}
          </span>
          {errorMsg && (
            <span role="alert" className="text-amber-300">
              Aviso: {errorMsg}
            </span>
          )}
        </div>
      </div>
    </StreamStage>
  );
}
