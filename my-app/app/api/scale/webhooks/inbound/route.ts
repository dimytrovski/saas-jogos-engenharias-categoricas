import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { recordAuditLog } from "@/lib/scale-governance";

const processedEvents = new Set<string>();

interface ExistingAuditRow extends RowDataPacket {
  id: number;
}

function verifyHmacSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/i, "").trim();
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.WEBHOOK_SIGNING_SECRET || "dev_local_webhook_secret";
    const signatureHeader = req.headers.get("x-webhook-signature");

    if (!verifyHmacSignature(rawBody, signatureHeader, secret)) {
      return NextResponse.json(
        { ok: false, code: "INVALID_SIGNATURE", error: "Assinatura de webhook invalida." },
        { status: 401 }
      );
    }

    const parsed = rawBody ? JSON.parse(rawBody) : {};
    const eventId = String(
      parsed?.eventId || req.headers.get("x-webhook-event-id") || ""
    ).trim();
    const eventType = String(parsed?.eventType || "payment.succeeded").trim();
    const organizationId =
      typeof parsed?.organizationId === "number" ? parsed.organizationId : null;

    if (!eventId) {
      return NextResponse.json(
        { ok: false, code: "MISSING_EVENT_ID", error: "Campo 'eventId' e obrigatorio para idempotencia." },
        { status: 400 }
      );
    }

    if (processedEvents.has(eventId)) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        eventId,
        message: "Evento ja processado anteriormente (idempotencia aplicada)."
      });
    }

    const pool = await getDigestPool();
    const [existing] = await pool.query<ExistingAuditRow[]>(
      `SELECT id
       FROM audit_logs
       WHERE action = 'inbound_webhook_processed'
         AND entity_id = ?
       LIMIT 1`,
      [eventId]
    );

    if (existing.length > 0) {
      processedEvents.add(eventId);
      return NextResponse.json({
        ok: true,
        duplicate: true,
        eventId,
        message: "Evento ja registado na auditoria (idempotencia aplicada)."
      });
    }

    processedEvents.add(eventId);

    await recordAuditLog({
      organizationId,
      action: "inbound_webhook_processed",
      entityType: "webhook_event",
      entityId: eventId,
      metadata: { eventType, organizationId, payload: parsed }
    });

    return NextResponse.json({
      ok: true,
      duplicate: false,
      eventId,
      eventType,
      processed: true
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao processar webhook de entrada";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
