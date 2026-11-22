"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface UniversalHlsPlayerProps {
  src?: string;
  title?: string;
}

export default function UniversalHlsPlayer({
  src = "/hls/teste.m3u8",
  title = "Live de Jogo Independente",
}: UniversalHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [statusText, setStatusText] = useState("Conectando ao stream...");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    setHasError(false);

    const tryAutoplay = () => {
      video.muted = true;
      video.play().catch(() => {
        setStatusText("Clique em Ativar Som ou Play para iniciar");
      });
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const onLoaded = () => {
        setStatusText("AO VIVO");
        tryAutoplay();
      };
      video.addEventListener("loadedmetadata", onLoaded);
      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
      };
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatusText("AO VIVO");
        tryAutoplay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setHasError(true);
          setStatusText("Aguardando sinal do criador / reconectando...");
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls?.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
          }
        }
      });

      return () => {
        hls?.destroy();
      };
    }

    setHasError(true);
    setStatusText("Dispositivo sem suporte a HLS.");
  }, [src]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted) {
      video.play().catch(() => {});
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current as (HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    }) | null;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen().catch(() => {});
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{title}</h1>
        <span
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            background: hasError ? "#fef3c7" : "#dcfce7",
            color: hasError ? "#92400e" : "#166534",
          }}
        >
          {statusText}
        </span>
      </div>

      <div style={{ position: "relative", background: "#000", borderRadius: 12, overflow: "hidden" }}>
        <video
          ref={videoRef}
          controls
          playsInline
          autoPlay
          muted
          style={{ width: "100%", maxHeight: "72vh", display: "block" }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={toggleMute}
          style={{
            padding: "12px 20px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: muted ? "#2563eb" : "#374151",
            color: "#fff",
          }}
        >
          {muted ? "Ativar Som" : "Silenciar"}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          style={{
            padding: "12px 20px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            cursor: "pointer",
            background: "#fff",
            color: "#111827",
          }}
        >
          Tela Cheia
        </button>
      </div>
    </div>
  );
}
