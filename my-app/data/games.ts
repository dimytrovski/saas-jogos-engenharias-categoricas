import type { PlatformName } from "@/data/heroBackgrounds";

export interface GameItem {
  id: string;
  title: string;
  platform: PlatformName;
  linkUrl: string;
  summary: string;
}

export const PLATFORM_CATEGORIES: PlatformName[] = [
  "Xbox",
  "PlayStation",
  "Nintendo",
  "Windows",
  "Mac",
];

export const games: GameItem[] = [
  {
    id: "jogo-xbox-1",
    title: "Arena Strike Xbox",
    platform: "Xbox",
    linkUrl: "/link1",
    summary: "Ação rápida com foco em partidas curtas e comunidade ativa.",
  },
  {
    id: "jogo-ps-1",
    title: "Neon Drift PS",
    platform: "PlayStation",
    linkUrl: "/link2",
    summary: "Corrida arcade com foco em performance e ranking.",
  },
  {
    id: "jogo-nintendo-1",
    title: "Pocket Quest",
    platform: "Nintendo",
    linkUrl: "/link3",
    summary: "Aventura portátil leve para sessões rápidas no dia a dia.",
  },
  {
    id: "jogo-windows-1",
    title: "Tactical Grid PC",
    platform: "Windows",
    linkUrl: "/link1",
    summary: "Estratégia competitiva otimizada para mouse, teclado e PC.",
  },
  {
    id: "jogo-mac-1",
    title: "Indie Flow Mac",
    platform: "Mac",
    linkUrl: "/link2",
    summary: "Experiência criativa e fluida rodando nativamente no macOS.",
  },
];