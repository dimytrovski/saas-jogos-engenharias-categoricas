"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export interface ServerNode {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  latencyMs: number;
  loadPct: number;
  platformFocus: string;
  reflectionPrompt: string;
}

const DEFAULT_NODES: ServerNode[] = [
  {
    id: "br-ap-am",
    name: "Norte / Amazônia Edge",
    region: "Macapá / Belém",
    lat: 0.03,
    lon: -51.07,
    latencyMs: 14,
    loadPct: 38,
    platformFocus: "Streaming Low-Latency & Pro Clubs / Cloud",
    reflectionPrompt:
      "Hospedar perto da borda local reduz o jitter de rede para jogadores regionais e evita saltos desnecessários por rotas internacionais.",
  },
  {
    id: "br-sp",
    name: "Sudeste Core Hub",
    region: "São Paulo",
    lat: -23.55,
    lon: -46.63,
    latencyMs: 28,
    loadPct: 64,
    platformFocus: "RTMP Ingestion, HLS Packaging & Auth Edge",
    reflectionPrompt:
      "Concentrar a ingestão RTMP e a validação de tokens num hub principal facilita a observabilidade, mas exige redundância para picos de audiência.",
  },
  {
    id: "us-east",
    name: "US-East Backbone",
    region: "Ashburn / Virginia",
    lat: 39.04,
    lon: -77.48,
    latencyMs: 92,
    loadPct: 52,
    platformFocus: "Multi-Platform Relay & Global CDN",
    reflectionPrompt:
      "O alcance global de um backbone norte-americano amplia a distribuição, mas o custo de egress e a latência de ida e volta impactam transmissões interativas.",
  },
  {
    id: "eu-west",
    name: "EU-West Sovereign Node",
    region: "Frankfurt / Dublin",
    lat: 50.11,
    lon: 8.68,
    latencyMs: 148,
    loadPct: 44,
    platformFocus: "Compliance, Licenciamento & Transcoding",
    reflectionPrompt:
      "Escolher um nó europeu reflete prioridades de governança e conformidade regulatória — vale pesar o ganho de políticas contra o atraso de rota.",
  },
  {
    id: "ap-east",
    name: "AP-East Broadcast Relay",
    region: "Tóquio / Singapura",
    lat: 35.68,
    lon: 139.69,
    latencyMs: 215,
    loadPct: 49,
    platformFocus: "Torneios Globais & Espelhos de Segmentos",
    reflectionPrompt:
      "Replicar segmentos HLS apenas quando há demanda real evita desperdício de CPU e banda em regiões com baixa audiência ativa.",
  },
];

interface EarthHologramProps {
  nodes?: ServerNode[];
  selectedNodeId?: string;
  onSelectNode?: (node: ServerNode) => void;
  activePlatform?: string;
}

function latLonToVec3(lat: number, lon: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return { x, y, z };
}

function rotateY(v: { x: number; y: number; z: number }, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos + v.z * sin,
    y: v.y,
    z: -v.x * sin + v.z * cos,
  };
}

