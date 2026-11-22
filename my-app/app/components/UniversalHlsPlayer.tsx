"use client";

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Hls from "hls.js";

interface PlayerProps {
  initialSrc?: string;
  src?: string;
  title?: string;
  glowStyle?: string;
}

export interface UniversalHlsPlayerHandle {
  loadStream: (src: string) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
}

export default forwardRef<UniversalHlsPlayerHandle, PlayerProps>(function UniversalHlsPlayer(
  { initialSrc, src, title = "Player", glowStyle = "0 0 24px rgba(59,130,246,0.25)" },
  ref
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const effectiveSrc = initialSrc ?? src ?? "";

  useImperativeHandle(ref, () => ({
    loadStream(nextSrc: string) {
      if (videoRef.current) {
        videoRef.current.src = nextSrc;
        videoRef.current.play().catch((e) => console.log("Autoplay prevented", e));
      }
    },
    toggleMute() {
      if (videoRef.current) {
        videoRef.current.muted = !videoRef.current.muted;
      }
    },
    toggleFullscreen() {
      const target = containerRef.current ?? videoRef.current;
      if (!target) return;
      if (!document.fullscreenElement && target.requestFullscreen) {
        target.requestFullscreen().catch((e) => console.log("Fullscreen blocked", e));
      } else if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    },
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveSrc) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(effectiveSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log("Auto-play inicial bloqueado", e));
      });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = effectiveSrc;
    } else {
      video.src = effectiveSrc;
    }
  }, [effectiveSrc]);

  return (
    <div
      ref={containerRef}
      style={{
        background: "#000",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: glowStyle,
        border: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
      }}
    >
      {title ? (
        <div
          style={{
            padding: "8px 14px",
            fontSize: 13,
            color: "#e5e7eb",
            background: "rgba(17, 24, 39, 0.85)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {title}
        </div>
      ) : null}
      <video
        ref={videoRef}
        controls
        playsInline
        style={{ width: "100%", display: "block", background: "#000" }}
      />
    </div>
  );
});