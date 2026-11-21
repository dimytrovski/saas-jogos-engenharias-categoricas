export type GatewayBuyerScope = "brasil_brl" | "global_fx" | "misto_global_brl";

export type GatewayMethod =
  | "Pix"
  | "Cartão de Crédito"
  | "Cartão de Débito"
  | "TED"
  | "Boleto Bancário";

export interface PaymentGatewayConnector {
  id: string;
  gatewayName: string;
  recommendedFor: string;
  supportedMethods: GatewayMethod[];
  brlSettlementNotes: string;
  envVarName: string;
  securityControl: string;
}

export const PAYMENT_GATEWAY_CONNECTORS: PaymentGatewayConnector[] = [
  {
    id: "mercadopago-brl",
    gatewayName: "Mercado Pago",
    recommendedFor: "Compradores no Brasil pagando em BRL com confirmação rápida via webhook",
    supportedMethods: ["Pix", "Cartão de Crédito", "Cartão de Débito", "Boleto Bancário"],
    brlSettlementNotes: "Liquidação nativa em Reais (BRL) sem necessidade de conversão cambial.",
    envVarName: "MERCADOPAGO_ACCESS_TOKEN",
    securityControl: "Token apenas no servidor + validação de assinatura de webhook + zero dados bancários no client.",
  },
  {
    id: "asaas-cobranca-brl",
    gatewayName: "Asaas / Pagar.me",
    recommendedFor: "Cobranças em BRL, boletos, transferências/TED conciliadas e recorrência",
    supportedMethods: ["Pix", "Cartão de Crédito", "TED", "Boleto Bancário"],
    brlSettlementNotes: "Processamento direto em BRL com conciliação de cobrança por referência única.",
    envVarName: "ASAAS_API_KEY",
    securityControl: "Chave isolada em variável de ambiente server-side + geração de cobrança via API protegida.",
  },
  {
    id: "stripe-global-fx",
    gatewayName: "Stripe Checkout & Billing",
    recommendedFor: "Compradores globais em USD/EUR/moeda local com checkout hospedado PCI-DSS",
    supportedMethods: ["Cartão de Crédito", "Cartão de Débito"],
    brlSettlementNotes: "Recebe na moeda do comprador e converte/liquida conforme configuração do painel.",
    envVarName: "STRIPE_SECRET_KEY",
    securityControl: "Checkout hospedado/tokenizado + segredo de webhook no servidor + destino encapsulado no vault.",
  },
  {
    id: "paddle-mor-global",
    gatewayName: "Paddle (Merchant of Record)",
    recommendedFor: "Vendas digitais globais simplificando tributação internacional e repasses",
    supportedMethods: ["Cartão de Crédito", "Cartão de Débito"],
    brlSettlementNotes: "Coleta globalmente e realiza repasse periódico para o destino cadastrado no painel.",
    envVarName: "PADDLE_API_KEY",
    securityControl: "Encapsula dados do criador e valida eventos de pagamento no backend antes de liberar acesso.",
  },
];

export function selectIdealGateways(
  scope: GatewayBuyerScope,
  method: GatewayMethod
): PaymentGatewayConnector[] {
  const byMethod = PAYMENT_GATEWAY_CONNECTORS.filter((g) =>
    g.supportedMethods.includes(method)
  );

  if (scope === "brasil_brl") {
    const brFirst = byMethod.filter((g) =>
      ["mercadopago-brl", "asaas-cobranca-brl"].includes(g.id)
    );
    return brFirst.length > 0 ? brFirst : byMethod;
  }

  if (scope === "global_fx") {
    const globalFirst = byMethod.filter((g) =>
      ["stripe-global-fx", "paddle-mor-global"].includes(g.id)
    );
    return globalFirst.length > 0 ? globalFirst : byMethod;
  }

  return byMethod.length > 0 ? byMethod : PAYMENT_GATEWAY_CONNECTORS;
}