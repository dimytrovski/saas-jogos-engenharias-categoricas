import { NextRequest, NextResponse } from "next/server";
import { PLAN_CATALOG, PlanTier, checkCapacity, recordAuditLog } from "@/lib/scale-governance";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTier = String(body?.tier || "starter").toLowerCase() as PlanTier;
    const tier: PlanTier = rawTier in PLAN_CATALOG ? rawTier : "starter";
    const resourceType = body?.resourceType === "stream" ? "stream" : "license";
    const actorEmail = body?.actorEmail ? String(body.actorEmail).trim() : null;
    const organizationId =
      typeof body?.organizationId === "number" ? body.organizationId : null;

    const customMaxLicenses =
      typeof body?.customMaxLicenses === "number" ? body.customMaxLicenses : undefined;
    const customMaxStreams =
      typeof body?.customMaxStreams === "number" ? body.customMaxStreams : undefined;

    const capacity = await checkCapacity({
      tier,
      customMaxLicenses,
      customMaxStreams
    });

    await recordAuditLog({
      organizationId,
      actorEmail,
      action: capacity.allowed ? "capacity_check_allowed" : "capacity_check_blocked",
      entityType: resourceType,
      entityId: tier,
      metadata: {
        resourceType,
        tier,
        currentStreams: capacity.currentStreams,
        currentLicenses: capacity.currentLicenses,
        maxStreams: capacity.plan.maxStreams,
        maxLicenses: capacity.plan.maxLicenses,
        simulatedCap: customMaxLicenses !== undefined || customMaxStreams !== undefined
      }
    });

    if (!capacity.allowed) {
      return NextResponse.json(
        {
          ok: false,
          code: "PLAN_LIMIT_EXCEEDED",
          error: capacity.reason || "Limite do plano atingido.",
          capacity
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      allowed: true,
      resourceType,
      capacity
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao validar capacidade";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
