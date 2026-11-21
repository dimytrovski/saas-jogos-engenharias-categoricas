import type { PlatformName } from "@/data/heroBackgrounds";

export interface PurchaseOpportunity {
  id: string;
  storeName: string;
  smartTip: string;
  badge: string;
  url: string;
}

export interface ProductivityDestination {
  id: string;
  toolName: string;
  purpose: string;
  url: string;
}

export interface GameOpportunityData {
  gameId: string;
  title: string;
  platform: PlatformName;
  summary: string;
  opportunities: PurchaseOpportunity[];
  productivityDestinations: ProductivityDestination[];
}

export const GAME_OPPORTUNITIES: GameOpportunityData[] = [
  {
    gameId: "jogo-xbox-1",
    title: "Arena Strike Xbox",
    platform: "Xbox",
    summary: "Ação rápida com foco em partidas curtas e comunidade ativa.",
    opportunities: [
      {
        id: "xbox-opp-1",
        storeName: "Xbox Store Oficial",
        smartTip: "Verifique suporte a Smart Delivery e ofertas sazonais antes de fechar.",
        badge: "Compatibilidade garantida",
        url: "https://www.xbox.com/games/store",
      },
      {
        id: "xbox-opp-2",
        storeName: "Rota de Campanha / Oferta",
        smartTip: "Compare edições base vs. bundle antes de comprar para evitar duplicidade.",
        badge: "Economia inteligente",
        url: "/link1",
      },
    ],
    productivityDestinations: [
      {
        id: "xbox-prod-1",
        toolName: "Microsoft To Do",
        purpose: "Agendar sessões de jogo e metas de conquista sem estourar a rotina.",
        url: "https://to-do.live.com",
      },
      {
        id: "xbox-prod-2",
        toolName: "Notion",
        purpose: "Registrar builds, horários de esquadrão e notas de partidas.",
        url: "https://www.notion.so",
      },
    ],
  },
  {
    gameId: "jogo-ps-1",
    title: "Neon Drift PS",
    platform: "PlayStation",
    summary: "Corrida arcade com foco em performance e ranking.",
    opportunities: [
      {
        id: "ps-opp-1",
        storeName: "PlayStation Store",
        smartTip: "Confira versões PS4/PS5 e acompanhe promoções recorrentes da loja.",
        badge: "Edição verificada",
        url: "https://store.playstation.com",
      },
      {
        id: "ps-opp-2",
        storeName: "Central de Link / Oferta",
        smartTip: "Salve o link na lista de desejos e aguarde queda de preço se não for urgência.",
        badge: "Alerta de oferta",
        url: "/link2",
      },
    ],
    productivityDestinations: [
      {
        id: "ps-prod-1",
        toolName: "Notion",
        purpose: "Organizar tempos de volta, pistas favoritas e rotina de treinos.",
        url: "https://www.notion.so",
      },
      {
        id: "ps-prod-2",
        toolName: "Google Agenda",
        purpose: "Bloquear janelas curtas de lazer após concluir tarefas principais.",
        url: "https://calendar.google.com",
      },
    ],
  },
  {
    gameId: "jogo-nintendo-1",
    title: "Pocket Quest",
    platform: "Nintendo",
    summary: "Aventura portátil leve para sessões rápidas no dia a dia.",
    opportunities: [
      {
        id: "nin-opp-1",
        storeName: "Nintendo eShop",
        smartTip: "Ideal para deslocamentos curtos; avalie espaço livre e modo portátil.",
        badge: "Modo portátil",
        url: "https://www.nintendo.com/store",
      },
      {
        id: "nin-opp-2",
        storeName: "Rota de Divulgação / Link",
        smartTip: "Compare preço digital vs. mídia física considerando revenda e armazenamento.",
        badge: "Análise de formato",
        url: "/link3",
      },
    ],
    productivityDestinations: [
      {
        id: "nin-prod-1",
        toolName: "Google Keep",
        purpose: "Anotar missões pendentes, ideias rápidas e checklists de viagem.",
        url: "https://keep.google.com",
      },
      {
        id: "nin-prod-2",
        toolName: "Notion",
        purpose: "Manter diário de progresso e anotações de exploração.",
        url: "https://www.notion.so",
      },
    ],
  },
  {
    gameId: "jogo-windows-1",
    title: "Tactical Grid PC",
    platform: "Windows",
    summary: "Estratégia competitiva otimizada para mouse, teclado e PC.",
    opportunities: [
      {
        id: "win-opp-1",
        storeName: "Steam / PC Storefront",
        smartTip: "Cheque requisitos mínimos, políticas de reembolso e pacotes completos.",
        badge: "PC otimizado",
        url: "https://store.steampowered.com",
      },
      {
        id: "win-opp-2",
        storeName: "Fluxo de Campanha PC",
        smartTip: "Evite compras por impulso: compare descontos sazonais e bundles.",
        badge: "Compra consciente",
        url: "/link1",
      },
    ],
    productivityDestinations: [
      {
        id: "win-prod-1",
        toolName: "GitHub",
        purpose: "Centralizar issues, automações, documentação e fluxos técnicos.",
        url: "https://github.com",
      },
      {
        id: "win-prod-2",
        toolName: "Microsoft To Do",
        purpose: "Separar blocos de foco profundo no Windows das pausas de jogo.",
        url: "https://to-do.live.com",
      },
    ],
  },
  {
    gameId: "jogo-mac-1",
    title: "Indie Flow Mac",
    platform: "Mac",
    summary: "Experiência criativa e fluida rodando nativamente no macOS.",
    opportunities: [
      {
        id: "mac-opp-1",
        storeName: "Mac App Store / Loja Indie",
        smartTip: "Confirme compatibilidade nativa com arquitetura do chip e macOS.",
        badge: "Nativo no Mac",
        url: "https://www.apple.com/mac",
      },
      {
        id: "mac-opp-2",
        storeName: "Rota de Lançamento Mac",
        smartTip: "Aproveite demos ou passes iniciais para validar desempenho antes de assinar.",
        badge: "Validação prévia",
        url: "/link2",
      },
    ],
    productivityDestinations: [
      {
        id: "mac-prod-1",
        toolName: "Notion",
        purpose: "Estruturar roadmap, notas de estudo e projetos criativos.",
        url: "https://www.notion.so",
      },
      {
        id: "mac-prod-2",
        toolName: "Trello",
        purpose: "Acompanhar etapas visuais de tarefas e entregas do dia.",
        url: "https://trello.com",
      },
    ],
  },
];