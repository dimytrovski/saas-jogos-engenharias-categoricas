import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { PLAN_CATALOG, PlanTier, recordAuditLog } from "@/lib/scale-governance";

interface EndpointRow extends RowDataPacket {
  id: number;
  target_url: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const organizationId = Number(body?.organizationId);
    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Campo 'organizationId' valido e obrigatorio." },
        { status: 400 }
      );
    }

    const rawTier = String(body?.planTier || "growth").toLowerCase() as PlanTier;
    const planTier: PlanTier = rawTier in PLAN_CATALOG ? rawTier : "growth";
    const plan = PLAN_CATALOG[planTier];
    const billingCycle = body?.billingCycle === "annual" ? "annual" : "monthly";
    const amountBrl =
      typeof body?.amountBrl === "number" && body.amountBrl > 0
        ? body.amountBrl
        : billingCycle === "annual"
          ? Number((plan.suggestedMonthlyBrl * 10).toFixed(2))
          : plan.suggestedMonthlyBrl;
    const paymentRef = String(body?.paymentRef || `chk_${Date.now()}`).trim();
    const actorEmail = body?.actorEmail ? String(body.actorEmail).trim() : null;

    const pool = await getDigestPool();

    await pool.query<ResultSetHeader>(
      `UPDATE organizations
       SET plan_tier = ?, max_licenses = ?, max_streams = ?, monthly_price_brl = ?, status = 'active'
       WHERE id = ?`,
      [planTier, plan.maxLicenses, plan.maxStreams, amountBrl, organizationId]
    );

    const [subRes] = await pool.query<ResultSetHeader>(
      `INSERT INTO organization_subscriptions
         (organization_id, plan_tier, billing_cycle, amount_brl, status, external_ref, current_period_end)
       VALUES (?, ?, ?, ?, 'active', ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [
        organizationId,
        planTier,
        billingCycle,
        amountBrl,
        paymentRef,
        billingCycle === "annual" ? 365 : 30
      ]
    );

    const subscriptionId = Number(subRes.insertId);
    const eventType = "subscription.activated";
    const payload = {
      organizationId,
      subscriptionId,
      planTier,
      billingCycle,
      amountBrl,
      paymentRef
    };

    const [endpoints] = await pool.query<EndpointRow[]>(
      `SELECT id, target_url
       FROM webhook_endpoints
       WHERE is_active = 1
       ORDER BY id DESC
       LIMIT 10`
    );

    let webhooksDispatched = 0;
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
        [ep.id, eventType, ep.target_url, JSON.stringify(payload), statusCode, delivered ? 1 : 0]
      );
      webhooksDispatched += 1;
    }

    await recordAuditLog({
      organizationId,
      actorEmail,
      action: "checkout_completed_subscription_activated",
      entityType: "organization_subscription",
      entityId: subscriptionId,
      metadata: { ...payload, webhooksDispatched }
    });

    return NextResponse.json({
      ok: true,
      checkout: {
        organizationId,
        subscriptionId,
        planTier,
        billingCycle,
        amountBrl,
        paymentRef,
        status: "active",
        webhooksDispatched
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no checkout";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
