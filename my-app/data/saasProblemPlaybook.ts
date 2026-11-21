export type AudienceSegment =
  | "Jogadores & Comunidades"
  | "Devs, Criadores & Estudantes"
  | "Equipes Locais & Projetos de Nicho";

export type EffortLevel = "Baixo" | "MÃƒÂ©dio";

export interface MicroSaasProblemCase {
  id: string;
  title: string;
  segment: AudienceSegment;
  painPoint: string;
  whyMicroSaasFits: string;
  mvpActionLabel: string;
  targetRouteOrUrl: string;
  effort: EffortLevel;
}

export const MICRO_SAAS_PROBLEM_CASES: MicroSaasProblemCase[] = [
  {
    id: "fragmentacao-links-plataformas",
    title: "FragmentaÃƒÂ§ÃƒÂ£o de Links, Ofertas e Campanhas por Plataforma",
    segment: "Jogadores & Comunidades",
    painPoint:
      "Links espalhados entre lojas oficiais, ediÃƒÂ§ÃƒÂµes, bundles e rotas de campanha geram perda de tempo e risco de escolher versÃƒÂµes incompatÃƒÂ­veis.",
    whyMicroSaasFits:
      "Centraliza rotas por plataforma com critÃƒÂ©rios de decisÃƒÂ£o rÃƒÂ¡pida, cÃƒÂ³pia instantÃƒÂ¢nea de URL e redirecionamento direto.",
    mvpActionLabel: "Abrir rotas de links",
    targetRouteOrUrl: "/link1",
    effort: "Baixo",
  },
  {
    id: "ponte-lazer-produtividade",
    title: "Falta de Ponte entre SessÃƒÂµes de Jogo/Lazer e Produtividade",
    segment: "Jogadores & Comunidades",
    painPoint:
      "Alternar entre lazer e tarefas exige muitos cliques para abrir ferramentas de notas, agendas ou listas e registrar prÃƒÂ³ximos passos.",
    whyMicroSaasFits:
      "Atua como hub de encaminhamento contextual para ferramentas como Notion, Microsoft To Do, Google Agenda, Google Keep e GitHub.",
    mvpActionLabel: "Ir para o carrossel de aÃƒÂ§ÃƒÂµes",
    targetRouteOrUrl: "#plataformas-carrossel",
    effort: "Baixo",
  },
  {
    id: "triagem-sem-sobrecarga",
    title: "Descoberta e Triagem sem Sobrecarga de CatÃƒÂ¡logo",
    segment: "Jogadores & Comunidades",
    painPoint:
      "CatÃƒÂ¡logos extensos provocam paralisia de escolha ou compras por impulso fora do foco e do orÃƒÂ§amento.",
    whyMicroSaasFits:
      "Entrega curadoria enxuta por plataforma com foco em compatibilidade, formato e tomada de decisÃƒÂ£o objetiva.",
    mvpActionLabel: "Filtrar por plataforma",
    targetRouteOrUrl: "#plataformas-carrossel",
    effort: "Baixo",
  },
  {
    id: "rotina-baixa-complexidade",
    title: "GestÃƒÂ£o de Rotina, Cronogramas e Projetos de Baixa Complexidade",
    segment: "Devs, Criadores & Estudantes",
    painPoint:
      "Sistemas corporativos sÃƒÂ£o pesados demais para o dia a dia e planilhas soltas viram bagunÃƒÂ§a rapidamente.",
    whyMicroSaasFits:
      "Oferece fluxos leves, checklists diretos e acompanhamento de etapas sem curva de configuraÃƒÂ§ÃƒÂ£o pesada.",
    mvpActionLabel: "Ver prÃƒÂ³xima rota",
    targetRouteOrUrl: "/link2",
    effort: "Baixo",
  },
  {
    id: "conversao-com-suporte-direto",
    title: "DÃƒÂºvidas Pontuais que Travam Cliques e ConversÃƒÂ£o",
    segment: "Equipes Locais & Projetos de Nicho",
    painPoint:
      "Visitantes com dÃƒÂºvidas simples sobre compatibilidade ou uso abandonam a pÃƒÂ¡gina quando o atendimento ÃƒÂ© lento ou burocrÃƒÂ¡tico.",
    whyMicroSaasFits:
      "Combina interface direta com atalho imediato para suporte humano contextualizado no WhatsApp.",
    mvpActionLabel: "Explorar rota de apoio",
    targetRouteOrUrl: "/link3",
    effort: "Baixo",
  },
  {
    id: "producao-conteudo-e-eventos",
    title: "OrganizaÃƒÂ§ÃƒÂ£o de ConteÃƒÂºdo, Pautas e Ativos de Nicho",
    segment: "Equipes Locais & Projetos de Nicho",
    painPoint:
      "Ideias, links, cronogramas e referÃƒÂªncias se perdem em conversas soltas e pastas desorganizadas.",
    whyMicroSaasFits:
      "Padroniza o ciclo de ideia, link/recurso, execuÃƒÂ§ÃƒÂ£o e divulgaÃƒÂ§ÃƒÂ£o num fluxo simples e recorrente.",
    mvpActionLabel: "Revisar rotas",
    targetRouteOrUrl: "/link2",
    effort: "MÃƒÂ©dio",
  },
];

export function filterMicroSaasCases(
  segment: AudienceSegment | "Todos"
): MicroSaasProblemCase[] {
  if (segment === "Todos") {
    return MICRO_SAAS_PROBLEM_CASES;
  }
  return MICRO_SAAS_PROBLEM_CASES.filter((item) => item.segment === segment);
}