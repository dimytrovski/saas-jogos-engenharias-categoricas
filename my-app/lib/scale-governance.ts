import { RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "./digest-db";

export type PlanTier = "starter" | "growth" | "scale" | "enterprise";

export interface PlanLimits {
  tier: PlanTier;
  maxLicenses: number;
  maxStreams: number;
  suggestedMonthlyBrl: number;
}

export const PLAN_CATALOG: Record<PlanTier, PlanLimits> = {
  starter: { tier: "starter", maxLicenses: 10, maxStreams: 3, suggestedMonthlyBrl: 197 },
  growth: { tier: "growth", maxLicenses: 50, maxStreams: 15, suggestedMonthlyBrl: 997 },
  scale: { tier: "scale", maxLicenses: 250, maxStreams: 60, suggestedMonthlyBrl: 3997 },
  enterprise: { tier: "enterprise", maxLicenses: 2000, maxStreams: 500, suggestedMonthlyBrl: 9997 }
};

interface CountRow extends RowDataPacket {
  total: number | string;
}

export async function recordAuditLog(params: {
  organizationId?: number | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const pool = await getDigestPool();
    await pool.query(
      `INSERT INTO audit_logs (organization_id, actor_email, action, entity_type, entity_id, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.organizationId ?? null,
        params.actorEmail ?? null,
        params.action,
        params.entityType,
        params.entityId !== undefined && params.entityId !== null ? String(params.entityId) : null,
        params.metadata ? JSON.stringify(params.metadata) : null
      ]
    );
  } catch {
    // Auditoria nao deve interromper o fluxo principal caso a tabela ainda nao exista
  }
}

export async function checkCapacity(params: {
  tier?: PlanTier;
  customMaxLicenses?: number;
  customMaxStreams?: number;
}): Promise<{
  allowed: boolean;
  plan: PlanLimits;
  currentStreams: number;
  currentLicenses: number;
  reason?: string;
}> {
  const tier = params.tier || "starter";
  const basePlan = PLAN_CATALOG[tier] || PLAN_CATALOG.starter;
  const plan: PlanLimits = {
    ...basePlan,
    maxLicenses: params.customMaxLicenses ?? basePlan.maxLicenses,
    maxStreams: params.customMaxStreams ?? basePlan.maxStreams
  };

  const pool = await getDigestPool();
  let currentStreams = 0;
  let currentLicenses = 0;

  try {
    const [sRows] = await pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM `streams`");
    currentStreams = Number(sRows?.[0]?.total || 0);
  } catch {
    currentStreams = 0;
  }

  try {
    const [lRows] = await pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM `stream_licenses`");
    currentLicenses = Number(lRows?.[0]?.total || 0);
  } catch {
    currentLicenses = 0;
  }

  if (currentLicenses >= plan.maxLicenses) {
    return {
      allowed: false,
      plan,
      currentStreams,
      currentLicenses,
      reason: `Limite de licencas atingido (${currentLicenses}/${plan.maxLicenses}) para o plano ${plan.tier}.`
    };
  }

  if (currentStreams >= plan.maxStreams) {
    return {
      allowed: false,
      plan,
      currentStreams,
      currentLicenses,
      reason: `Limite de streams atingido (${currentStreams}/${plan.maxStreams}) para o plano ${plan.tier}.`
    };
  }

  return {
    allowed: true,
    plan,
    currentStreams,
    currentLicenses
  };
}
