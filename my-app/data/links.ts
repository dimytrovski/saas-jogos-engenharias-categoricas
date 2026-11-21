export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  ctaLabel: string;
}

export const links: LinkItem[] = [
  {
    id: "painel-captacao",
    title: "Painel de Divulgação e Captação",
    url: "/link1",
    category: "Seu MicroSaaS",
    description:
      "Centralize links de campanha, páginas de captura e conversão de jogadores para o seu jogo.",
    ctaLabel: "Abrir painel",
  },
  {
    id: "playbook-jogadores",
    title: "Guia de Aquisição de Jogadores",
    url: "/link2",
    category: "Crescimento",
    description:
      "Estruture clipes, demos, comunidades e CTAs para transformar curiosos em jogadores ativos.",
    ctaLabel: "Ver guia",
  },
  {
    id: "recursos-parcerias",
    title: "Central de Recursos e Parcerias",
    url: "/link3",
    category: "Ecossistema",
    description:
      "Atalhos complementares, materiais de apoio e opções de plano/checkout para desenvolvedores.",
    ctaLabel: "Acessar central",
  },
];

export function getOrderedLinks(items: LinkItem[]): LinkItem[] {
  return [...items].sort((a, b) => {
    if (a.url === "/link3") return 1;
    if (b.url === "/link3") return -1;
    return 0;
  });
}