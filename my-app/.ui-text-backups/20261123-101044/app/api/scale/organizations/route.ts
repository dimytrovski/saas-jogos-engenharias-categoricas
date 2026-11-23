import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { PLAN_CATALOG, PlanTier, recordAuditLog } from "@/lib/scale-governance";

interface OrgRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  plan_tier: PlanTier;
  max_licenses: number;
  max_streams: number;
  monthly_price_brl: string | number;
  status: string;
  created_at: string;
}

function toSlug(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "org"}-${Date.now().toString(36)}`;
}

export async function GET() {
  try {
    const pool = await getDigestPool();
    const [rows] = await pool.query<OrgRow[]>(
      `SELECT id, name, slug, plan_tier, max_licenses, max_streams, monthly_price_brl, status, created_at
       FROM organizations
       ORDER BY id DESC
       LIMIT 50`
    );

    return NextResponse.json({
      ok: true,
      total: rows.length,
      organizations: rows
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao listar organizacoes";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Campo 'name' e obrigatorio." }, { status: 400 });
    }

    const rawTier = String(body?.planTier || "growth").toLowerCase() as PlanTier;
    const tier: PlanTier = rawTier in PLAN_CATALOG ? rawTier : "starter";
    const plan = PLAN_CATALOG[tier];
    const billingCycle = body?.billingCycle === "annual" ? "annual" : "monthly";
    const amountBrl =
      typeof body?.amountBrl === "number" && body.amountBrl >= 0
        ? body.amountBrl
        : billingCycle === "annual"
          ? Number((plan.suggestedMonthlyBrl * 10).toFixed(2))
          : plan.suggestedMonthlyBrl;
    const actorEmail = body?.actorEmail ? String(body.actorEmail).trim() : null;
    const slug = toSlug(name);

    const pool = await getDigestPool();
    const [orgResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO organizations (name, slug, plan_tier, max_licenses, max_streams, monthly_price_brl, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [name, slug, tier, plan.maxLicenses, plan.maxStreams, amountBrl]
    );

    const orgId = Number(orgResult.insertId);

    await pool.query(
      `INSERT INTO organization_subscriptions (organization_id, plan_tier, billing_cycle, amount_brl, status, external_ref)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [orgId, tier, billingCycle, amountBrl, `sub_${orgId}_${Date.now()}`]
    );

    await recordAuditLog({
      organizationId: orgId,
      actorEmail,
      action: "organization_and_subscription_created",
      entityType: "organization",
      entityId: orgId,
      metadata: { name, slug, planTier: tier, billingCycle, amountBrl }
    });

    return NextResponse.json({
      ok: true,
      organization: {
        id: orgId,
        name,
        slug,
        planTier: tier,
        maxLicenses: plan.maxLicenses,
        maxStreams: plan.maxStreams,
        amountBrl,
        billingCycle
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar organizacao";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
