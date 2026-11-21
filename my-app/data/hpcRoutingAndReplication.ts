export interface PttReplicaNode {
  id: string;
  regionCode: string;
  pttOrIxReference: string;
  targetGeography: string;
  replicasCount: number;
  baseLatencyMs: number;
  hpcComputeTier: "Edge HPC Low-Jitter" | "Regional Replication Mesh" | "Global Failover Node";
  upstreamPartnerType: "Publisher / Studio Endpoint" | "Independent Dedicated Server" | "Cloud / Edge API";
  peaceAndPrudenceNote: string;
}

export const PTT_REPLICA_NODES: PttReplicaNode[] = [
  {
    id: "ptt-br-north-east",
    regionCode: "BR-Norte / Costa Atlântica",
    pttOrIxReference: "PTT-Regional / Cabo Submarino & Rota BR",
    targetGeography: "Norte, Nordeste e conexões regionais do Brasil",
    replicasCount: 4,
    baseLatencyMs: 18,
    hpcComputeTier: "Edge HPC Low-Jitter",
    upstreamPartnerType: "Independent Dedicated Server",
    peaceAndPrudenceNote:
      "Evita saltos longos desnecessários e mantém réplicas enxutas com escalonamento sob demanda.",
  },
  {
    id: "ptt-br-saopaulo",
    regionCode: "BR-Sudeste (SP)",
    pttOrIxReference: "IX.br São Paulo (Maior PTT da América Latina)",
    targetGeography: "Brasil, Cone Sul e rotas principais de cloud/servidores",
    replicasCount: 6,
    baseLatencyMs: 12,
    hpcComputeTier: "Regional Replication Mesh",
    upstreamPartnerType: "Publisher / Studio Endpoint",
    peaceAndPrudenceNote:
      "Alta conectividade entre operadoras (ASNs) reduz jitter e dá previsibilidade sem exigir hardware ocioso.",
  },
  {
    id: "ptt-us-east-va",
    regionCode: "US-East (Virgínia / Miami Hub)",
    pttOrIxReference: "Equinix / NAP of the Americas & US-East IX",
    targetGeography: "América do Norte, Caribe e tráfego internacional",
    replicasCount: 5,
    baseLatencyMs: 24,
    hpcComputeTier: "Global Failover Node",
    upstreamPartnerType: "Cloud / Edge API",
    peaceAndPrudenceNote:
      "Atua como rota internacional secundária com failover automático e teto de custo controlado.",
  },
  {
    id: "ptt-eu-central",
    regionCode: "EU-Central (Frankfurt / Amsterdã)",
    pttOrIxReference: "DE-CIX Frankfurt / AMS-IX",
    targetGeography: "Europa e comunidades globais multi-fuso",
    replicasCount: 4,
    baseLatencyMs: 21,
    hpcComputeTier: "Regional Replication Mesh",
    upstreamPartnerType: "Independent Dedicated Server",
    peaceAndPrudenceNote:
      "Mantém grupos de jogadores em geografias distintas alinhados com baixa variação de resposta.",
  },
];

export interface UpstreamBalancerTarget {
  id: string;
  name: string;
  category: "Ecossistema EA / Esportes" | "Ecossistema Ubisoft / Mundo Aberto" | "Servidores Independentes / APIs";
  integrationMode: string;
  weightPct: number;
  healthStatus: "Nominal" | "Otimizado" | "Fallback Seguro";
}

export const UPSTREAM_BALANCER_TARGETS: UpstreamBalancerTarget[] = [
  {
    id: "upstream-ea-ecosystem",
    name: "Rota de Telemetria & Status (Ecossistema EA)",
    category: "Ecossistema EA / Esportes",
    integrationMode: "Consulta de status/rotas públicas e preparação pré-partida sem acoplamento frágil",
    weightPct: 35,
    healthStatus: "Nominal",
  },
  {
    id: "upstream-ubisoft-ecosystem",
    name: "Rota de Sessão & Sincronia (Ecossistema Ubisoft)",
    category: "Ecossistema Ubisoft / Mundo Aberto",
    integrationMode: "Balanceamento de contexto, lobbies e continuidade de sessão no edge do microSaaS",
    weightPct: 30,
    healthStatus: "Otimizado",
  },
  {
    id: "upstream-independent-servers",
    name: "Servidores Independentes & APIs de Otimização",
    category: "Servidores Independentes / APIs",
    integrationMode: "Conexão direta via APIs REST/WebSocket e réplicas próprias com health check e fallback",
    weightPct: 35,
    healthStatus: "Fallback Seguro",
  },
];