import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { recordAuditLog } from "@/lib/scale-governance";

interface EndpointRow extends RowDataPacket {
  id: number;
  organization_id: number | null;
  target_url: string;
  event_types: string;
  is_active: number;
  last_status_code: number | null;
  last_triggered_at: string | null;
  created_at: string;
}

interface DeliveryRow extends RowDataPacket {
  id: number;
  webhook_id: number | null;
  event_type: string;
  target_url: string;
  response_status: number | null;
  delivered: number;
  created_at: string;
}

export async function GET() {
  try {
    const pool = await getDigestPool();
    const [endpoints] = await pool.query<EndpointRow[]>(
      `SELECT id, organization_id, target_url, event_types, is_active, last_status_code, last_triggered_at, created_at
       FROM webhook_endpoints
       ORDER BY id DESC
       LIMIT 25`
    );
    const [deliveries] = await pool.query<DeliveryRow[]>(
      `SELECT id, webhook_id, event_type, target_url, response_status, delivered, created_at
       FROM webhook_deliveries
       ORDER BY id DESC
       LIMIT 25`
    );

    return NextResponse.json({
      ok: true,
      endpointsCount: endpoints.length,
      deliveriesCount: deliveries.length,
      endpoints,
      deliveries
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar webhooks";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body?.mode === "dispatch" ? "dispatch" : "register";
    const pool = await getDigestPool();

    if (mode === "register") {
      const targetUrl = String(body?.targetUrl || "").trim();
      if (!targetUrl) {
        return NextResponse.json({ ok: false, error: "Campo 'targetUrl' e obrigatorio." }, { status: 400 });
      }
      const eventTypes = String(body?.eventTypes || "subscription.activated,subscription.canceled").trim();
      const organizationId =
        typeof body?.organizationId === "number" ? body.organizationId : null;

      const [res] = await pool.query<ResultSetHeader>(
        `INSERT INTO webhook_endpoints (organization_id, target_url, event_types, is_active)
         VALUES (?, ?, ?, 1)`,
        [organizationId, targetUrl, eventTypes]
      );
      const webhookId = Number(res.insertId);

      await recordAuditLog({
        organizationId,
        action: "webhook_endpoint_registered",
        entityType: "webhook_endpoint",
        entityId: webhookId,
        metadata: { targetUrl, eventTypes }
      });

      return NextResponse.json({
        ok: true,
        mode: "register",
        webhook: { id: webhookId, targetUrl, eventTypes, active: true }
      });
    }

    // mode === "dispatch"
    const eventType = String(body?.eventType || "subscription.activated").trim();
    const payload =
      body?.payload && typeof body.payload === "object"
        ? body.payload
        : { event: eventType, timestamp: new Date().toISOString() };

    const [endpoints] = await pool.query<EndpointRow[]>(
      `SELECT id, organization_id, target_url, event_types, is_active
       FROM webhook_endpoints
       WHERE is_active = 1
       ORDER BY id DESC
       LIMIT 10`
    );

    const results: Array<{
      webhookId: number;
      targetUrl: string;
      delivered: boolean;
      statusCode: number | null;
    }> = [];

    for (const ep of endpoints) {
      let delivered = false;
      let statusCode: number | null = null;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch(ep.target_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SaaS-Event": eventType
          },
          body: JSON.stringify({ eventType, data: payload }),
          signal: controller.signal
        });
        clearTimeout(timer);
        statusCode = resp.status;
        delivered = resp.ok;
      } catch {
        delivered = false;
        statusCode = null;
      }

      await pool.query(
        `INSERT INTO webhook_deliveries (webhook_id, event_type, target_url, payload_json, response_status, delivered)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ep.id,
          eventType,
          ep.target_url,
          JSON.stringify(payload),
          statusCode,
          delivered ? 1 : 0
        ]
      );

      await pool.query(
        `UPDATE webhook_endpoints
         SET last_status_code = ?, last_triggered_at = NOW()
         WHERE id = ?`,
        [statusCode, ep.id]
      );

      await recordAuditLog({
        organizationId: ep.organization_id,
        action: "webhook_event_dispatched",
        entityType: "webhook_delivery",
        entityId: ep.id,
        metadata: { eventType, targetUrl: ep.target_url, statusCode, delivered }
      });

      results.push({
        webhookId: ep.id,
        targetUrl: ep.target_url,
        delivered,
        statusCode
      });
    }

    return NextResponse.json({
      ok: true,
      mode: "dispatch",
      eventType,
      endpointsProcessed: results.length,
      results
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao processar webhook";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
