import { NextRequest, NextResponse } from "next/server";
import { getDigestPool } from "@/lib/digest-db";
import {
  buildProgressEmailPayload,
  DigestPlayerRecord,
  isValidEmail,
  normalizeFrequency,
  normalizeHour,
  normalizeScore,
  toLocalSqlDateTime
} from "@/lib/progress-digest";

export async function GET(req: NextRequest) {
  try {
    const playerId = req.nextUrl.searchParams.get("playerId")?.trim() || null;
    const pool = await getDigestPool();

    const sql = playerId
      ? "SELECT * FROM player_digest_schedules WHERE player_id = ? ORDER BY id DESC LIMIT 100"
      : "SELECT * FROM player_digest_schedules ORDER BY id DESC LIMIT 100";
    const params = playerId ? [playerId] : [];
    const [rows] = await pool.query(sql, params);
    const list = Array.isArray(rows) ? rows : [];

    return NextResponse.json({ ok: true, source: "mariadb", total: list.length, schedules: list });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar agendamentos";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const playerId = String(body.playerId || "").trim();
    const playerName = String(body.playerName || "").trim();
    const playerEmail = String(body.playerEmail || "").trim();

    if (!playerId) {
      return NextResponse.json({ ok: false, error: "playerId e obrigatorio." }, { status: 400 });
    }
    if (!playerName) {
      return NextResponse.json({ ok: false, error: "playerName e obrigatorio." }, { status: 400 });
    }
    if (!isValidEmail(playerEmail)) {
      return NextResponse.json({ ok: false, error: "Informe um playerEmail valido." }, { status: 400 });
    }

    const preferredHour = normalizeHour(body.preferredHour, 20);
    const frequencyMode = normalizeFrequency(body.frequencyMode, "weekly");
    const sqlScheduledFor = toLocalSqlDateTime(String(body.scheduledFor || new Date().toISOString()), preferredHour);

    const record: DigestPlayerRecord = {
      playerId,
      playerName,
      playerEmail,
      identityRole: String(body.identityRole || "Jogador / Criador").trim(),
      identityBio: String(
        body.identityBio || "Perfil focado em evolucao continua, transmissao ao vivo e descoberta de talentos."
      ).trim(),
      brandLogoUrl: String(body.brandLogoUrl || "/logo.png").trim(),
      brandName: String(body.brandName || "SaaS Talentos & Stream").trim(),
      timezone: String(body.timezone || "America/Belem").trim(),
      scheduledFor: sqlScheduledFor,
      frequencyMode,
      preferredHour,
      focusGoal: String(body.focusGoal || "Consistencia e visibilidade").trim(),
      progressScore: normalizeScore(body.progressScore, 70),
      progressSummary: String(
        body.progressSummary || "Progresso atualizado da conta com historico de sessoes e licencas ativas."
      ).trim(),
      sendByDefault: body.sendByDefault !== false
    };

    const pool = await getDigestPool();
    const [result] = await pool.query(
      `INSERT INTO player_digest_schedules (
        player_id, player_name, player_email, identity_role, identity_bio,
        brand_logo_url, brand_name, timezone, scheduled_for, frequency_mode,
        preferred_hour, focus_goal, progress_score, progress_summary, send_by_default, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        record.playerId,
        record.playerName,
        record.playerEmail,
        record.identityRole,
        record.identityBio,
        record.brandLogoUrl,
        record.brandName,
        record.timezone,
        record.scheduledFor,
        record.frequencyMode,
        record.preferredHour,
        record.focusGoal,
        record.progressScore,
        record.progressSummary,
        record.sendByDefault ? 1 : 0
      ]
    );

    const insertId = Number((result as { insertId?: number }).insertId || 0);
    const stored = { ...record, id: insertId, status: "pending" as const };
    const origin = req.nextUrl.origin || "http://localhost:3000";
    const acceptUrl = `${origin}/api/progress-digest/adapt?scheduleId=${insertId}&playerId=${encodeURIComponent(record.playerId)}`;
    const emailPayload = buildProgressEmailPayload(stored, acceptUrl);

    return NextResponse.json({
      ok: true,
      source: "mariadb",
      schedule: stored,
      emailPreview: emailPayload
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao salvar agendamento";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
