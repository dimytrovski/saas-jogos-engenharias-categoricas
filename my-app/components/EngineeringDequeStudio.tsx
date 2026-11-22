"use client";

import React, { useMemo, useState } from "react";

export type DeliveryMode = "disco_console" | "streaming_nuvem" | "hibrido";
export type SdlcStage =
  | "Planejamento & Escopo"
  | "Build & Empacotamento"
  | "Verificacao de Protocolos"
  | "Licenca Ativa em Producao";

export interface EngineeringGameNode {
  id: string;
  code: string;
  title: string;
  discipline: string;
  stockUnits: number;
  priceBrl: number;
  diskSizeGb: number;
  cloudBitrateMbps: number;
  sdlcProgress: number;
  sdlcStage: SdlcStage;
  protocols: {
    hmacWebhook: boolean;
    streamTokenGating: boolean;
    chunkIntegritySha256: boolean;
    sessionLeaseSync: boolean;
  };
  licenseActive: boolean;
  deliveryMode: DeliveryMode;
  lastServerSync: string;
}

interface EngineeringDequeStudioProps {
  initialDeque: EngineeringGameNode[];
  serverRenderedAt: string;
}

const SDLC_STAGES: { label: SdlcStage; pct: number }[] = [
  { label: "Planejamento & Escopo", pct: 25 },
  { label: "Build & Empacotamento", pct: 50 },
  { label: "Verificacao de Protocolos", pct: 75 },
  { label: "Licenca Ativa em Producao", pct: 100 }
];

