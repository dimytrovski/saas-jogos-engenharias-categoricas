"use client";

import React, { useEffect, useRef, useState } from "react";

interface RealExperienceVideoBgProps {
  src?: string;
  label?: string;
  overlayClassName?: string;
  className?: string;
}

export default function RealExperienceVideoBg({
  src = "/videos/experiencia-background.mp4",
  label = "Ambiente de experiência em execução",
  overlayClassName = "bg-slate-950/65",
  className = "",
}: RealExperienceVideoBgProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [usingStreamFallback, setUsingStreamFallback] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    let cancelled = false;
    let animId = 0;

    const startCanvasVideoStream = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas || typeof canvas.captureStream !== "function") return;

      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let t = 0;
      const drawFrame = () => {
        if (cancelled) return;
        t += 0.025;

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#090d16");
        grad.addColorStop(0.5, "#111c33");
        grad.addColorStop(1, "#06202a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grade dinâmica representando fluxo de sistemas/ambientes
        ctx.strokeStyle = "rgba(56, 189, 248, 0.14)";
        ctx.lineWidth = 1;
        const step = 40;
        const offsetX = (t * 24) % step;
        for (let x = -step; x < canvas.width + step; x += step) {
          ctx.beginPath();
          ctx.moveTo(x + offsetX, 0);
          ctx.lineTo(x + offsetX, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Ondas suaves de experiência concreta ao fundo
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          for (let x = 0; x <= canvas.width; x += 16) {
            const y =
              canvas.height * (0.35 + i * 0.16) +
              Math.sin(x * 0.012 + t * (1.2 + i * 0.35) + i) * 26;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle =
            i === 0
              ? "rgba(74, 222, 128, 0.28)"
              : i === 1
              ? "rgba(96, 165, 250, 0.26)"
              : "rgba(165, 180, 252, 0.22)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        animId = window.requestAnimationFrame(drawFrame);
      };

      drawFrame();

      try {
        const stream = canvas.captureStream(30);
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});
        setUsingStreamFallback(true);
      } catch {
        setUsingStreamFallback(false);
      }
    };

    const handleError = () => {
      startCanvasVideoStream();
    };

    videoEl.addEventListener("error", handleError);
    videoEl.play().catch(() => {
      startCanvasVideoStream();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animId);
      videoEl.removeEventListener("error", handleError);
    };
  }, [src]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950 ${className}`}
    >
      <canvas ref={canvasRef} className="hidden" />
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        data-video-mode={usingStreamFallback ? "live-stream" : "mp4-file"}
        aria-label={label}
        className="h-full w-full object-cover opacity-80"
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </div>
  );
}