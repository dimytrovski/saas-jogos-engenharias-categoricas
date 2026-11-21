import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

interface PaymentWebhookPayload {
  eventId?: string;
  transactionId?: string;
  status?: "approved" | "pending" | "failed" | "refunded";
  amountBRL?: number;
  method?: string;
  settlementVault?: string;
}

// Registro em memória no processo do servidor para idempotência básica (em produção, use banco/Redis)
const processedEventIds = new Set<string>();

function getWebhookSecret(): string {
  return (
    process.env.CHECKOUT_WEBHOOK_SECRET ||
    "dev-local-webhook-secret-change-in-production"
  );
}

export function computeExpectedSignature(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

function isSignatureValid(rawBody: string, providedHex: string | null): boolean {
  if (!providedHex || !/^[0-9a-fA-F]{64}$/.test(providedHex.trim())) {
    return false;
  }
  const expectedHex = computeExpectedSignature(rawBody, getWebhookSecret());
  const expectedBuf = Buffer.from(expectedHex, "hex");
  const providedBuf = Buffer.from(providedHex.trim().toLowerCase(), "hex");

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-webhook-signature");

    if (!isSignatureValid(rawBody, signatureHeader)) {
      return NextResponse.json(
        {
          ok: false,
          verified: false,
          error: "Assinatura HMAC inválida ou ausente. Evento rejeitado por segurança.",
        },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as PaymentWebhookPayload;
    const eventId = (payload.eventId || "").trim();

    if (!eventId) {
      return NextResponse.json(
        {
          ok: false,
          verified: true,
          error: "Campo eventId obrigatório para controle de idempotência.",
        },
        { status: 400 }
      );
    }

    if (processedEventIds.has(eventId)) {
      return NextResponse.json({
        ok: true,
        verified: true,
        idempotentReplay: true,
        eventId,
        message:
          "Evento já processado anteriormente. Ignorado com segurança para evitar duplicidade.",
      });
    }

    processedEventIds.add(eventId);

    const amountBRL =
      typeof payload.amountBRL === "number" && Number.isFinite(payload.amountBRL)
        ? Number(payload.amountBRL.toFixed(2))
        : 24.9;

    const status = payload.status || "approved";
    const vaultRef =
      process.env.SETTLEMENT_MASKED_REF || "VAULT-BRL-NUBANK-PROTECTED";

    return NextResponse.json({
      ok: true,
      verified: true,
      idempotentReplay: false,
      eventId,
      transactionId: payload.transactionId || `TXN-${Date.now().toString(36).toUpperCase()}`,
      status,
      amountBRL,
      currency: "BRL",
      method: payload.method || "Pix",
      settlementVault: vaultRef,
      rawBankDataExposed: false,
      message:
        "Pagamento autenticado via HMAC e registrado com idempotência no servidor.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        verified: false,
        error: "Payload JSON inválido no webhook.",
      },
      { status: 400 }
    );
  }
}