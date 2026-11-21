export type PlayerProfileType =
  | "Competitivo & Arena"
  | "Mundo Aberto & Exploração"
  | "Sessão Rápida & Cloud"
  | "Estratégia & Rotina";

export interface CloudGameItem {
  id: string;
  title: string;
  profile: PlayerProfileType;
  cloudServerRegion: string;
  sessionMode: "Cloud Stream" | "Servidor Dedicado" | "Híbrido Nuvem/Local";
  platformHint: string;
  reliableFlexibleLink: string;
  capitalRetentionPct: number;
  parkerianBalanceNote: string;
}

export const PLAYER_PROFILES: PlayerProfileType[] = [
  "Competitivo & Arena",
  "Mundo Aberto & Exploração",
  "Sessão Rápida & Cloud",
  "Estratégia & Rotina",
];

export const CLOUD_PROFILE_GAMES: CloudGameItem[] = [
  {
    id: "cloud-arena-fc",
    title: "Arena Pro & Partidas Rápidas",
    profile: "Competitivo & Arena",
    cloudServerRegion: "SA-East / Nuvem Baixa Latência",
    sessionMode: "Servidor Dedicado",
    platformHint: "Xbox • PlayStation • Windows • Cloud",
    reliableFlexibleLink: "/proxima-pagina?perfil=competitivo&modo=cloud-arena",
    capitalRetentionPct: 18,
    parkerianBalanceNote:
      "Equilíbrio entre resposta rápida de servidor, acesso direto sem etapas extras e margem sustentável.",
  },
  {
    id: "cloud-odyssey-world",
    title: "Crônicas em Nuvem & Exploração",
    profile: "Mundo Aberto & Exploração",
    cloudServerRegion: "Global Edge / Nuvem Sob Demanda",
    sessionMode: "Cloud Stream",
    platformHint: "Windows • MacOS • Console • Cloud",
    reliableFlexibleLink: "/proxima-pagina?perfil=exploracao&modo=cloud-stream",
    capitalRetentionPct: 15,
    parkerianBalanceNote:
      "Prioriza continuidade sem sobrecarga visual, preservando o ritmo natural do jogador e a retenção justa.",
  },
  {
    id: "cloud-sprint-30m",
    title: "Sprint 30 Min — Acesso Instantâneo",
    profile: "Sessão Rápida & Cloud",
    cloudServerRegion: "Nuvem Instantânea / Multi-Região",
    sessionMode: "Cloud Stream",
    platformHint: "Xbox Cloud • Windows • MacOS • Mobile",
    reliableFlexibleLink: "/proxima-pagina?perfil=sessao-rapida&modo=instant-cloud",
    capitalRetentionPct: 12,
    parkerianBalanceNote:
      "Fricção mínima para janelas curtas, com link flexível e retenção moderada compatível com uso frequente.",
  },
  {
    id: "cloud-tactics-hub",
    title: "Tática, Gestão & Continuidade",
    profile: "Estratégia & Rotina",
    cloudServerRegion: "Servidor Seguro / Estado Sincronizado",
    sessionMode: "Híbrido Nuvem/Local",
    platformHint: "Windows • MacOS • Nintendo • Cloud",
    reliableFlexibleLink: "/proxima-pagina?perfil=estrategia&modo=hybrid-sync",
    capitalRetentionPct: 20,
    parkerianBalanceNote:
      "Harmonia entre planejamento claro, retenção segura de capital no servidor e flexibilidade de acesso.",
  },
];

export function buildSafeFlexibleLink(rawLink: string, userTag?: string): string {
  const trimmed = (rawLink || "/").trim();
  const isSafeRelative = trimmed.startsWith("/") && !trimmed.startsWith("//");
  const isSafeHttps = trimmed.startsWith("https://");
  const baseUrl = isSafeRelative || isSafeHttps ? trimmed : "/";

  if (!userTag || !userTag.trim()) return baseUrl;
  const cleanTag = encodeURIComponent(userTag.trim().slice(0, 32));
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}ref=${cleanTag}`;
}