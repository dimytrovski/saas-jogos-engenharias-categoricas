import type { PlatformName } from "@/data/heroBackgrounds";

export type IntentUrgency = "Imediata" | "Planejada" | "Apenas salvando";

export interface DecisionInput {
  platform: PlatformName;
  itemTitle: string;
  urgency: IntentUrgency;
  budgetBRL: number;
  hasCompatibilityChecked: boolean;
}

export interface DecisionResult {
  score: number;
  verdict: "Comprar / Avançar Agora" | "Avaliar Oferta / Bundle" | "Guardar na Fila";
  rationale: string;
  productivityBrief: string;
}

export function evaluateSmartDecision(input: DecisionInput): DecisionResult {
  let score = 50;

  if (input.hasCompatibilityChecked) {
    score += 20;
  } else {
    score -= 15;
  }

  if (input.urgency === "Imediata") {
    score += 15;
  } else if (input.urgency === "Planejada") {
    score += 10;
  } else {
    score -= 10;
  }

  if (input.budgetBRL >= 250) {
    score += 15;
  } else if (input.budgetBRL >= 80) {
    score += 5;
  } else {
    score -= 10;
  }

  const clampedScore = Math.max(5, Math.min(100, score));

  let verdict: DecisionResult["verdict"] = "Avaliar Oferta / Bundle";
  let rationale =
    "Há bom potencial, mas vale comparar edições, descontos sazonais e encaixe na sua agenda antes de fechar.";

  if (clampedScore >= 75) {
    verdict = "Comprar / Avançar Agora";
    rationale =
      "Compatibilidade validada, intenção clara e faixa de orçamento alinhada para avançar sem atrito.";
  } else if (clampedScore < 45) {
    verdict = "Guardar na Fila";
    rationale =
      "Priorize validar compatibilidade, orçamento ou necessidade real antes de comprometer recursos.";
  }

  const productivityBrief = [
    `[MicroSaaS Decision Hub] ${input.platform} — ${input.itemTitle}`,
    `Score Inteligente: ${clampedScore}/100 | Recomendação: ${verdict}`,
    `Urgência: ${input.urgency} | Orçamento base: R$ ${input.budgetBRL}`,
    `Motivo: ${rationale}`,
    `Próximo passo: Registrar no fluxo de tarefas e acompanhar execução.`,
  ].join("\n");

  return {
    score: clampedScore,
    verdict,
    rationale,
    productivityBrief,
  };
}

export const PRODUCTIVITY_QUICK_TARGETS = [
  { id: "notion", name: "Notion", url: "https://www.notion.so" },
  { id: "todo", name: "Microsoft To Do", url: "https://to-do.live.com" },
  { id: "keep", name: "Google Keep", url: "https://keep.google.com" },
  { id: "github", name: "GitHub", url: "https://github.com" },
];