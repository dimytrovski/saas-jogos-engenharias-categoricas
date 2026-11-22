import React from "react";
import AppNavMenu from "@/components/AppNavMenu";
import EngineeringDequeStudio, {
  EngineeringGameNode
} from "@/components/EngineeringDequeStudio";

export const dynamic = "force-dynamic";

export default async function DequeEngenhariasPage() {
  const serverRenderedAt = new Date().toLocaleTimeString("pt-BR");

  const initialDeque: EngineeringGameNode[] = [
    {
      id: "eng-sim-01",
      code: "ENG-101",
      title: "GridFlow 3D: Transientes em Subestacoes",
      discipline: "Engenharia Eletrica & Energia",
      realWorldProblem: "Analise trifasica, faltas fase-terra e resposta de disjuntores em 60 Hz.",
      stockUnits: 120,
      priceBrl: 189.0,
      diskSizeGb: 24.6,
      cloudBitrateMbps: 16.0,
      sdlcProgress: 75,
      sdlcStage: "Verificacao de Protocolos",
      protocols: {
        hmacWebhook: true,
        streamTokenGating: true,
        chunkIntegritySha256: true,
        sessionLeaseSync: true
      },
      licenseActive: false,
      deliveryMode: "hibrido",
      lastServerSync: serverRenderedAt,
      rawSample: {
        sampleRateHz: 4800,
        primaryMetricLabel: "Tensao Linha",
        primaryMetricValue: "138.4 kV",
        secondaryMetricLabel: "Distorcao THD",
        secondaryMetricValue: "1.82%",
        rawTelemetryFrame: "RAW|ENG-101|VA=79.91kV|VB=79.88kV|VC=79.95kV|FREQ=60.01Hz|CRC=A84E",
        payloadJson: JSON.stringify(
          {
            code: "ENG-101",
            busKv: 138.4,
            frequencyHz: 60.01,
            thdPct: 1.82,
            deliveryTargets: ["disk_console", "cloud_stream", "hybrid"],
            licenseTier: "production_enterprise"
          },
          null,
          2
        )
      }
    },
    {
      id: "eng-sim-02",
      code: "ENG-204",
      title: "BridgeLoad Pro: Trelicas & Tensao Estrutural",
      discipline: "Engenharia Civil & Estrutural",
      realWorldProblem: "Distribuicao de esforcos axiais, flambagem e flecha maxima sob carga movel.",
      stockUnits: 85,
      priceBrl: 159.0,
      diskSizeGb: 19.2,
      cloudBitrateMbps: 14.0,
      sdlcProgress: 100,
      sdlcStage: "Licenca Ativa em Producao",
      protocols: {
        hmacWebhook: true,
        streamTokenGating: true,
        chunkIntegritySha256: true,
        sessionLeaseSync: true
      },
      licenseActive: true,
      deliveryMode: "disco_console",
      lastServerSync: serverRenderedAt,
      rawSample: {
        sampleRateHz: 2000,
        primaryMetricLabel: "Fator Seguranca",
        primaryMetricValue: "2.45x",
        secondaryMetricLabel: "Flecha Central",
        secondaryMetricValue: "11.4 mm",
        rawTelemetryFrame: "RAW|ENG-204|LOAD=420kN|SIGMA_MAX=164MPa|DEFLECT=11.4mm|CRC=7C19",
        payloadJson: JSON.stringify(
          {
            code: "ENG-204",
            appliedLoadKn: 420,
            maxStressMpa: 164,
            safetyFactor: 2.45,
            deliveryTargets: ["disk_console", "cloud_stream", "hybrid"],
            licenseTier: "production_enterprise"
          },
          null,
          2
        )
      }
    },
    {
      id: "eng-sim-03",
      code: "ENG-309",
      title: "PipeLineOps: Escoamento & Malha PID",
      discipline: "Engenharia Mecanica & Controle",
      realWorldProblem: "Controle de pressao, numero de Reynolds e amortecimento de golpe de ariete.",
      stockUnits: 64,
      priceBrl: 219.0,
      diskSizeGb: 28.0,
      cloudBitrateMbps: 18.5,
      sdlcProgress: 50,
      sdlcStage: "Build & Empacotamento",
      protocols: {
        hmacWebhook: true,
        streamTokenGating: true,
        chunkIntegritySha256: true,
        sessionLeaseSync: true
      },
      licenseActive: false,
      deliveryMode: "streaming_nuvem",
      lastServerSync: serverRenderedAt,
      rawSample: {
        sampleRateHz: 1000,
        primaryMetricLabel: "Vazao Volumetrica",
        primaryMetricValue: "312.8 m3/h",
        secondaryMetricLabel: "Pressao Linha",
        secondaryMetricValue: "14.6 bar",
        rawTelemetryFrame: "RAW|ENG-309|Q=312.8m3h|P=14.6bar|RE=1.48e5|PID_OUT=68.2%|CRC=5E02",
        payloadJson: JSON.stringify(
          {
            code: "ENG-309",
            flowRateM3h: 312.8,
            linePressureBar: 14.6,
            reynoldsNumber: 148000,
            deliveryTargets: ["disk_console", "cloud_stream", "hybrid"],
            licenseTier: "production_enterprise"
          },
          null,
          2
        )
      }
    },
    {
      id: "eng-sim-04",
      code: "ENG-412",
      title: "CloudScale Lab: Telemetria & Malha Distribuida",
      discipline: "Engenharia de Software & Nuvem",
      realWorldProblem: "Consistencia de sessoes, vazao de pacotes e validacao criptografica em escala.",
      stockUnits: 200,
      priceBrl: 129.0,
      diskSizeGb: 12.8,
      cloudBitrateMbps: 12.0,
      sdlcProgress: 100,
      sdlcStage: "Licenca Ativa em Producao",
      protocols: {
        hmacWebhook: true,
        streamTokenGating: true,
        chunkIntegritySha256: true,
        sessionLeaseSync: true
      },
      licenseActive: true,
      deliveryMode: "hibrido",
      lastServerSync: serverRenderedAt,
      rawSample: {
        sampleRateHz: 5000,
        primaryMetricLabel: "Throughput",
        primaryMetricValue: "18.4k req/s",
        secondaryMetricLabel: "P99 Latencia",
        secondaryMetricValue: "9.8 ms",
        rawTelemetryFrame: "RAW|ENG-412|RPS=18420|P99=9.8ms|IDEMPOTENCY=OK|HMAC=VERIFIED|CRC=3D8B",
        payloadJson: JSON.stringify(
          {
            code: "ENG-412",
            throughputRps: 18420,
            p99LatencyMs: 9.8,
            idempotencyKey: "eventId",
            deliveryTargets: ["disk_console", "cloud_stream", "hybrid"],
            licenseTier: "production_enterprise"
          },
          null,
          2
        )
      }
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNavMenu />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <EngineeringDequeStudio
          initialDeque={initialDeque}
          serverRenderedAt={serverRenderedAt}
        />
      </main>
    </div>
  );
}
