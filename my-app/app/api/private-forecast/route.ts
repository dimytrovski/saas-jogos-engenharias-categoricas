import { NextRequest, NextResponse } from "next/server";
import { calculateConcreteScenario } from "@/lib/synstrom-private-forecast";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const expectedKey = process.env.SYNSTROM_OWNER_KEY?.trim();
  const providedKey = req.headers.get("x-owner-key")?.trim() || "";

  if (!expectedKey || providedKey !== expectedKey) {
    return NextResponse.json(
      { ok: false, error: "Acesso restrito." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const result = calculateConcreteScenario({
      monthlyActiveSubscribers: body.monthlyActiveSubscribers ?? 0,
      monthlyPriceBrl: body.monthlyPriceBrl ?? 0,
      monthlyPassesSold: body.monthlyPassesSold ?? 0,
      passPriceBrl: body.passPriceBrl ?? 0,
      deploymentsClosed: body.deploymentsClosed ?? 0,
      deploymentPriceBrl: body.deploymentPriceBrl ?? 0,
      gatewayFeePct: body.gatewayFeePct ?? 4.99,
      monthlyInfraCostBrl: body.monthlyInfraCostBrl ?? 0
    });

    return NextResponse.json({ ok: true, forecast: result });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload invalido." },
      { status: 400 }
    );
  }
}