function formatBrl(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function deliveryLabel(mode: DeliveryMode) {
  if (mode === "disco_console") return "Disco / Console Local";
  if (mode === "streaming_nuvem") return "Streaming em Nuvem";
  return "Hibrido (Disco + Nuvem)";
}

export default function EngineeringDequeStudio({
  initialDeque,
  serverRenderedAt
}: EngineeringDequeStudioProps) {
  const [deque, setDeque] = useState<EngineeringGameNode[]>(initialDeque);
  const [selectedId, setSelectedId] = useState<string>(initialDeque[0]?.id ?? "");
  const [activeDelivery, setActiveDelivery] = useState<DeliveryMode>("hibrido");
  const [customTitle, setCustomTitle] = useState("");
  const [customDiscipline, setCustomDiscipline] = useState("Engenharia de Controle");
  const [customPrice, setCustomPrice] = useState("149.90");
  const [eventLog, setEventLog] = useState<string[]>([
    `[SSR ${serverRenderedAt}] Deque inicializado com ${initialDeque.length} modulos de Engenharia nos servidores.`
  ]);

  const selectedNode = useMemo(
    () => deque.find((item) => item.id === selectedId) ?? deque[0] ?? null,
    [deque, selectedId]
  );

  const pushLog = (msg: string) => {
    const now = new Date().toLocaleTimeString("pt-BR");
    setEventLog((prev) => [`[${now}] ${msg}`, ...prev.slice(0, 11)]);
  };

  // Rotacao circular na estrutura Deque (Double-Ended Queue)
  const rotateDeque = (direction: "front_to_rear" | "rear_to_front") => {
    if (deque.length <= 1) return;
    setDeque((prev) => {
      const copy = [...prev];
      if (direction === "front_to_rear") {
        const first = copy.shift()!;
        copy.push(first);
      } else {
        const last = copy.pop()!;
        copy.unshift(last);
      }
      return copy;
    });
    pushLog(
      direction === "front_to_rear"
        ? "DEQUE: Elemento do FRONT circulou para o REAR (popFront -> pushRear)."
        : "DEQUE: Elemento do REAR circulou para o FRONT (popBack -> pushFront)."
    );
  };

  // Inserir novo jogo de engenharia no FRONT ou no REAR do Deque
  const insertNode = (end: "front" | "rear") => {
    const title = customTitle.trim() || `Simulador ${customDiscipline} v2.4`;
    const price = Math.max(19.9, Number(customPrice) || 149.9);
    const id = `eng-${Date.now().toString(36)}`;
    const code = `ENG-${Math.floor(100 + Math.random() * 899)}`;

    const newNode: EngineeringGameNode = {
      id,
      code,
      title,
      discipline: customDiscipline,
      stockUnits: 45,
      priceBrl: price,
      diskSizeGb: 18.4,
      cloudBitrateMbps: 14.5,
      sdlcProgress: 25,
      sdlcStage: "Planejamento & Escopo",
      protocols: {
        hmacWebhook: true,
        streamTokenGating: true,
        chunkIntegritySha256: true,
        sessionLeaseSync: true
      },
      licenseActive: false,
      deliveryMode: activeDelivery,
      lastServerSync: new Date().toLocaleTimeString("pt-BR")
    };

    setDeque((prev) => (end === "front" ? [newNode, ...prev] : [...prev, newNode]));
    setSelectedId(id);
    setCustomTitle("");
    pushLog(
      `DEQUE ${end.toUpperCase()}: Inserido "${title}" (${code}) no estoque do servidor.`
    );
  };

  // Remover da extremidade FRONT ou REAR
  const removeEnd = (end: "front" | "rear") => {
    if (deque.length === 0) return;
    const target = end === "front" ? deque[0] : deque[deque.length - 1];
    const remaining =
      end === "front" ? deque.slice(1) : deque.slice(0, deque.length - 1);
    setDeque(remaining);
    if (selectedId === target.id) {
      setSelectedId(remaining[0]?.id ?? "");
    }
    pushLog(`DEQUE ${end.toUpperCase()}: Removido "${target.title}" da fila ativa.`);
  };

  // Comprar do estoque do servidor, baixar (Disco/Console, Nuvem ou Hibrido) e ativar licenca SDLC
  const purchaseAndDownload = (nodeId: string, mode: DeliveryMode) => {
    setDeque((prev) =>
      prev.map((item) => {
        if (item.id !== nodeId) return item;
        if (item.stockUnits <= 0) {
          pushLog(`ESTOQUE ESGOTADO para ${item.code} (${item.title}).`);
          return item;
        }
        const nextStock = item.stockUnits - 1;
        const nextProgress = Math.min(100, item.sdlcProgress === 100 ? 100 : Math.max(item.sdlcProgress + 25, 75));
        const stageObj =
          nextProgress >= 100
            ? SDLC_STAGES[3]
            : nextProgress >= 75
              ? SDLC_STAGES[2]
              : SDLC_STAGES[1];

        pushLog(
          `COMPRA & DOWNLOAD [${deliveryLabel(mode)}]: "${item.title}" baixado do servidor. Estoque restante: ${nextStock}. Licenca producao garantida.`
        );

        return {
          ...item,
          stockUnits: nextStock,
          deliveryMode: mode,
          licenseActive: true,
          sdlcProgress: stageObj.pct,
          sdlcStage: stageObj.label,
          lastServerSync: new Date().toLocaleTimeString("pt-BR")
        };
      })
    );
  };

  // Avancar estagio do ciclo de vida do software (SDLC) e garantir licenca de producao
  const advanceSdlcStage = (nodeId: string) => {
    setDeque((prev) =>
      prev.map((item) => {
        if (item.id !== nodeId) return item;
        const currentIdx = SDLC_STAGES.findIndex((s) => s.label === item.sdlcStage);
        const nextStage =
          SDLC_STAGES[Math.min(SDLC_STAGES.length - 1, Math.max(0, currentIdx + 1))];
        const active = nextStage.pct === 100 || item.licenseActive;
        pushLog(
          `SDLC [${item.code}]: Progresso atualizado para ${nextStage.pct}% (${nextStage.label}).`
        );
        return {
          ...item,
          sdlcStage: nextStage.label,
          sdlcProgress: nextStage.pct,
          licenseActive: active,
          lastServerSync: new Date().toLocaleTimeString("pt-BR")
        };
      })
    );
  };

  const toggleProtocol = (
    nodeId: string,
    key: keyof EngineeringGameNode["protocols"]
  ) => {
    setDeque((prev) =>
      prev.map((item) => {
        if (item.id !== nodeId) return item;
        const updatedVal = !item.protocols[key];
        pushLog(
          `PROTOCOLO [${item.code}] ${key}: ${updatedVal ? "VALIDADO" : "ALERTA/DESATIVADO"}.`
        );
        return {
          ...item,
          protocols: {
            ...item.protocols,
            [key]: updatedVal
          }
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de controle do Deque & Modalidade de Entrega */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-teal-500/15 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                SSR DINAMICO
              </span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Estrutura: DEQUE (Double-Ended Queue)
              </span>
              <span className="text-xs text-zinc-500">
                Renderizado no servidor: {serverRenderedAt}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Circulacao de Jogos de Engenharia, Estoque em Servidor e Licenca SDLC
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Os modulos circulam entre as extremidades FRONT e REAR. Ao comprar do estoque, o usuario baixa em Disco/Console, Streaming em Nuvem ou ambos, assegurando licenca para producao.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => rotateDeque("rear_to_front")}
              className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Girar &larr; (REAR &rarr; FRONT)
            </button>
            <button
              type="button"
              onClick={() => rotateDeque("front_to_rear")}
              className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Girar &rarr; (FRONT &rarr; REAR)
            </button>
          </div>
        </div>

        {/* Insercao rapida no Deque */}
        <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-zinc-800">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Ex.: Simulador de Rede Eletrica"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <select
            value={customDiscipline}
            onChange={(e) => setCustomDiscipline(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option>Engenharia de Controle</option>
            <option>Engenharia Estrutural</option>
            <option>Engenharia de Software</option>
            <option>Engenharia Eletrica</option>
            <option>Engenharia Mecanica</option>
          </select>
          <input
            type="text"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            placeholder="Preco BRL"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="button"
            onClick={() => insertNode("front")}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:text-zinc-950"
          >
            + Inserir no FRONT
          </button>
          <button
            type="button"
            onClick={() => insertNode("rear")}
            className="rounded-md border border-teal-600 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950/40"
          >
            + Inserir no REAR
          </button>
        </div>
      </section>

      {/* Visualizacao em estrutura DEQUE (FRONT <-> Nos centrais <-> REAR) */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span className="rounded bg-zinc-900 px-2 py-0.5 text-white dark:bg-zinc-100 dark:text-zinc-950">
              FRONT
            </span>
            <span>Fluxo Bidirecional em Deque ({deque.length} nos)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => removeEnd("front")}
              className="rounded border border-zinc-300 px-2 py-1 text-[11px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Remover FRONT
            </button>
            <button
              type="button"
              onClick={() => removeEnd("rear")}
              className="rounded border border-zinc-300 px-2 py-1 text-[11px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Remover REAR
            </button>
            <span className="rounded bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
              REAR
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {deque.map((node, idx) => {
            const isFront = idx === 0;
            const isRear = idx === deque.length - 1;
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedId(node.id)}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  isSelected
                    ? "border-teal-600 bg-teal-50/40 ring-1 ring-teal-600 dark:border-teal-400 dark:bg-teal-950/20 dark:ring-teal-400"
                    : "border-zinc-200 bg-zinc-50/70 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-zinc-500">
                    #{idx + 1} · {node.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {isFront && (
                      <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
                        FRONT
                      </span>
                    )}
                    {isRear && (
                      <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-zinc-300 dark:text-zinc-950">
                        REAR
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="mt-2 text-sm font-semibold leading-snug">{node.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{node.discipline}</p>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatBrl(node.priceBrl)}
                  </span>
                  <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                    Estoque: <strong>{node.stockUnits}</strong>
                  </span>
                </div>

                {/* Barra de progresso SDLC */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>SDLC: {node.sdlcStage}</span>
                    <span className="tabular-nums font-medium">{node.sdlcProgress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full bg-teal-600 transition-all dark:bg-teal-400"
                      style={{ width: `${node.sdlcProgress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-2.5 text-[11px] dark:border-zinc-800">
                  <span
                    className={`font-semibold ${
                      node.licenseActive
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {node.licenseActive ? "Licenca Producao Ativa" : "Aguardando Compra/Ativacao"}
                  </span>
                  <span className="text-zinc-500">{deliveryLabel(node.deliveryMode)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Painel detalhado de Compra, Download (Disco/Console/Nuvem), SDLC e Protocolos */}
      {selectedNode && (
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Coluna 1 & 2: Compra do Estoque, Download e Ciclo de Vida SDLC */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-teal-700 dark:text-teal-400">
                    NO SELECIONADO · {selectedNode.code}
                  </span>
                  <h3 className="text-lg font-semibold">{selectedNode.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pacote Disco/Console: {selectedNode.diskSizeGb} GB · Streaming Nuvem: {selectedNode.cloudBitrateMbps} Mbps · Ultima sincronizacao: {selectedNode.lastServerSync}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold tabular-nums">
                    {formatBrl(selectedNode.priceBrl)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Unidades em servidor: {selectedNode.stockUnits}
                  </div>
                </div>
              </div>

              {/* Seletor de modalidade de aquisicao/download */}
              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Comprar do Estoque do Servidor e Baixar para Uso em Producao:
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {(["disco_console", "streaming_nuvem", "hibrido"] as DeliveryMode[]).map(
                    (mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setActiveDelivery(mode)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                          activeDelivery === mode
                            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                        }`}
                      >
                        {deliveryLabel(mode)}
                      </button>
                    )
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => purchaseAndDownload(selectedNode.id, activeDelivery)}
                    className="rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:text-zinc-950"
                  >
                    Comprar & Baixar ({deliveryLabel(activeDelivery)})
                  </button>
                  <button
                    type="button"
                    onClick={() => advanceSdlcStage(selectedNode.id)}
                    className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    Avancar Estagio SDLC ({selectedNode.sdlcProgress}%)
                  </button>
                </div>
              </div>

              {/* Protocolos auxiliares */}
              <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Respaldo de Protocolos Auxiliares (Clique para alternar validacao):
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["hmacWebhook", "Assinatura HMAC de Webhook"],
                      ["streamTokenGating", "Gating de Stream Token"],
                      ["chunkIntegritySha256", "Integridade de Pacotes (Disco/Nuvem)"],
                      ["sessionLeaseSync", "Sincronizacao de Sessao Ativa"]
                    ] as [keyof EngineeringGameNode["protocols"], string][]
                  ).map(([key, label]) => {
                    const ok = selectedNode.protocols[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleProtocol(selectedNode.id, key)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                          ok
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                        }`}
                      >
                        <span>{label}</span>
                        <span className="font-mono text-[11px] font-bold">
                          {ok ? "OK" : "CHECK"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 3: Telemetria e Registro de Eventos */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold">Telemetria do Deque & Licencas</h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Registro cronologico de movimentacoes, downloads e validacoes.
            </p>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1 font-mono text-[11px]">
              {eventLog.map((entry, i) => (
                <div
                  key={i}
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                >
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
