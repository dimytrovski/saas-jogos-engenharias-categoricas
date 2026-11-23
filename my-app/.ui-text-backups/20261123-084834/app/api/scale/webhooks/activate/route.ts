import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { recordAuditLog } from "@/lib/scale-governance";

const seenEventIds = new Set<string>();

interface AuditRow extends RowDataPacket {
  id: number;
}

function verifySignature(rawBody: string, headerSig: string | null, secret: string): boolean {
  if (!headerSig) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = headerSig.replace(/^sha256=/i, "").trim();
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.WEBHOOK_SIGNING_SECRET || "dev_local_webhook_secret";
    const sigHeader = req.headers.get("x-webhook-signature");

    if (!verifySignature(rawBody, sigHeader, secret)) {
      return NextResponse.json(
        { ok: false, code: "INVALID_SIGNATURE", error: "Assinatura de webhook invalida." },
        { status: 401 }
      );
    }

    const body = rawBody ? JSON.parse(rawBody) : {};
    const eventId = String(body?.eventId || req.headers.get("x-webhook-event-id") || "").trim();
    const eventType = String(body?.eventType || "payment.succeeded").trim();
    const organizationId =
      typeof body?.organizationId === "number" && body.organizationId > 0
        ? body.organizationId
        : null;
    const passCode = body?.passCode ? String(body.passCode).trim() : "";

    if (!eventId) {
      return NextResponse.json(
        { ok: false, code: "MISSING_EVENT_ID", error: "Campo 'eventId' e obrigatorio." },
        { status: 400 }
      );
    }

    if (seenEventIds.has(eventId)) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        eventId,
        message: "Evento ja processado em memoria."
      });
    }

    const pool = await getDigestPool();
    const [existing] = await pool.query<AuditRow[]>(
      `SELECT id
       FROM audit_logs
       WHERE action = 'webhook_activation_applied'
         AND entity_id = ?
       LIMIT 1`,
      [eventId]
    );

    if (existing.length > 0) {
      seenEventIds.add(eventId);
      return NextResponse.json({
        ok: true,
        duplicate: true,
        eventId,
        message: "Evento ja aplicado na base de dados."
      });
    }

    seenEventIds.add(eventId);

    if (eventType === "payment.succeeded") {
      if (organizationId) {
        await pool.query<ResultSetHeader>(
          `UPDATE organizations
           SET status = 'active'
           WHERE id = ?`,
          [organizationId]
        );
      }

      if (passCode) {
        await pool.query<ResultSetHeader>(
          `UPDATE live_access_passes
           SET status = 'active'
           WHERE pass_code = ?`,
          [passCode]
        );
      }
    }

    await recordAuditLog({
      organizationId,
      action: "webhook_activation_applied",
      entityType: "payment_webhook",
      entityId: eventId,
      metadata: { eventType, organizationId, passCode: passCode || null }
    });

    return NextResponse.json({
      ok: true,
      duplicate: false,
      eventId,
      eventType,
      organizationId,
      passCode: passCode || null,
      activated: eventType === "payment.succeeded"
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao processar ativacao via webhook";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
