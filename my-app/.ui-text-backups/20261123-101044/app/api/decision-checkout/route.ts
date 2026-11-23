import { NextRequest, NextResponse } from "next/server";

interface DecisionCheckoutPayload {
  scope?: "brasil_brl" | "global_fx" | "misto_global_brl";
  method?: string;
  planName?: string;
  amountBrl?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DecisionCheckoutPayload;
    const scope = body.scope ?? "misto_global_brl";
    const method = body.method ?? "Pix";
    const planName = body.planName ?? "Pro Fluxo";
    const rawAmount = Number(body.amountBrl ?? 24.9);
    const safeAmountBrl =
      Number.isFinite(rawAmount) && rawAmount > 0 ? Number(rawAmount.toFixed(2)) : 24.9;

    // Identificador opaco: nunca retorna agencia, conta ou chave Pix em texto aberto
    const sessionReference = `CHK-${Date.now().toString(36).toUpperCase()}`;
    const vaultRef = process.env.SETTLEMENT_MASKED_REF || "VAULT-BRL-NUBANK-PROTECTED";

    return NextResponse.json({
      ok: true,
      sessionReference,
      scope,
      method,
      planName,
      settlementCurrency: "BRL",
      estimatedAmountBrl: safeAmountBrl,
      settlementVault: vaultRef,
      rawCredentialsExposed: false,
      message:
        "Sessão de decisão de pagamento preparada com segurança no servidor sem expor dados bancários.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Não foi possível processar a solicitação de conexão." },
      { status: 400 }
    );
  }
}