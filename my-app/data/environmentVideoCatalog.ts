export type GameEnvironmentCategory =
  | "Arena Competitiva & Co-op"
  | "Mundo Aberto & Exploração"
  | "Campanha & Sessões Curtas"
  | "PC, Cloud & Multiplataforma";

export interface ScenarioVideoCase {
  id: string;
  environmentCategory: GameEnvironmentCategory;
  gameTitle: string;
  problemScenarioTitle: string;
  problemSummary: string;
  videoTitle: string;
  videoDuration: string;
  videoSrc?: string;
  sceneHighlights: string[];
  useCaseDemandSolvedPct: number;
  economicViabilityImpact: string;
  uxImprovementSummary: string;
  estimatedMonthlySavingsBRL: string;
}

export const ENVIRONMENT_CATEGORIES: GameEnvironmentCategory[] = [
  "Arena Competitiva & Co-op",
  "Mundo Aberto & Exploração",
  "Campanha & Sessões Curtas",
  "PC, Cloud & Multiplataforma",
];

export const ENVIRONMENT_VIDEO_CASES: ScenarioVideoCase[] = [
  {
    id: "arena-latencia-rota",
    environmentCategory: "Arena Competitiva & Co-op",
    gameTitle: "FC / Futebol & Arena Online",
    problemScenarioTitle: "Troca lenta de rotas, lobbies e edições antes de partidas",
    problemSummary:
      "Jogadores perdem tempo caçando links dispersos, configurações de controle e versões compatíveis antes de entrar na sala.",
    videoTitle: "Demo: Validando rota, controle e entrada rápida na arena",
    videoDuration: "01:15",
    sceneHighlights: [
      "00:00 — Cenário crítico: links espalhados e dúvida de edição",
      "00:28 — Seleção direta do controle e rota compatível no hub",
      "00:52 — Envio do briefing de partida e entrada sem atrito",
    ],
    useCaseDemandSolvedPct: 78,
    economicViabilityImpact:
      "Evita compras duplicadas ou pacotes errados em promoções relâmpago, preservando orçamento recorrente.",
    uxImprovementSummary:
      "Reduz etapas de navegação e exibe no vídeo exatamente onde o gargalo acontece antes do clique final.",
    estimatedMonthlySavingsBRL: "R$ 45 – R$ 120 / mês",
  },
  {
    id: "mundo-aberto-curadoria",
    environmentCategory: "Mundo Aberto & Exploração",
    gameTitle: "RPG & Mundos Expandidos",
    problemScenarioTitle: "Sobrecarga de catálogo, DLCs e expansões sem clareza de custo-benefício",
    problemSummary:
      "Catálogos longos provocam fadiga de escolha e compras por impulso que não combinam com o tempo livre do usuário.",
    videoTitle: "Demo: Filtrando expansões e avaliando score antes de adquirir",
    videoDuration: "01:40",
    sceneHighlights: [
      "00:00 — Excesso de opções e indecisão no catálogo",
      "00:35 — Comparação objetiva de compatibilidade e orçamento",
      "01:08 — Decisão consciente: avançar agora ou guardar na fila",
    ],
    useCaseDemandSolvedPct: 82,
    economicViabilityImpact:
      "Filtra itens de baixo retorno de uso, aumentando a proporção de compras úteis frente ao gasto total.",
    uxImprovementSummary:
      "Associa cada cenário de exploração a uma demonstração visual curta em vez de longos textos explicativos.",
    estimatedMonthlySavingsBRL: "R$ 60 – R$ 180 / mês",
  },
  {
    id: "campanha-ponte-rotina",
    environmentCategory: "Campanha & Sessões Curtas",
    gameTitle: "História & Sessões de 30–45 min",
    problemScenarioTitle: "Quebra de ritmo entre jogar por pouco tempo e retomar anotações/metas",
    problemSummary:
      "Quem tem janelas curtas de jogo perde o contexto de onde parou e precisa anotar lembretes manualmente em vários apps.",
    videoTitle: "Demo: Capturando contexto da sessão e enviando para produtividade",
    videoDuration: "01:05",
    sceneHighlights: [
      "00:00 — Fim de janela curta de jogo com pendências soltas",
      "00:22 — Geração do briefing estruturado em um clique",
      "00:45 — Encaminhamento para Notion, To Do, Keep ou GitHub",
    ],
    useCaseDemandSolvedPct: 74,
    economicViabilityImpact:
      "Maximiza o aproveitamento do que o usuário já assina ou possui (passes, jogos e ferramentas gratuitas) sem exigir upgrades caros.",
    uxImprovementSummary:
      "Mantém a continuidade da jornada com mínima fricção visual e transição previsível.",
    estimatedMonthlySavingsBRL: "R$ 30 – R$ 90 / mês",
  },
  {
    id: "pc-cloud-compatibilidade",
    environmentCategory: "PC, Cloud & Multiplataforma",
    gameTitle: "Windows, MacOS, Cloud & Consoles",
    problemScenarioTitle: "Dúvida de compatibilidade entre controle físico, sistema e streaming/nuvem",
    problemSummary:
      "Alternar entre PC Windows, MacOS, controles físicos e sessões em nuvem gera incerteza sobre suporte e desempenho.",
    videoTitle: "Demo: Checando compatibilidade de plataforma e controle em segundos",
    videoDuration: "01:25",
    sceneHighlights: [
      "00:00 — Dúvida de suporte entre ambiente local, nuvem e controle",
      "00:30 — Verificação de compatibilidade no fluxo do microSaaS",
      "01:00 — Rota confirmada com apoio direto quando necessário",
    ],
    useCaseDemandSolvedPct: 86,
    economicViabilityImpact:
      "Previne gastos com periféricos ou assinaturas incompatíveis com o setup atual do usuário.",
    uxImprovementSummary:
      "Elimina tentativa e erro através de cenários visuais agrupados por ambiente real de uso.",
    estimatedMonthlySavingsBRL: "R$ 50 – R$ 150 / mês",
  },
];

export function getAverageDemandSolvedPct(cases: ScenarioVideoCase[]): number {
  if (cases.length === 0) return 0;
  const total = cases.reduce((acc, item) => acc + item.useCaseDemandSolvedPct, 0);
  return Math.round(total / cases.length);
}