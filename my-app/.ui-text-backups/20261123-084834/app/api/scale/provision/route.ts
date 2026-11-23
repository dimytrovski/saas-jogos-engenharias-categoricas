import { NextRequest, NextResponse } from "next/server";
import { PlanTier } from "@/lib/scale-governance";
import { enforceResourceCreation } from "@/lib/scale-enforcement";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resourceType = body?.resourceType === "stream" ? "stream" : "license";
    const organizationId =
      typeof body?.organizationId === "number" ? body.organizationId : null;
    const tier = body?.tier ? (String(body.tier).toLowerCase() as PlanTier) : undefined;
    const actorEmail = body?.actorEmail ? String(body.actorEmail).trim() : null;
    const customMaxLicenses =
      typeof body?.customMaxLicenses === "number" ? body.customMaxLicenses : undefined;
    const customMaxStreams =
      typeof body?.customMaxStreams === "number" ? body.customMaxStreams : undefined;

    const decision = await enforceResourceCreation({
      organizationId,
      tier,
      resourceType,
      actorEmail,
      customMaxLicenses,
      customMaxStreams
    });

    if (!decision.allowed) {
      return NextResponse.json(
        {
          ok: false,
          allowed: false,
          code: decision.code,
          error: decision.reason,
          capacity: "capacity" in decision ? decision.capacity : undefined
        },
        { status: decision.httpStatus }
      );
    }

    return NextResponse.json({
      ok: true,
      allowed: true,
      provisioned: true,
      resourceType,
      capacity: decision.capacity
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao aprovar recurso";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