export default function EarthHologram({
  nodes = DEFAULT_NODES,
  selectedNodeId,
  onSelectNode,
  activePlatform = "RTMP → HLS / Licenciamento de Fluxo",
}: EarthHologramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    selectedNodeId ?? nodes[0]?.id ?? ""
  );
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationOffset, setRotationOffset] = useState<number>(0.65);

  const activeId = selectedNodeId ?? internalSelectedId;
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === activeId) ?? nodes[0],
    [nodes, activeId]
  );

  const handleSelect = (node: ServerNode) => {
    setInternalSelectedId(node.id);
    onSelectNode?.(node);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let angle = rotationOffset;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (autoRotate) {
        angle += dt * 0.28;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(260, rect.width);
      const height = Math.max(260, rect.height);

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;
      const radius = Math.min(width, height) * 0.36;
      const fov = radius * 2.6;

      // Halo holográfico externo
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.38);
      glow.addColorStop(0, "rgba(34, 211, 238, 0.14)");
      glow.addColorStop(0.6, "rgba(56, 189, 248, 0.05)");
      glow.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.38, 0, Math.PI * 2);
      ctx.fill();

      // Contorno da esfera
      ctx.strokeStyle = "rgba(34, 211, 238, 0.35)";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Linhas de latitude e longitude (malha holográfica)
      ctx.lineWidth = 0.7;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 12) {
          const p3 = rotateY(latLonToVec3(lat, lon, radius), angle);
          if (p3.z > -radius * 0.15) {
            const scale = fov / (fov + p3.z);
            const sx = cx + p3.x * scale;
            const sy = cy - p3.y * scale;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = lat === 0 ? "rgba(34, 211, 238, 0.28)" : "rgba(34, 211, 238, 0.12)";
        ctx.stroke();
      }

      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 10) {
          const p3 = rotateY(latLonToVec3(lat, lon, radius), angle);
          if (p3.z > -radius * 0.15) {
            const scale = fov / (fov + p3.z);
            const sx = cx + p3.x * scale;
            const sy = cy - p3.y * scale;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = "rgba(34, 211, 238, 0.12)";
        ctx.stroke();
      }

      // Varredura horizontal sutil (scanline holográfico)
      const scanY = cy + Math.sin(now * 0.0014) * (radius * 0.85);
      ctx.strokeStyle = "rgba(103, 232, 249, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius * 1.05, scanY);
      ctx.lineTo(cx + radius * 1.05, scanY);
      ctx.stroke();

      // Arcos de rota entre o nó selecionado e os demais nós
      if (selectedNode) {
        const origin3 = rotateY(latLonToVec3(selectedNode.lat, selectedNode.lon, radius), angle);
        for (const target of nodes) {
          if (target.id === selectedNode.id) continue;
          const dest3 = rotateY(latLonToVec3(target.lat, target.lon, radius), angle);
          if (origin3.z > 0 || dest3.z > 0) {
            const s1 = fov / (fov + origin3.z);
            const s2 = fov / (fov + dest3.z);
            const x1 = cx + origin3.x * s1;
            const y1 = cy - origin3.y * s1;
            const x2 = cx + dest3.x * s2;
            const y2 = cy - dest3.y * s2;

            const midX = (x1 + x2) * 0.5;
            const midY = (y1 + y2) * 0.5 - radius * 0.22;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(midX, midY, x2, y2);
            ctx.strokeStyle = "rgba(56, 189, 248, 0.32)";
            ctx.lineWidth = 1.1;
            ctx.stroke();

            // Pulso viajando ao longo do arco
            const t = (now * 0.00065) % 1;
            const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
            const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * midY + t * t * y2;
            ctx.fillStyle = "rgba(165, 243, 252, 0.9)";
            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Nós de servidores no globo
      for (const node of nodes) {
        const p3 = rotateY(latLonToVec3(node.lat, node.lon, radius), angle);
        if (p3.z < -radius * 0.05) continue;

        const scale = fov / (fov + p3.z);
        const sx = cx + p3.x * scale;
        const sy = cy - p3.y * scale;
        const isSelected = node.id === selectedNode?.id;
        const pulse = 1 + Math.sin(now * 0.005) * 0.25;

        if (isSelected) {
          ctx.strokeStyle = "rgba(34, 211, 238, 0.65)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx, sy, 8 * pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = isSelected ? "#67e8f9" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(sx, sy, isSelected ? 4.5 : 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = isSelected ? "#ecfeff" : "rgba(186, 230, 253, 0.78)";
        ctx.fillText(`${node.region} (${node.latencyMs}ms)`, sx + 8, sy + 3);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [nodes, selectedNode, autoRotate, rotationOffset]);

  return (
    <section
      aria-label="Holograma reflexivo de servidores globais"
      className="w-full max-w-6xl mx-auto rounded-2xl border border-cyan-500/20 bg-neutral-950/90 text-neutral-100 p-4 sm:p-6 shadow-2xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-400/90">
            Holograma de Infraestrutura &amp; Reflexão de Hospedagem
          </p>
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            {activePlatform}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 text-cyan-200 hover:bg-cyan-900/50 transition"
          >
            {autoRotate ? "Pausar rotação" : "Retomar rotação"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAutoRotate(false);
              setRotationOffset((prev) => prev + 0.45);
            }}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-300 hover:bg-neutral-800 transition"
          >
            Girar eixo
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 relative flex items-center justify-center rounded-xl bg-gradient-to-b from-cyan-950/20 via-neutral-950 to-neutral-950 border border-neutral-800/80 min-h-[300px] sm:min-h-[380px]">
          <canvas
            ref={canvasRef}
            className="w-full h-[300px] sm:h-[380px] block"
          />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-neutral-400">
              Selecione um nó para refletir sobre o hospedeiro:
            </span>
            <div className="flex flex-wrap gap-2">
              {nodes.map((node) => {
                const active = node.id === selectedNode?.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelect(node)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                      active
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                        : "border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                    }`}
                  >
                    {node.region}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedNode && (
            <div className="rounded-xl border border-cyan-500/25 bg-neutral-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-cyan-200">
                  {selectedNode.name}
                </h3>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/20 px-2 py-0.5 rounded">
                  ~{selectedNode.latencyMs} ms
                </span>
              </div>

              <p className="text-xs text-neutral-400">
                <strong className="text-neutral-200">Foco:</strong> {selectedNode.platformFocus} ·{" "}
                <strong className="text-neutral-200">Carga:</strong> {selectedNode.loadPct}%
              </p>

              <blockquote className="border-l-2 border-cyan-400/70 pl-3 text-sm leading-relaxed text-neutral-200">
                {selectedNode.reflectionPrompt}
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
