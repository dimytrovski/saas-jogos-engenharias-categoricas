import { NextRequest, NextResponse } from "next/server";
import { executeWithRetry as runDbQuery, parseDbError } from "@/lib/db-query";

export const dynamic = "force-dynamic";

const CREATE_CONTEST_SQL = `
CREATE TABLE IF NOT EXISTS contest_awards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contest_code VARCHAR(32) NOT NULL,
  module_code VARCHAR(32) NOT NULL,
  artist_name VARCHAR(120) NOT NULL,
  score_total DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  prize_amount_brl DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  license_scope VARCHAR(64) NOT NULL DEFAULT 'platform_resale_hybrid',
  payout_status VARCHAR(24) NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export async function GET() {
  try {
    await runDbQuery(CREATE_CONTEST_SQL);
    const rows = await runDbQuery(
      "SELECT id, contest_code, module_code, artist_name, score_total, prize_amount_brl, license_scope, payout_status, created_at FROM contest_awards ORDER BY id DESC LIMIT 25"
    );
    return NextResponse.json({
      persisted: true,
      storage: "mariadb",
      awards: Array.isArray(rows) ? rows : []
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
            : "Erro ao consultar premios no MariaDB";
    return NextResponse.json(
      {
        persisted: false,
        storage: "memory_fallback",
        warning: message,
        awards: []
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const contestCode = String(body.contestCode || "CONC-01").slice(0, 32);
    const moduleCode = String(body.moduleCode || "ENG-101").slice(0, 32);
    const artistName = String(body.artistName || "Artista Convidado").slice(0, 120);
    const scoreTotal = Math.max(0, Math.min(100, Number(body.scoreTotal) || 85));
    const prizeAmountBrl = Math.max(0, Number(body.prizeAmountBrl) || 450);
    const licenseScope = String(body.licenseScope || "platform_resale_hybrid").slice(0, 64);
    const payoutStatus = ["pending_review", "approved", "paid"].includes(String(body.payoutStatus))
      ? String(body.payoutStatus)
      : "approved";

    await runDbQuery(CREATE_CONTEST_SQL);
    const result = await runDbQuery(
      `INSERT INTO contest_awards
        (contest_code, module_code, artist_name, score_total, prize_amount_brl, license_scope, payout_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        contestCode,
        moduleCode,
        artistName,
        scoreTotal,
        prizeAmountBrl,
        licenseScope,
        payoutStatus
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
            : "Erro ao registrar premio no MariaDB";
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
