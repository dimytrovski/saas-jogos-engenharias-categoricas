export interface DefenseSolutionItem {
  order: number;
  id: string;
  title: string;
  category: "Firewall" | "IDS" | "IPS" | "Shell & Exploit Defense" | "Hardening & Runtime";
  targetThreats: string[];
  summary: string;
  implementationSteps: string[];
}

export const SECURITY_DEFENSE_SOLUTIONS: DefenseSolutionItem[] = [
  {
    order: 1,
    id: "firewall-waf-egress-default-deny",
    title: "Firewall Stateful + WAF com Default Deny e Controle de Egress",
    category: "Firewall",
    targetThreats: ["Bind Shell", "Reverse Shell", "Exploits de Vulnerabilidades Web"],
    summary:
      "Bloqueia portas inesperadas (evitando bind shells), restringe conexões de saída não autorizadas (dificultando reverse shells) e filtra payloads maliciosos na borda HTTP/HTTPS.",
    implementationSteps: [
      "Manter apenas portas estritamente necessárias expostas (ex.: 80/443 atrás de proxy reverso) e bloquear bind ports incomuns.",
      "Aplicar regras de saída (egress) limitando destinos externos permitidos e bloqueando chamadas de shell fora do fluxo esperado.",
      "Ativar regras de WAF/rate-limiting e validação estrita de entrada contra payloads de exploit.",
    ],
  },
];