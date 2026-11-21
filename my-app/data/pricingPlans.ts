export type BillingCycle = "mensal" | "trimestral" | "anual";

export interface CycleMaxCapInfo {
  cycle: BillingCycle;
  label: string;
  maxPriceBRL: number;
  maxEquivalentPerMonthBRL: number;
  capNote: string;
}

export interface PricingTier {
  id: "free" | "pro" | "founder";
  name: string;
  badge: string;
  maxPricesBRL: Record<BillingCycle, number>;
  summary: string;
  highlights: string[];
  whyBuyReason: string;
  ctaLabel: string;
  recommended?: boolean;
}

export const CYCLE_MAX_CAPS: Record<BillingCycle, CycleMaxCapInfo> = {
  mensal: {
    cycle: "mensal",
    label: "Mensal (Preço Máximo)",
    maxPriceBRL: 24.9,
    maxEquivalentPerMonthBRL: 24.9,
    capNote: "Teto máximo de R$ 24,90 no ciclo mensal, sem cobranças extras.",
  },
  trimestral: {
    cycle: "trimestral",
    label: "Trimestral (Preço Máximo)",
    maxPriceBRL: 64.9,
    maxEquivalentPerMonthBRL: Number((64.9 / 3).toFixed(2)),
    capNote:
      "Teto máximo de R$ 64,90 a cada 3 meses (até R$ 21,63/mês no teto, abaixo de 3x R$ 24,90).",
  },
  anual: {
    cycle: "anual",
    label: "Anual (Preço Máximo)",
    maxPriceBRL: 219.0,
    maxEquivalentPerMonthBRL: Number((219.0 / 12).toFixed(2)),
    capNote:
      "Teto máximo de R$ 219,00 por ano (até R$ 18,25/mês no teto, maior economia acumulada).",
  },
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Essencial",
    badge: "Comece sem risco",
    maxPricesBRL: {
      mensal: 0,
      trimestral: 0,
      anual: 0,
    },
    summary:
      "Ideal para testar o fluxo, usar os controles por plataforma e validar cenários por ambiente.",
    highlights: [
      "Controles iniciais de Xbox, PlayStation, Nintendo, Windows e MacOS",
      "Catálogo por ambiente de jogo com player demonstrativo",
      "Score de decisão básico e suporte direto",
    ],
    whyBuyReason:
      "Permite sentir o ganho de clareza na prática antes de investir qualquer valor.",
    ctaLabel: "Usar gratuito agora",
  },
  {
    id: "pro",
    name: "Pro Fluxo",
    badge: "Mais escolhido",
    maxPricesBRL: {
      mensal: 24.9,
      trimestral: 64.9,
      anual: 219.0,
    },
    summary:
      "Para quem quer reduzir compras por impulso, padronizar briefings e levar decisões direto para a rotina.",
    highlights: [
      "Briefings estruturados ilimitados com 1 clique",
      "Atalhos diretos para Notion, Microsoft To Do, Google Keep e GitHub",
      "Histórico local de escolhas e comparações de cenário",
    ],
    whyBuyReason:
      "Preço máximo travado por ciclo: evitar uma escolha ruim já compensa o investimento.",
    ctaLabel: "Garantir acesso Pro",
    recommended: true,
  },
  {
    id: "founder",
    name: "Founder Estendido",
    badge: "Teto garantido",
    maxPricesBRL: {
      mensal: 24.9,
      trimestral: 64.9,
      anual: 219.0,
    },
    summary:
      "Para usuários recorrentes que buscam previsibilidade máxima de teto por período e acesso antecipado a melhorias.",
    highlights: [
      "Mesmo teto máximo garantido por ciclo mensal, trimestral ou anual",
      "Acesso antecipado a novos cenários, filtros e recursos",
      "Apoio direto ao roadmap de melhorias do microSaaS",
    ],
    whyBuyReason:
      "Transparência total de preço máximo em qualquer periodicidade escolhida.",
    ctaLabel: "Selecionar com teto garantido",
  },
];

export function formatBRL(value: number): string {
  if (value === 0) return "R$ 0";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}