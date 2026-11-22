import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { recordAuditLog } from "@/lib/scale-governance";

const processedGatewayEvents = new Set<string>();

interface AuditEventRow extends RowDataPacket {
  id: number;
}

function verifyHmac(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expectedHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const cleanSig = signatureHeader.replace(/^sha256=/i, "").trim();
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(cleanSig, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function normalizeGatewayEvent(payload: Record<string, unknown>, req: NextRequest) {
  const provider = String(payload?.provider || req.headers.get("x-payment-provider") || "gateway").trim();
  const rawType = String(payload?.type || payload?.event || payload?.eventType || "").trim();

  const isPaid =
    rawType === "payment.succeeded" ||
    rawType === "checkout.session.completed" ||
    rawType === "invoice.paid" ||
    rawType === "payment.approved" ||
    String(payload?.status || "").toLowerCase() === "approved" ||
    String(payload?.status || "").toLowerCase() === "paid";

  const eventId = String(
    payload?.id || payload?.eventId || req.headers.get("x-webhook-event-id") || ""
  ).trim();

  const meta = (payload?.metadata && typeof payload.metadata === "object"
    ? payload.metadata
    : {}) as Record<string, unknown>;

  const organizationIdRaw = Number(
    payload?.organizationId ?? meta.organizationId ?? meta.organization_id ?? 0
  );
  const organizationId =
    Number.isInteger(organizationIdRaw) && organizationIdRaw > 0 ? organizationIdRaw : null;

  const passCode = String(
    payload?.passCode ?? meta.passCode ?? meta.pass_code ?? ""
  ).trim();

  return {
    provider,
    rawType: rawType || "unknown",
    eventId,
    isPaid,
    organizationId,
    passCode
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.WEBHOOK_SIGNING_SECRET || "dev_local_webhook_secret";
    const sigHeader = req.headers.get("x-webhook-signature");

    if (!verifyHmac(rawBody, sigHeader, secret)) {
      return NextResponse.json(
        { ok: false, code: "INVALID_SIGNATURE", error: "Assinatura HMAC do gateway invalida." },
        { status: 401 }
      );
    }

    const parsed = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    const norm = normalizeGatewayEvent(parsed, req);

    if (!norm.eventId) {
      return NextResponse.json(
        { ok: false, code: "MISSING_EVENT_ID", error: "Identificador de evento do gateway ausente." },
        { status: 400 }
      );
    }

    if (processedGatewayEvents.has(norm.eventId)) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        eventId: norm.eventId,
        provider: norm.provider
      });
    }

    const pool = await getDigestPool();
    const [existing] = await pool.query<AuditEventRow[]>(
      `SELECT id
       FROM audit_logs
       WHERE action = 'gateway_webhook_processed'
         AND entity_id = ?
       LIMIT 1`,
      [norm.eventId]
    );

    if (existing.length > 0) {
      processedGatewayEvents.add(norm.eventId);
      return NextResponse.json({
        ok: true,
        duplicate: true,
        eventId: norm.eventId,
        provider: norm.provider
      });
    }

    processedGatewayEvents.add(norm.eventId);

    if (norm.isPaid) {
      if (norm.organizationId) {
        await pool.query<ResultSetHeader>(
          `UPDATE organizations
           SET status = 'active'
           WHERE id = ?`,
          [norm.organizationId]
        );
      }

      if (norm.passCode) {
        await pool.query<ResultSetHeader>(
          `UPDATE live_access_passes
           SET status = 'active'
           WHERE pass_code = ?`,
          [norm.passCode]
        );
      }
    }

    await recordAuditLog({
      organizationId: norm.organizationId,
      action: "gateway_webhook_processed",
      entityType: "payment_gateway",
      entityId: norm.eventId,
      metadata: {
        provider: norm.provider,
        rawType: norm.rawType,
        isPaid: norm.isPaid,
        passCode: norm.passCode || null
      }
    });

    return NextResponse.json({
      ok: true,
      duplicate: false,
      eventId: norm.eventId,
      provider: norm.provider,
      rawType: norm.rawType,
      activated: norm.isPaid,
      organizationId: norm.organizationId,
      passCode: norm.passCode || null
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao processar webhook do gateway";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
