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
      title: "GridFlow 3D: Simulacao de Subestacoes",
      discipline: "Engenharia Eletrica & Energia",
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
      lastServerSync: serverRenderedAt
    },
    {
      id: "eng-sim-02",
      code: "ENG-204",
      title: "BridgeLoad Pro: Tensao & Resiliencia Estrutural",
      discipline: "Engenharia Civil & Estrutural",
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
      lastServerSync: serverRenderedAt
    },
    {
      id: "eng-sim-03",
      code: "ENG-309",
      title: "PipeLineOps: Escoamento & Controle Industrial",
      discipline: "Engenharia Mecanica & Controle",
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
      lastServerSync: serverRenderedAt
    },
    {
      id: "eng-sim-04",
      code: "ENG-412",
      title: "CloudScale Lab: Distribuicao & Telemetria",
      discipline: "Engenharia de Software & Nuvem",
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
      lastServerSync: serverRenderedAt
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
