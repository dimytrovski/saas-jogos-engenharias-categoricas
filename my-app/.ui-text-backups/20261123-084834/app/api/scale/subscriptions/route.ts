import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { PLAN_CATALOG, PlanTier, recordAuditLog } from "@/lib/scale-governance";

type SubStatus = "active" | "trialing" | "past_due" | "canceled";
const VALID_STATUSES: SubStatus[] = ["active", "trialing", "past_due", "canceled"];

interface SubRow extends RowDataPacket {
  id: number;
  organization_id: number;
  plan_tier: PlanTier;
  status: SubStatus;
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const organizationId = Number(body?.organizationId);
    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Campo 'organizationId' valido e obrigatorio." },
        { status: 400 }
      );
    }

    const rawStatus = String(body?.status || "active").toLowerCase() as SubStatus;
    const nextStatus: SubStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : "active";

    const pool = await getDigestPool();
    const [subs] = await pool.query<SubRow[]>(
      `SELECT id, organization_id, plan_tier, status
       FROM organization_subscriptions
       WHERE organization_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [organizationId]
    );

    const currentSub = subs[0];
    const rawTier = String(body?.planTier || currentSub?.plan_tier || "growth").toLowerCase() as PlanTier;
    const nextTier: PlanTier = rawTier in PLAN_CATALOG ? rawTier : "starter";
    const plan = PLAN_CATALOG[nextTier];
    const actorEmail = body?.actorEmail ? String(body.actorEmail).trim() : null;

    const orgStatus =
      nextStatus === "canceled" ? "suspended" : nextStatus === "past_due" ? "past_due" : "active";

    await pool.query<ResultSetHeader>(
      `UPDATE organizations
       SET plan_tier = ?, max_licenses = ?, max_streams = ?, status = ?
       WHERE id = ?`,
      [nextTier, plan.maxLicenses, plan.maxStreams, orgStatus, organizationId]
    );

    if (currentSub) {
      await pool.query<ResultSetHeader>(
        `UPDATE organization_subscriptions
         SET plan_tier = ?, status = ?
         WHERE id = ?`,
        [nextTier, nextStatus, currentSub.id]
      );
    }

    await recordAuditLog({
      organizationId,
      actorEmail,
      action: "subscription_status_updated",
      entityType: "organization_subscription",
      entityId: currentSub ? currentSub.id : organizationId,
      metadata: {
        previousStatus: currentSub?.status ?? null,
        nextStatus,
        planTier: nextTier,
        orgStatus
      }
    });

    return NextResponse.json({
      ok: true,
      organizationId,
      subscriptionId: currentSub?.id ?? null,
      status: nextStatus,
      orgStatus,
      planTier: nextTier
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar assinatura";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
