export interface GlobalCommerceSolution {
  id: number;
  name: string;
  providerType: "Gateway / Checkout Global" | "Pix & Pagamento Instantâneo" | "Boleto & Transferência" | "Conversão FX & Liquidação BRL";
  globalReach: string;
  paymentMethods: string[];
  fxToBrlBehavior: string;
  privacyEncapsulationStrategy: string;
}

export const GLOBAL_COMMERCE_SOLUTIONS: GlobalCommerceSolution[] = [
  {
    id: 1,
    name: "Stripe Checkout & Billing Internacional",
    providerType: "Gateway / Checkout Global",
    globalReach: "Global (cartões internacionais, carteiras digitais e moedas locais)",
    paymentMethods: ["Cartão de Crédito", "Cartão de Débito", "Apple Pay", "Google Pay"],
    fxToBrlBehavior: "Recebe em moeda estrangeira do comprador e liquida conforme configuração da conta/parceiro.",
    privacyEncapsulationStrategy: "Tokenização PCI-DSS no checkout hospedado; dados de recebimento ficam restritos ao painel e webhook no servidor.",
  },
  {
    id: 2,
    name: "Mercado Pago Checkout Transparente / Pro",
    providerType: "Gateway / Checkout Global",
    globalReach: "América Latina com foco forte no Brasil e operações digitais",
    paymentMethods: ["Pix", "Cartão de Crédito", "Cartão de Débito", "Boleto Bancário"],
    fxToBrlBehavior: "Liquidação nativa em Reais (BRL) com conciliação automática por webhook.",
    privacyEncapsulationStrategy: "Chaves de API em variáveis de ambiente no backend e confirmação de pagamento via assinatura de webhook.",
  },
  {
    id: 3,
    name: "Pix Dinâmico / QR Code via PSP Regulado",
    providerType: "Pix & Pagamento Instantâneo",
    globalReach: "Brasil 24/7 com baixa latência e confirmação imediata",
    paymentMethods: ["Pix Copia e Cola", "Pix QR Code"],
    fxToBrlBehavior: "Liquidação direta em Reais (BRL) na conta vinculada ao PSP/instituição.",
    privacyEncapsulationStrategy: "Gera cobrança avulsa/dinâmica por pedido sem expor chave pessoal fixa ou dados de agência/conta no frontend.",
  },
  {
    id: 4,
    name: "Adyen Global Payments",
    providerType: "Gateway / Checkout Global",
    globalReach: "Global multi-moeda e métodos locais em dezenas de países",
    paymentMethods: ["Cartão de Crédito", "Cartão de Débito", "Métodos Locais", "Carteiras Digitais"],
    fxToBrlBehavior: "Suporta conversão cambial (FX) e repasse consolidado conforme arranjo financeiro.",
    privacyEncapsulationStrategy: "Isolamento de credenciais server-side e mascaramento de dados sensíveis em logs e interface.",
  },
  {
    id: 5,
    name: "dLocal / EBANX (Pagamentos Cross-Border)",
    providerType: "Conversão FX & Liquidação BRL",
    globalReach: "Mercados emergentes e compradores internacionais pagando em moeda local",
    paymentMethods: ["Cartão de Crédito", "Cartão de Débito", "Boleto", "Transferência / Pix"],
    fxToBrlBehavior: "Comprador paga na moeda local ou internacional e a operação converte/liquida no destino configurado.",
    privacyEncapsulationStrategy: "Separação estrita entre dados do comprador, token da transação e destino de liquidação no backend.",
  },
  {
    id: 6,
    name: "Asaas / Pagar.me / PagBank (Cobrança & Boleto)",
    providerType: "Boleto & Transferência",
    globalReach: "Brasil com foco em assinaturas, cobranças recorrentes e faturamento",
    paymentMethods: ["Boleto Bancário", "Pix", "Cartão de Crédito"],
    fxToBrlBehavior: "Processamento e liquidação direta em Reais (BRL) com gestão de inadimplência.",
    privacyEncapsulationStrategy: "Dados de conta de destino protegidos no painel administrativo do PSP, sem exposição em rotas públicas.",
  },
  {
    id: 7,
    name: "Transferência Bancária / TED / DOC Conciliada",
    providerType: "Boleto & Transferência",
    globalReach: "Transferências bancárias tradicionais com identificação por referência de pedido",
    paymentMethods: ["TED", "Transferência Bancária", "Boleto"],
    fxToBrlBehavior: "Recebimento em Reais (BRL) com conferência por código único de pedido/comprovante.",
    privacyEncapsulationStrategy: "Exibe instruções apenas após geração de pedido autenticado ou usa intermediário com conta virtual/cobrança.",
  },
  {
    id: 8,
    name: "Wise Business / Conta Multimoeda com Conversão FX",
    providerType: "Conversão FX & Liquidação BRL",
    globalReach: "Recebimentos internacionais em múltiplas moedas com conversão cambial transparente",
    paymentMethods: ["Transferência Internacional", "ACH / SEPA / Wire", "Conversão FX"],
    fxToBrlBehavior: "Converte moedas estrangeiras para BRL com taxa transparente antes da transferência final.",
    privacyEncapsulationStrategy: "Acesso restrito a credenciais/API no servidor e separação entre camada de checkout e conta de liquidação.",
  },
  {
    id: 9,
    name: "Paddle / Lemon Squeezy (Merchant of Record Global)",
    providerType: "Gateway / Checkout Global",
    globalReach: "Global para SaaS e produtos digitais com gestão de impostos/VAT internacionais",
    paymentMethods: ["Cartão de Crédito", "Cartão de Débito", "PayPal", "Apple Pay", "Google Pay"],
    fxToBrlBehavior: "Coleta na moeda do comprador e realiza payout periódico para a conta cadastrada no painel.",
    privacyEncapsulationStrategy: "Atua como Merchant of Record, reduzindo exposição direta de dados pessoais/bancários do criador ao comprador.",
  },
  {
    id: 10,
    name: "Arquitetura de Vault / Encapsulamento Server-Side + Webhook",
    providerType: "Conversão FX & Liquidação BRL",
    globalReach: "Qualquer região ou método de pagamento integrado ao MicroSaaS",
    paymentMethods: ["Pix", "Cartões", "TED", "Boleto", "FX"],
    fxToBrlBehavior: "Normaliza qualquer moeda/método para um ledger interno em BRL antes da liquidação.",
    privacyEncapsulationStrategy: "Zero dados bancários/Pix em código cliente, hashes/IDs opacos na UI e validação criptográfica de webhooks.",
  },
];

export const ENCAPSULATED_SETTLEMENT_PROFILE = {
  vaultAlias: "VAULT-BRL-NUBANK-PROTECTED",
  settlementCurrency: "BRL",
  rawAccountExposedInClient: false,
  protectionNotes: [
    "Agência, número de conta e chave Pix não devem ficar hardcoded no frontend nem em repositórios públicos.",
    "Use variáveis de ambiente no servidor e um gateway/PSP para gerar cobranças isoladas por transação.",
    "Aplique rate limiting, HTTPS/TLS e verificação de assinatura de webhook para evitar adulteração de status.",
  ],
};