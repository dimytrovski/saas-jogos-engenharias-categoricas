import { NextRequest, NextResponse } from "next/server";
import { executeWithRetry as runDbQuery, parseDbError } from "@/lib/db-query";

export const dynamic = "force-dynamic";

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS engineering_deque_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_code VARCHAR(32) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  charge_pct INT NOT NULL DEFAULT 0,
  delivery_mode VARCHAR(32) NOT NULL DEFAULT 'hibrido',
  mission_title VARCHAR(160) NOT NULL,
  challenge_title VARCHAR(160) NOT NULL,
  legacy_title VARCHAR(160) NOT NULL,
  raw_payload TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export async function GET() {
  try {
    await runDbQuery(CREATE_TABLE_SQL);
    const rows = await runDbQuery(
      "SELECT id, module_code, event_type, charge_pct, delivery_mode, mission_title, challenge_title, legacy_title, raw_payload, created_at FROM engineering_deque_progress ORDER BY id DESC LIMIT 25"
    );
    return NextResponse.json({
      persisted: true,
      storage: "mariadb",
      records: Array.isArray(rows) ? rows : []
    });
  } catch (err) {
    const parsed = typeof parseDbError === "function" ? parseDbError(err) : err;
    const message =
      parsed instanceof Error
        ? parsed.message
        : typeof parsed === "string"
          ? parsed
          : err instanceof Error
            ? err.message
            : "Erro ao consultar MariaDB";
    return NextResponse.json(
      {
        persisted: false,
        storage: "memory_fallback",
        warning: message,
        records: []
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const moduleCode = String(body.moduleCode || "ENG-101").slice(0, 32);
    const eventType = String(body.eventType || "trunk_charge").slice(0, 64);
    const chargePct = Math.max(0, Math.min(100, Number(body.chargePct) || 0));
    const deliveryMode = String(body.deliveryMode || "hibrido").slice(0, 32);
    const missionTitle = String(
      body.missionTitle || "Energizar Barramento Trifasico via Tromba"
    ).slice(0, 160);
    const challengeTitle = String(
      body.challengeTitle || "Manter Estabilidade 60 Hz com Carga Dinamica"
    ).slice(0, 160);
    const legacyTitle = String(
      body.legacyTitle || "Arquiteto de Sistemas Trifasicos em Producao"
    ).slice(0, 160);
    const rawPayload = JSON.stringify(body.rawPayload ?? body).slice(0, 4000);

    await runDbQuery(CREATE_TABLE_SQL);
    const result = await runDbQuery(
      `INSERT INTO engineering_deque_progress
        (module_code, event_type, charge_pct, delivery_mode, mission_title, challenge_title, legacy_title, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        moduleCode,
        eventType,
        chargePct,
        deliveryMode,
        missionTitle,
        challengeTitle,
        legacyTitle,
        rawPayload
      ]
    );

    return NextResponse.json({
      ok: true,
      persisted: true,
      storage: "mariadb",
      insertId: (result as { insertId?: number })?.insertId ?? null
    });
  } catch (err) {
    const parsed = typeof parseDbError === "function" ? parseDbError(err) : err;
    const message =
      parsed instanceof Error
        ? parsed.message
        : typeof parsed === "string"
          ? parsed
          : err instanceof Error
            ? err.message
            : "Erro ao gravar no MariaDB";
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        storage: "memory_fallback",
        error: message
      },
      { status: 200 }
    );
  }
}
