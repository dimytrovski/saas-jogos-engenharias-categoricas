import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { PLAN_CATALOG, PlanTier, checkCapacity, recordAuditLog } from "@/lib/scale-governance";

interface AuditRow extends RowDataPacket {
  id: number;
  organization_id: number | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const tierParam = (req.nextUrl.searchParams.get("tier") || "starter").toLowerCase() as PlanTier;
    const validTier: PlanTier = tierParam in PLAN_CATALOG ? tierParam : "starter";

    const capacity = await checkCapacity({ tier: validTier });
    const pool = await getDigestPool();

    let recentLogs: AuditRow[] = [];
    try {
      const [rows] = await pool.query<AuditRow[]>(
        `SELECT id, organization_id, actor_email, action, entity_type, entity_id, created_at
         FROM audit_logs
         ORDER BY id DESC
         LIMIT 15`
      );
      recentLogs = rows;
    } catch {
      recentLogs = [];
    }

    return NextResponse.json({
      ok: true,
      selectedTier: validTier,
      planCatalog: PLAN_CATALOG,
      capacity,
      recentAuditLogs: recentLogs
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar governanca de escala";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "governance_check").trim();
    const actorEmail = body?.actorEmail ? String(body.actorEmail).trim() : null;
    const tier = (String(body?.tier || "starter").toLowerCase()) as PlanTier;
    const validTier: PlanTier = tier in PLAN_CATALOG ? tier : "starter";

    await recordAuditLog({
      actorEmail,
      action,
      entityType: "scale_governance",
      entityId: validTier,
      metadata: { requestedTier: validTier }
    });

    const capacity = await checkCapacity({ tier: validTier });
    return NextResponse.json({ ok: true, recordedAction: action, capacity });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao registar auditoria";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
