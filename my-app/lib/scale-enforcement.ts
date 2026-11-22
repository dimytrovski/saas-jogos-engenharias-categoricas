import { RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "./digest-db";
import { PLAN_CATALOG, PlanTier, checkCapacity, recordAuditLog } from "./scale-governance";

interface OrgEnforcementRow extends RowDataPacket {
  id: number;
  name: string;
  plan_tier: PlanTier;
  max_licenses: number;
  max_streams: number;
  status: "active" | "past_due" | "suspended";
}

export async function enforceResourceCreation(params: {
  organizationId?: number | null;
  tier?: PlanTier;
  resourceType: "stream" | "license";
  actorEmail?: string | null;
  customMaxLicenses?: number;
  customMaxStreams?: number;
}) {
  const pool = await getDigestPool();
  let org: OrgEnforcementRow | null = null;

  if (typeof params.organizationId === "number" && params.organizationId > 0) {
    const [rows] = await pool.query<OrgEnforcementRow[]>(
      `SELECT id, name, plan_tier, max_licenses, max_streams, status
       FROM organizations
       WHERE id = ?
       LIMIT 1`,
      [params.organizationId]
    );
    org = rows[0] || null;
  }

  if (org && (org.status === "past_due" || org.status === "suspended")) {
    await recordAuditLog({
      organizationId: org.id,
      actorEmail: params.actorEmail ?? null,
      action: "resource_blocked_billing_status",
      entityType: params.resourceType,
      entityId: org.id,
      metadata: { orgStatus: org.status, resourceType: params.resourceType }
    });

    return {
      allowed: false,
      httpStatus: 402,
      code: "SUBSCRIPTION_NOT_ACTIVE",
      reason: `Organizacao #${org.id} (${org.name}) esta com status '${org.status}'. Regularize a cobranca para criar ${params.resourceType}.`,
      organizationId: org.id
    };
  }

  const effectiveTier: PlanTier =
    params.tier && params.tier in PLAN_CATALOG
      ? params.tier
      : org?.plan_tier && org.plan_tier in PLAN_CATALOG
        ? org.plan_tier
        : "starter";

  const capacity = await checkCapacity({
    tier: effectiveTier,
    customMaxLicenses: params.customMaxLicenses ?? (org ? org.max_licenses : undefined),
    customMaxStreams: params.customMaxStreams ?? (org ? org.max_streams : undefined)
  });

  await recordAuditLog({
    organizationId: org?.id ?? null,
    actorEmail: params.actorEmail ?? null,
    action: capacity.allowed ? "resource_creation_allowed" : "resource_creation_blocked",
    entityType: params.resourceType,
    entityId: effectiveTier,
    metadata: {
      resourceType: params.resourceType,
      tier: effectiveTier,
      currentStreams: capacity.currentStreams,
      currentLicenses: capacity.currentLicenses,
      maxStreams: capacity.plan.maxStreams,
      maxLicenses: capacity.plan.maxLicenses
    }
  });

  if (!capacity.allowed) {
    return {
      allowed: false,
      httpStatus: 409,
      code: "PLAN_LIMIT_EXCEEDED",
      reason: capacity.reason || "Limite do plano atingido.",
      capacity,
      organizationId: org?.id ?? null
    };
  }

  return {
    allowed: true,
    httpStatus: 200,
    code: "ALLOWED",
    capacity,
    organizationId: org?.id ?? null
  };
}
