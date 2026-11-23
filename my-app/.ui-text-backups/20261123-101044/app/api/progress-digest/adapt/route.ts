import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import {
  applyAdaptationPlan,
  DigestPlayerRecord,
  normalizeFrequency,
  normalizeHour,
  normalizeScore
} from "@/lib/progress-digest";

interface ScheduleRow extends RowDataPacket {
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
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scheduleId = Number(body.scheduleId || 0);
    const playerIdParam = body.playerId ? String(body.playerId).trim() : "";

    const pool = await getDigestPool();
    let existingRow: ScheduleRow | null = null;

    if (scheduleId > 0) {
      const [rows] = await pool.query<ScheduleRow[]>(
        "SELECT * FROM player_digest_schedules WHERE id = ? LIMIT 1",
        [scheduleId]
      );
      if (rows.length > 0) existingRow = rows[0];
    } else if (playerIdParam) {
      const [rows] = await pool.query<ScheduleRow[]>(
        "SELECT * FROM player_digest_schedules WHERE player_id = ? ORDER BY id DESC LIMIT 1",
        [playerIdParam]
      );
      if (rows.length > 0) existingRow = rows[0];
    }

    if (!existingRow) {
      return NextResponse.json(
        { ok: false, error: "Agendamento nao encontrado no banco de dados para aplicar adaptacao." },
        { status: 404 }
      );
    }

    const baseRecord: DigestPlayerRecord = {
      id: Number(existingRow.id),
      playerId: existingRow.player_id,
      playerName: existingRow.player_name,
      playerEmail: existingRow.player_email,
      identityRole: existingRow.identity_role,
      identityBio: existingRow.identity_bio || "",
      brandLogoUrl: existingRow.brand_logo_url,
      brandName: existingRow.brand_name,
      timezone: existingRow.timezone,
      scheduledFor: String(existingRow.scheduled_for),
      frequencyMode: normalizeFrequency(existingRow.frequency_mode, "weekly"),
      preferredHour: normalizeHour(existingRow.preferred_hour, 20),
      focusGoal: existingRow.focus_goal,
      progressScore: normalizeScore(existingRow.progress_score, 70),
      progressSummary: existingRow.progress_summary || "",
      sendByDefault: Boolean(existingRow.send_by_default)
    };

    const result = applyAdaptationPlan(baseRecord, {
      scheduleId: Number(existingRow.id),
      playerId: baseRecord.playerId,
      accept: body.accept !== false,
      newFrequencyMode: body.newFrequencyMode
        ? normalizeFrequency(body.newFrequencyMode, baseRecord.frequencyMode)
        : baseRecord.frequencyMode,
      newPreferredHour:
        body.newPreferredHour !== undefined
          ? normalizeHour(body.newPreferredHour, baseRecord.preferredHour)
          : baseRecord.preferredHour,
      newFocusGoal: body.newFocusGoal ? String(body.newFocusGoal).trim() : baseRecord.focusGoal
    });

    if (result.accepted && result.nextScheduledFor) {
      await pool.query(
        `INSERT INTO player_digest_adaptations (
          schedule_id, player_id, accepted, new_frequency_mode, new_preferred_hour, new_focus_goal, next_scheduled_for
        ) VALUES (?, ?, 1, ?, ?, ?, ?)`,
        [
          existingRow.id,
          baseRecord.playerId,
          result.updatedRecord.frequencyMode,
          result.updatedRecord.preferredHour,
          result.updatedRecord.focusGoal,
          result.nextScheduledFor
        ]
      );

      await pool.query(
        `UPDATE player_digest_schedules
         SET frequency_mode = ?, preferred_hour = ?, focus_goal = ?, scheduled_for = ?
         WHERE id = ?`,
        [
          result.updatedRecord.frequencyMode,
          result.updatedRecord.preferredHour,
          result.updatedRecord.focusGoal,
          result.nextScheduledFor,
          existingRow.id
        ]
      );
    }

    return NextResponse.json({
      ok: true,
      source: "mariadb",
      ...result
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao processar adaptacao";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
