"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HlsPlayerProps {
  streamKey?: string;
  manifestUrl?: string;
  token?: string;
}

function toSameOriginHlsUrl(rawUrl: string, token?: string): string {
  let pathWithQuery = rawUrl;
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    pathWithQuery = parsed.pathname.startsWith("/hls/")
      ? `${parsed.pathname}${parsed.search}`
      : parsed.toString();
  } catch {
    pathWithQuery = rawUrl;
  }

  if (!token) return pathWithQuery;

  try {
    const u = new URL(pathWithQuery, window.location.origin);
    if (!u.searchParams.has("token")) {
      u.searchParams.set("token", token);
    }
    return `${u.pathname}${u.search}`;
  } catch {
    const sep = pathWithQuery.includes("?") ? "&" : "?";
    return `${pathWithQuery}${sep}token=${encodeURIComponent(token)}`;
  }
}

export default function HlsPlayer({
  streamKey = "teste",
  manifestUrl,
  token,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<string>("Conectando ao stream...");

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;
    if (!video) return;

    async function start() {
      try {
        let activeToken = token ?? "";
        let activeManifest = manifestUrl ?? `/hls/${streamKey}.m3u8`;

        if (!activeToken) {
          const res = await fetch("/api/stream-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ streamKey }),
          });
          if (res.ok) {
            const data = await res.json();
            activeToken = data.token ?? "";
            activeManifest = data.manifestUrl ?? activeManifest;
          }
        }

        if (cancelled) return;
        const targetManifest = toSameOriginHlsUrl(activeManifest, activeToken);

        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            xhrSetup: (xhr, url) => {
              const authedUrl = toSameOriginHlsUrl(url, activeToken);
              xhr.open("GET", authedUrl, true);
              if (activeToken) {
                xhr.setRequestHeader("X-Stream-Token", activeToken);
              }
            },
          });
          hlsRef.current = hls;

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) {
              setStatus("Transmissão ativa");
              video.play().catch(() => {});
            }
          });

          hls.on(Hls.Events.ERROR, (_ev, err) => {
            if (!cancelled && err.fatal) {
              setStatus(`Erro de fluxo (${err.details}) — reconectando...`);
              if (err.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (err.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              }
            }
          });

          hls.loadSource(targetManifest);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = targetManifest;
          video.addEventListener("loadedmetadata", () => {
            if (!cancelled) {
              setStatus("Transmissão ativa");
              video.play().catch(() => {});
            }
          });
        }
      } catch {
        if (!cancelled) {
          setStatus("Falha ao iniciar fluxo — tentando novamente...");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamKey, manifestUrl, token]);

  return (
    <div className="space-y-2 max-w-2xl">
      <video
        ref={videoRef}
        controls
        playsInline
        muted
        className="w-full rounded bg-black aspect-video"
      />
      <p className="text-sm text-neutral-400">Estado: {status}</p>
    </div>
  );
}
