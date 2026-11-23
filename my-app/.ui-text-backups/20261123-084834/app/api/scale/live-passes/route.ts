import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { recordAuditLog } from "@/lib/scale-governance";

interface PassRow extends RowDataPacket {
  id: number;
  organization_id: number;
  pass_code: string;
  pass_type: string;
  price_brl: string | number;
  partner_share_pct: string | number;
  platform_fee_pct: string | number;
  starts_at: string;
  expires_at: string;
  status: "active" | "expired" | "revoked";
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

export async function GET(req: NextRequest) {
  try {
    const code = String(req.nextUrl.searchParams.get("code") || "").trim();
    if (!code) {
      return NextResponse.json({ ok: false, error: "Parametro 'code' e obrigatorio." }, { status: 400 });
    }

    const pool = await getDigestPool();
    const [rows] = await pool.query<PassRow[]>(
      `SELECT id, organization_id, pass_code, pass_type, price_brl, partner_share_pct, platform_fee_pct, starts_at, expires_at, status
       FROM live_access_passes
       WHERE pass_code = ?
       LIMIT 1`,
      [code]
    );

    const pass = rows[0];
    if (!pass) {
      return NextResponse.json({ ok: false, allowed: false, code: "PASS_NOT_FOUND", error: "Passe nao encontrado." }, { status: 404 });
    }

    const now = Date.now();
    const startMs = new Date(pass.starts_at).getTime();
    const endMs = new Date(pass.expires_at).getTime();
    const withinWindow = now >= startMs && now <= endMs;
    const allowed = pass.status === "active" && withinWindow;

    await recordAuditLog({
      organizationId: pass.organization_id,
      action: allowed ? "live_pass_access_allowed" : "live_pass_access_denied",
      entityType: "live_access_pass",
      entityId: pass.pass_code,
      metadata: { status: pass.status, withinWindow, startsAt: pass.starts_at, expiresAt: pass.expires_at }
    });

    return NextResponse.json({
      ok: allowed,
      allowed,
      passCode: pass.pass_code,
      status: pass.status,
      withinWindow,
      startsAt: pass.starts_at,
      expiresAt: pass.expires_at
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao validar passe";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const organizationId = Number(body?.organizationId);
    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      return NextResponse.json({ ok: false, error: "Campo 'organizationId' e obrigatorio." }, { status: 400 });
    }

    const passType = ["ppv_event", "timed_license", "promo_window"].includes(String(body?.passType))
      ? String(body.passType)
      : "ppv_event";
    const grossAmountBrl = Math.max(0, Number(body?.priceBrl ?? 49.9));
    const partnerSharePct = Math.min(80, Math.max(0, Number(body?.partnerSharePct ?? 20)));
    const platformFeePct = Math.min(50, Math.max(0, Number(body?.platformFeePct ?? 10)));
    const durationMinutes = Math.max(1, Number(body?.durationMinutes ?? 180));
    const passCode = String(body?.passCode || `PASS_${Date.now().toString(36).toUpperCase()}`).trim();
    const actorEmail = body?.actorEmail ? String(body.actorEmail).trim() : null;

    const platformAmountBrl = round2(grossAmountBrl * (platformFeePct / 100));
    const partnerAmountBrl = round2(grossAmountBrl * (partnerSharePct / 100));
    const organizerNetBrl = round2(Math.max(0, grossAmountBrl - platformAmountBrl - partnerAmountBrl));

    const pool = await getDigestPool();
    await pool.query<ResultSetHeader>(
      `INSERT INTO live_access_passes
         (organization_id, pass_code, pass_type, price_brl, partner_share_pct, platform_fee_pct, starts_at, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? MINUTE), 'active')`,
      [organizationId, passCode, passType, grossAmountBrl, partnerSharePct, platformFeePct, durationMinutes]
    );

    await pool.query<ResultSetHeader>(
      `INSERT INTO live_revenue_splits
         (organization_id, pass_code, gross_amount_brl, platform_amount_brl, partner_amount_brl, organizer_net_brl)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [organizationId, passCode, grossAmountBrl, platformAmountBrl, partnerAmountBrl, organizerNetBrl]
    );

    await recordAuditLog({
      organizationId,
      actorEmail,
      action: "live_pass_and_split_created",
      entityType: "live_access_pass",
      entityId: passCode,
      metadata: {
        passType,
        grossAmountBrl,
        platformAmountBrl,
        partnerAmountBrl,
        organizerNetBrl,
        durationMinutes
      }
    });

    return NextResponse.json({
      ok: true,
      passCode,
      passType,
      durationMinutes,
      split: {
        grossAmountBrl,
        platformAmountBrl,
        partnerAmountBrl,
        organizerNetBrl
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar passe ao vivo";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
