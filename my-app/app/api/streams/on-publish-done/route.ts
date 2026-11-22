import { enforceResourceCreation } from "@/lib/scale-enforcement";
function getWebhookSecretFromRequest(req: NextRequest): string | null {
  return (
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("x-rtmp-webhook-secret")
  );
}

function parseStreamAndToken(rawName: string, rawKey?: string | null) {
  const trimmedName = (rawName ?? "").trim();
  const qIndex = trimmedName.indexOf("?");
  if (qIndex !== -1) {
    const streamKey = trimmedName.slice(0, qIndex).trim();
    const params = new URLSearchParams(trimmedName.slice(qIndex + 1));
    const token = (params.get("key") ?? params.get("token") ?? rawKey ?? "").trim();
    return { streamKey, token };
  }
  return { streamKey: trimmedName, token: (rawKey ?? "").trim() };
}
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { getDbPool } from "../../../../lib/db";

interface ActiveSessionRow extends RowDataPacket {
  id: number;
  license_id: number | null;
  started_at: string;
}

interface LicenseSingleUseRow extends RowDataPacket {
  single_use: number;
}

async function parseDonePayload(req: NextRequest): Promise<Record<string, string>> {
  const payload: Record<string, string> = {};

  req.nextUrl.searchParams.forEach((value, key) => {
    payload[key] = value;
  });

  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  const rawBody = await req.text();

  if (rawBody) {
    if (contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(rawBody) as Record<string, unknown>;
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== undefined && value !== null) {
            payload[key] = String(value);
          }
        }
      } catch {
        // Ignora JSON invalido
      }
    } else {
      const formParams = new URLSearchParams(rawBody);
      formParams.forEach((value, key) => {
        payload[key] = value;
      });
    }
  }

  return payload;
}

export async function POST(req: NextRequest) {
    const __scaleGuard = await enforceResourceCreation({ resourceType: "stream" });
    if (!__scaleGuard.allowed) {
      return NextResponse.json(
        { ok: false, allowed: false, code: __scaleGuard.code, error: __scaleGuard.reason },
        { status: __scaleGuard.httpStatus }
      );
    }

  const expectedSecret = process.env.RTMP_WEBHOOK_SECRET;
  const providedSecret = getWebhookSecretFromRequest(req);
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ authorized: false, error: "Webhook nao autorizado" }, { status: 401 });
  }
  const data = await parseDonePayload(req);
  const streamKey = (data.name || data.stream || "").trim();

  if (!streamKey) {
    return NextResponse.json({ ok: true, ended: false }, { status: 200 });
  }

  const pool = await getDbPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [sessions] = await conn.query<ActiveSessionRow[]>(
      `SELECT id, license_id, started_at
       FROM stream_sessions
       WHERE stream_key = ? AND status = 'live'
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [streamKey]
    );

    const session = sessions[0];
    let durationSeconds: number | null = null;

    if (session) {
      const startedMs = new Date(session.started_at).getTime();
      durationSeconds = Number.isNaN(startedMs)
        ? 0
        : Math.max(0, Math.round((Date.now() - startedMs) / 1000));

      await conn.query(
        `UPDATE stream_sessions
         SET status = 'ended', ended_at = UTC_TIMESTAMP(), duration_seconds = ?
         WHERE id = ?`,
        [durationSeconds, session.id]
      );

      if (session.license_id) {
        const [licRows] = await conn.query<LicenseSingleUseRow[]>(
          `SELECT single_use FROM stream_licenses WHERE id = ? LIMIT 1`,
          [session.license_id]
        );
        if (licRows[0]?.single_use === 1) {
          await conn.query(
            `UPDATE stream_licenses SET status = 'revoked' WHERE id = ?`,
            [session.license_id]
          );
        }
      }
    }

    await conn.commit();

    return NextResponse.json(
      {
        ok: true,
        streamKey,
        sessionId: session?.id ?? null,
        durationSeconds,
      },
      { status: 200 }
    );
  } catch (err) {
    await conn.rollback();
    console.error("Erro no on-publish-done MariaDB:", err);
    return NextResponse.json(
      { ok: false, error: "Falha interna ao encerrar sessao" },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}





