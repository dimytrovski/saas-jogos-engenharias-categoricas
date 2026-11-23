import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import {
  advanceSqlDateTime,
  buildProgressEmailPayload,
  DigestPlayerRecord,
  normalizeFrequency,
  normalizeHour,
  normalizeScore
} from "@/lib/progress-digest";

interface DbScheduleRow extends RowDataPacket {
  id: number;
  player_id: string;
  player_name: string;
  player_email: string;
  identity_role: string;
  identity_bio: string | null;
  brand_logo_url: string;
  brand_name: string;
  timezone: string;
  scheduled_for: string;
  frequency_mode: "once" | "weekly" | "biweekly" | "monthly";
  preferred_hour: number;
  focus_goal: string;
  progress_score: string | number;
  progress_summary: string | null;
  send_by_default: number | boolean;
  status: "pending" | "sent" | "cancelled";
}

function formatNowSql(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function sendDigestEmail(payload: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ delivered: boolean; mode: "smtp" | "simulated"; messageId?: string }> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const allowSelfSigned = String(process.env.SMTP_ALLOW_SELF_SIGNED || "false").toLowerCase() === "true";
  const from = process.env.SMTP_FROM?.trim() || user || "no-reply@saas-gamers.local";

  if (!host || !user || !pass) {
    return {
      delivered: true,
      mode: "simulated",
      messageId: `sim-${Date.now()}`
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: allowSelfSigned ? { rejectUnauthorized: false } : undefined
  });

  const info = await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });

  return {
    delivered: true,
    mode: "smtp",
    messageId: info.messageId
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const playerId = body?.playerId ? String(body.playerId).trim() : null;
    const forceAll = Boolean(body?.forceAll);

    const pool = await getDigestPool();

    const whereParts: string[] = ["status = 'pending'", "send_by_default = 1"];
    const params: unknown[] = [];

    if (!forceAll) {
      whereParts.push("scheduled_for <= ?");
      params.push(formatNowSql());
    }
    if (playerId) {
      whereParts.push("player_id = ?");
      params.push(playerId);
    }

    const sql = `SELECT * FROM player_digest_schedules WHERE ${whereParts.join(" AND ")} ORDER BY scheduled_for ASC LIMIT 50`;
    const [rows] = await pool.query<DbScheduleRow[]>(sql, params);

    const origin = req.nextUrl.origin || "http://localhost:3000";
    const results: Array<{
      id: number;
      playerId: string;
      to: string;
      deliveryMode: "smtp" | "simulated";
      messageId?: string;
      nextStatus: string;
      nextScheduledFor?: string;
    }> = [];

    for (const row of rows) {
      const freq = normalizeFrequency(row.frequency_mode, "weekly");
      const prefHour = normalizeHour(row.preferred_hour, 20);
      const record: DigestPlayerRecord = {
        id: Number(row.id),
        playerId: row.player_id,
        playerName: row.player_name,
        playerEmail: row.player_email,
        identityRole: row.identity_role,
        identityBio: row.identity_bio || "",
        brandLogoUrl: row.brand_logo_url,
        brandName: row.brand_name,
        timezone: row.timezone,
        scheduledFor: String(row.scheduled_for),
        frequencyMode: freq,
        preferredHour: prefHour,
        focusGoal: row.focus_goal,
        progressScore: normalizeScore(row.progress_score, 70),
        progressSummary: row.progress_summary || "",
        sendByDefault: Boolean(row.send_by_default)
      };

      const acceptUrl = `${origin}/api/progress-digest/adapt?scheduleId=${row.id}&playerId=${encodeURIComponent(row.player_id)}`;
      const emailPayload = buildProgressEmailPayload(record, acceptUrl);
      const delivery = await sendDigestEmail({
        to: emailPayload.to,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text
      });

      const nowSql = formatNowSql();

      if (freq === "once") {
        await pool.query(
          "UPDATE player_digest_schedules SET status = 'sent', last_sent_at = ? WHERE id = ?",
          [nowSql, row.id]
        );
        results.push({
          id: Number(row.id),
          playerId: row.player_id,
          to: row.player_email,
          deliveryMode: delivery.mode,
          messageId: delivery.messageId,
          nextStatus: "sent"
        });
      } else {
        const nextSql = advanceSqlDateTime(String(row.scheduled_for), freq, prefHour);
        await pool.query(
          "UPDATE player_digest_schedules SET last_sent_at = ?, scheduled_for = ?, status = 'pending' WHERE id = ?",
          [nowSql, nextSql, row.id]
        );
        results.push({
          id: Number(row.id),
          playerId: row.player_id,
          to: row.player_email,
          deliveryMode: delivery.mode,
          messageId: delivery.messageId,
          nextStatus: "pending",
          nextScheduledFor: nextSql
        });
      }
    }

    return NextResponse.json({
      ok: true,
      source: "mariadb",
      forceAll,
      processedCount: results.length,
      results
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao executar disparo de progress digest";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
