import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/scale-governance";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const title = String(body?.title || "Passe de Transmissao ao Vivo").trim();
    const amount = Number(body?.amount ?? 29.9);
    const currencyId = String(body?.currencyId || "BRL").trim();
    const organizationId =
      typeof body?.organizationId === "number" && body.organizationId > 0
        ? body.organizationId
        : null;
    const passCode = body?.passCode ? String(body.passCode).trim() : null;
    const payerEmail = body?.payerEmail ? String(body.payerEmail).trim() : undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Valor ('amount') deve ser maior que zero." },
        { status: 400 }
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const externalReference = JSON.stringify({
      organizationId,
      passCode,
      ref: `mp_${crypto.randomBytes(6).toString("hex")}`
    });

    if (accessToken) {
      const origin = req.nextUrl.origin;
      const mpResp = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          items: [
            {
              title,
              quantity: 1,
              unit_price: Number(amount.toFixed(2)),
              currency_id: currencyId
            }
          ],
          payer: payerEmail ? { email: payerEmail } : undefined,
          external_reference: externalReference,
          notification_url: `${origin}/api/scale/webhooks/gateway`
        })
      });

      const mpData = await mpResp.json().catch(() => ({}));
      if (!mpResp.ok) {
        return NextResponse.json(
          {
            ok: false,
            provider: "mercadopago",
            error: mpData?.message || "Falha ao criar preferencia no Mercado Pago."
          },
          { status: mpResp.status || 502 }
        );
      }

      await recordAuditLog({
        organizationId,
        action: "mercadopago_preference_created",
        entityType: "payment_preference",
        entityId: String(mpData?.id || externalReference),
        metadata: { amount, currencyId, passCode }
      });

      return NextResponse.json({
        ok: true,
        mode: "live_api",
        provider: "mercadopago",
        preferenceId: mpData?.id,
        initPoint: mpData?.init_point,
        sandboxInitPoint: mpData?.sandbox_init_point,
        passCode,
        organizationId
      });
    }

    const mockPrefId = `pref_sim_${crypto.randomBytes(6).toString("hex")}`;
    await recordAuditLog({
      organizationId,
      action: "mercadopago_preference_simulated",
      entityType: "payment_preference",
      entityId: mockPrefId,
      metadata: { amount, currencyId, passCode, reason: "MERCADOPAGO_ACCESS_TOKEN not set" }
    });

    return NextResponse.json({
      ok: true,
      mode: "simulated",
      provider: "mercadopago",
      preferenceId: mockPrefId,
      checkoutUrl: `/demonstracao?pref=${encodeURIComponent(mockPrefId)}`,
      passCode,
      organizationId,
      note: "Defina MERCADOPAGO_ACCESS_TOKEN no ambiente para gerar preferencia real na API do Mercado Pago."
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao processar checkout do Mercado Pago.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
