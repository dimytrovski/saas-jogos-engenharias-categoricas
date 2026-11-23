"use client";

import React, { useMemo, useState } from "react";
import {
  PTT_REPLICA_NODES,
  UPSTREAM_BALANCER_TARGETS,
  type PttReplicaNode,
  type UpstreamBalancerTarget,
} from "@/data/hpcRoutingAndReplication";

interface RouteCalculationResponse {
  routeId: string;
  routingPrecisionPct: number;
  connectedGeographies: string[];
  guidance: string;
}

interface RealPingMeasurement {
  rttMs: number;
  samplesMs: number[];
  measuredAt: string;
}

export default function HpcMeshAndGatewayBalancer() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    PTT_REPLICA_NODES[1].id
  );
  const [selectedUpstreamId, setSelectedUpstreamId] = useState<string>(
    UPSTREAM_BALANCER_TARGETS[2].id
  );
  const [geoInput, setGeoInput] = useState<string>(
    "MacapÃ¡ / Brasil, SÃ£o Paulo, Miami, Lisboa"
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [pinging, setPinging] = useState<boolean>(false);
  const [calcResult, setCalcResult] = useState<RouteCalculationResponse | null>(
    null
  );
  const [realPing, setRealPing] = useState<RealPingMeasurement | null>(null);

  const activeNode: PttReplicaNode = useMemo(
    () =>
      PTT_REPLICA_NODES.find((n) => n.id === selectedNodeId) ??
      PTT_REPLICA_NODES[1],
    [selectedNodeId]
  );

  const activeUpstream: UpstreamBalancerTarget = useMemo(
    () =>
      UPSTREAM_BALANCER_TARGETS.find((u) => u.id === selectedUpstreamId) ??
      UPSTREAM_BALANCER_TARGETS[2],
    [selectedUpstreamId]
  );

  const totalReplicas = useMemo(
    () => PTT_REPLICA_NODES.reduce((acc, n) => acc + n.replicasCount, 0),
    []
  );

  async function handleComputeOptimalRoute() {
    setLoading(true);
    try {
      const geographies = geoInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/hpc-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredRegionId: activeNode.id,
          targetUpstreamId: activeUpstream.id,
          playerGeographies: geographies,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCalcResult({
          routeId: data.routeId,
          routingPrecisionPct: data.routingPrecisionPct,
          connectedGeographies: data.connectedGeographies,
          guidance: data.guidance,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMeasureRealBrowserPing() {
    setPinging(true);
    try {
      const samples: number[] = [];
      const rounds = 3;

      for (let i = 0; i < rounds; i++) {
        const start = performance.now();
        await fetch(`/api/hpc-route?ping=1&node=${encodeURIComponent(activeNode.id)}&r=${i}`, {
          method: "GET",
          cache: "no-store",
        });
        const elapsed = Number((performance.now() - start).toFixed(1));
        samples.push(elapsed);
      }

      const avgRtt = Number(
        (samples.reduce((sum, v) => sum + v, 0) / samples.length).toFixed(1)
      );

      setRealPing({
        rttMs: avgRtt,
        samplesMs: samples,
        measuredAt: new Date().toLocaleTimeString("pt-BR"),
      });
    } finally {
      setPinging(false);
    }
  }

  return (
    <section
      id="malha-hpc-ptt-balanceador"
      aria-label="Servidores de baixa latÃªncia HPC, mÃºltiplas rÃ©plicas, PTTs e balanceador com servidores externos"
      className="w-full max-w-6xl mx-auto mt-10 rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-md text-left space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-cyan-800 text-white mb-1">
            Baixa LatÃªncia â€¢ HPC â€¢ RÃ©plicas &amp; PTTs â€¢ Balanceador
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Malha de RÃ©plicas, PTTs e Balanceamento com Servidores e APIs
          </h2>
          
        </div>

        <div className="rounded-xl bg-slate-950 text-white px-4 py-2.5 text-xs shrink-0 space-y-1">
          <div className="font-bold uppercase tracking-wider text-cyan-400">
            RÃ©plicas Ativas na Malha
          </div>
          <div className="text-xl font-black text-white">
            {totalReplicas} rÃ©plicas{" "}
            <span className="text-xs font-semibold text-emerald-400">
              (~{activeNode.baseLatencyMs}ms base)
            </span>
          </div>
          <div className="text-[11px] text-slate-300">
            {realPing
              ? `Ping real medido: ${realPing.rttMs} ms (${realPing.measuredAt})`
              : "Destino encapsulado: VAULT-BRL-NUBANK-PROTECTED"}
          </div>
        </div>
      </div>

      {/* SeleÃ§Ã£o de NÃ³ PTT/RÃ©plica + Balanceador Upstream + Geografias */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
            1. Selecione o NÃ³ PrÃ³ximo a PTT &amp; RÃ©plicas HPC
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PTT_REPLICA_NODES.map((node) => {
              const selected = node.id === activeNode.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                    selected
                      ? "border-cyan-700 bg-cyan-50/70 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-slate-900">
                      {node.regionCode}
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      ~{node.baseLatencyMs}ms
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-cyan-900 mt-1">
                    {node.pttOrIxReference}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {node.replicasCount} rÃ©plicas â€¢ {node.hpcComputeTier}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <label
              htmlFor="multi-geo-input"
              className="block text-xs font-extrabold text-slate-800 mb-1"
            >
              Geografias dos jogadores conectados (separadas por vÃ­rgula)
            </label>
            <input
              id="multi-geo-input"
              type="text"
              value={geoInput}
              onChange={(e) => setGeoInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
            />
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl bg-slate-950 text-white p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              2. Balanceador de Carga (EA, Ubisoft &amp; Independentes)
            </div>
            <label
              htmlFor="upstream-balancer-select"
              className="block text-[11px] text-slate-300"
            >
              Alvo / Perfil de IntegraÃ§Ã£o
            </label>
            <select
              id="upstream-balancer-select"
              value={selectedUpstreamId}
              onChange={(e) => setSelectedUpstreamId(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
            >
              {UPSTREAM_BALANCER_TARGETS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.weightPct}% peso)
                </option>
              ))}
            </select>

            <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs space-y-1">
              <div className="font-bold text-sky-300">{activeUpstream.name}</div>
              <div className="text-slate-300">{activeUpstream.integrationMode}</div>
              <div className="text-[11px] text-emerald-400">
                Estado: {activeUpstream.healthStatus} â€¢ Peso: {activeUpstream.weightPct}%
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleComputeOptimalRoute}
              disabled={loading}
              className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-extrabold py-2.5 px-4 text-xs sm:text-sm transition cursor-pointer"
            >
              {loading
                ? "Calculando rota de alta precisÃ£o..."
                : "Otimizar Rota, RÃ©plicas & Balanceamento"}
            </button>

            <button
              type="button"
              onClick={handleMeasureRealBrowserPing}
              disabled={pinging}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-cyan-300 border border-slate-700 font-extrabold py-2 px-4 text-xs transition cursor-pointer"
            >
              {pinging
                ? "Medindo ping real (3 amostras)..."
                : "Medir LatÃªncia Real no Navegador (3x)"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de alvos do balanceador */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {UPSTREAM_BALANCER_TARGETS.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1"
          >
            <div className="font-extrabold text-slate-900">{u.name}</div>
            <div className="text-[11px] font-bold text-cyan-800">{u.category}</div>
            <p className="text-slate-700">{u.integrationMode}</p>
          </div>
        ))}
      </div>

      {realPing && (
        <div className="rounded-xl bg-cyan-950 text-cyan-100 border border-cyan-800 p-4 text-xs space-y-1">
          <div className="font-extrabold uppercase tracking-wider text-cyan-300">
            MediÃ§Ã£o Real no Navegador â€¢ {realPing.measuredAt}
          </div>
          <p>
            <strong>MÃ©dia RTT real (navegador â†” servidor):</strong>{" "}
            <span className="text-white font-black">{realPing.rttMs} ms</span> â€¢{" "}
            <strong>Amostras:</strong>{" "}
            <span className="font-mono">{realPing.samplesMs.join(" ms, ")} ms</span>
          </p>
        </div>
      )}

      {calcResult && (
        <div className="rounded-xl bg-slate-950 text-white p-4 text-xs space-y-1.5">
          <div className="font-extrabold uppercase tracking-wider text-emerald-400">
            Rota HPC &amp; PTT Validada â€¢ {calcResult.routeId}
          </div>
          <p>
            <strong>PrecisÃ£o estimada de roteamento:</strong>{" "}
            <span className="text-cyan-300 font-black">
              {calcResult.routingPrecisionPct}%
            </span>{" "}
            â€¢ <strong>Geografias alinhadas:</strong>{" "}
            {calcResult.connectedGeographies.join(" â€¢ ")}
          </p>
          <p className="text-slate-300">{calcResult.guidance}</p>
          <p className="text-[11px] text-amber-300">
            PrudÃªncia &amp; Paz: {activeNode.peaceAndPrudenceNote}
          </p>
        </div>
      )}
    </section>
  );
}
