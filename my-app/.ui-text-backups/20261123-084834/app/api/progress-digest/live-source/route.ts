import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";

interface TableNameRow extends RowDataPacket {
  TABLE_NAME: string;
}

interface ColumnInfoRow extends RowDataPacket {
  COLUMN_NAME: string;
}

interface GenericRow extends RowDataPacket {
  [key: string]: unknown;
}

const SENSITIVE_COLUMNS = new Set([
  "password_hash",
  "password",
  "senha",
  "token",
  "secret",
  "api_key",
  "salt"
]);

function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!SENSITIVE_COLUMNS.has(k.toLowerCase())) {
      clean[k] = v;
    }
  }
  return clean;
}

function pickField(row: Record<string, unknown>, candidates: string[], fallback = ""): string {
  for (const key of candidates) {
    const exact = row[key];
    if (exact !== undefined && exact !== null && String(exact).trim() !== "") {
      return String(exact).trim();
    }
    const lowerKey = Object.keys(row).find((k) => k.toLowerCase() === key.toLowerCase());
    if (lowerKey && row[lowerKey] !== undefined && row[lowerKey] !== null && String(row[lowerKey]).trim() !== "") {
      return String(row[lowerKey]).trim();
    }
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  try {
    const requestedTable = req.nextUrl.searchParams.get("table")?.trim() || "";
    const requestedPlayerId = req.nextUrl.searchParams.get("playerId")?.trim() || "";

    const pool = await getDigestPool();
    const [dbNameRows] = await pool.query<GenericRow[]>("SELECT DATABASE() AS current_db");
    const currentDb = String(dbNameRows?.[0]?.current_db || "meu_saas");

    const [tableRows] = await pool.query<TableNameRow[]>(
      `SELECT TABLE_NAME
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
       ORDER BY TABLE_NAME ASC`
    );
    const availableTables = tableRows.map((r) => String(r.TABLE_NAME));

    let streamsCount = 0;
    let licensesCount = 0;
    if (availableTables.includes("streams")) {
      const [sRows] = await pool.query<GenericRow[]>("SELECT COUNT(*) AS total FROM `streams`");
      streamsCount = Number(sRows?.[0]?.total || 0);
    }
    if (availableTables.includes("stream_licenses")) {
      const [lRows] = await pool.query<GenericRow[]>("SELECT COUNT(*) AS total FROM `stream_licenses`");
      licensesCount = Number(lRows?.[0]?.total || 0);
    }

    const priorityTables = [
      requestedTable,
      "users",
      "players",
      "jogadores",
      "usuarios",
      "streams",
      "stream_licenses",
      "player_digest_schedules"
    ].filter((t) => t && availableTables.includes(t));

    const chosenTable = priorityTables[0] || availableTables[0] || "";
    if (!chosenTable) {
      return NextResponse.json({
        ok: true,
        database: currentDb,
        tables: [],
        records: [],
        metrics: { streamsCount, licensesCount }
      });
    }

    const [colRows] = await pool.query<ColumnInfoRow[]>(
      `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION ASC`,
      [chosenTable]
    );
    const columns = colRows
      .map((c) => String(c.COLUMN_NAME))
      .filter((c) => !SENSITIVE_COLUMNS.has(c.toLowerCase()));

    let querySql = `SELECT * FROM \`${chosenTable}\` ORDER BY 1 DESC LIMIT 25`;
    const queryParams: unknown[] = [];

    if (requestedPlayerId) {
      const idCol = columns.find((c) => ["player_id", "playerid", "user_id", "userid", "id"].includes(c.toLowerCase()));
      if (idCol) {
        querySql = `SELECT * FROM \`${chosenTable}\` WHERE \`${idCol}\` LIKE ? ORDER BY 1 DESC LIMIT 25`;
        queryParams.push(`%${requestedPlayerId}%`);
      }
    }

    const [dataRows] = await pool.query<GenericRow[]>(querySql, queryParams);

    const mappedProfiles = dataRows.map((row, idx) => {
      const safeRaw = sanitizeRow(row as Record<string, unknown>);
      const idVal = pickField(safeRaw, ["player_id", "playerId", "user_id", "userId", "id", "codigo"], `${idx + 1}`);
      const emailVal = pickField(safeRaw, ["player_email", "playerEmail", "email", "mail"], "streamer@exemplo.com");
      const defaultName = emailVal.includes("@") ? emailVal.split("@")[0] : `Jogador ${idVal}`;
      const nameVal = pickField(safeRaw, ["player_name", "playerName", "name", "nome", "username", "apelido"], defaultName);
      const planStatus = pickField(safeRaw, ["plan_status", "identity_role", "role", "status"], "active");
      const roleVal = `Criador / Plano ${planStatus}`;

      const computedScore = Math.min(
        100,
        Math.max(25, 50 + (planStatus.toLowerCase() === "active" ? 15 : 0) + streamsCount * 5 + licensesCount * 5)
      );

      const summaryVal =
        `Conta ${emailVal} (${planStatus}) na base ${currentDb}.${chosenTable} | Streams: ${streamsCount} | Licencas: ${licensesCount}.`;

      return {
        raw: safeRaw,
        profile: {
          playerId: idVal,
          playerName: nameVal,
          playerEmail: emailVal,
          identityRole: roleVal,
          identityBio: `Perfil ativo em ${currentDb} com foco em transmissao, licenciamento e evolucao continua.`,
          progressScore: computedScore,
          progressSummary: summaryVal
        }
      };
    });

    return NextResponse.json({
      ok: true,
      database: currentDb,
      table: chosenTable,
      tables: availableTables,
      columns,
      metrics: { streamsCount, licensesCount },
      total: mappedProfiles.length,
      records: mappedProfiles
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar dados reais do HeidiSQL";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
