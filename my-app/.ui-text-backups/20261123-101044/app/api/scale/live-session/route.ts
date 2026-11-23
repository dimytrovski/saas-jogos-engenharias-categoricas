import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { recordAuditLog } from "@/lib/scale-governance";

interface OrgSessionRow extends RowDataPacket {
  id: number;
  name: string;
  plan_tier: string;
  max_streams: number;
  max_licenses: number;
  status: "active" | "past_due" | "suspended";
}

const activeSessionsByOrg = new Map<string, Set<string>>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const organizationId = Number(body?.organizationId);
    const sessionId = String(body?.sessionId || "").trim();
    const action = body?.action === "release" ? "release" : "acquire";
    const actorEmail = body?.actorEmail ? String(body.actorEmail).trim() : null;

    if (!Number.isInteger(organizationId) || organizationId <= 0 || !sessionId) {
      return NextResponse.json(
        { ok: false, error: "Campos 'organizationId' e 'sessionId' sao obrigatorios." },
        { status: 400 }
      );
    }

    const pool = await getDigestPool();
    const [rows] = await pool.query<OrgSessionRow[]>(
      `SELECT id, name, plan_tier, max_streams, max_licenses, status
       FROM organizations
       WHERE id = ?
       LIMIT 1`,
      [organizationId]
    );

    const org = rows[0];
    if (!org) {
      return NextResponse.json(
        { ok: false, error: `Organizacao #${organizationId} nao encontrada.` },
        { status: 404 }
      );
    }

    const key = `org_${org.id}`;
    if (!activeSessionsByOrg.has(key)) {
      activeSessionsByOrg.set(key, new Set<string>());
    }
    const sessions = activeSessionsByOrg.get(key)!;

    if (action === "release") {
      sessions.delete(sessionId);
      await recordAuditLog({
        organizationId: org.id,
        actorEmail,
        action: "live_session_released",
        entityType: "live_session",
        entityId: sessionId,
        metadata: { activeSessions: sessions.size }
      });

      return NextResponse.json({
        ok: true,
        action: "release",
        sessionId,
        activeSessions: sessions.size
      });
    }

    // Revogacao imediata se assinatura/organizacao nao estiver ativa
    if (org.status !== "active") {
      sessions.delete(sessionId);
      await recordAuditLog({
        organizationId: org.id,
        actorEmail,
        action: "live_session_revoked_billing",
        entityType: "live_session",
        entityId: sessionId,
        metadata: { orgStatus: org.status, sessionId }
      });

      return NextResponse.json(
        {
          ok: false,
          allowed: false,
          code: "LIVE_ACCESS_REVOKED",
          error: `Acesso ao vivo bloqueado: organizacao #${org.id} esta '${org.status}'.`,
          orgStatus: org.status
        },
        { status: 402 }
      );
    }

    const maxConcurrent =
      typeof body?.maxConcurrentOverride === "number" && body.maxConcurrentOverride >= 0
        ? body.maxConcurrentOverride
        : Math.max(1, Number(org.max_streams || 1));

    if (!sessions.has(sessionId) && sessions.size >= maxConcurrent) {
      await recordAuditLog({
        organizationId: org.id,
        actorEmail,
        action: "live_session_blocked_concurrency",
        entityType: "live_session",
        entityId: sessionId,
        metadata: { activeSessions: sessions.size, maxConcurrent }
      });

      return NextResponse.json(
        {
          ok: false,
          allowed: false,
          code: "CONCURRENCY_LIMIT_REACHED",
          error: `Limite de sessoes simultaneas atingido (${sessions.size}/${maxConcurrent}).`,
          activeSessions: sessions.size,
          maxConcurrent
        },
        { status: 409 }
      );
    }

    sessions.add(sessionId);
    await recordAuditLog({
      organizationId: org.id,
      actorEmail,
      action: "live_session_acquired",
      entityType: "live_session",
      entityId: sessionId,
      metadata: { activeSessions: sessions.size, maxConcurrent, planTier: org.plan_tier }
    });

    return NextResponse.json({
      ok: true,
      allowed: true,
      sessionId,
      activeSessions: sessions.size,
      maxConcurrent,
      planTier: org.plan_tier
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao validar sessao ao vivo";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
