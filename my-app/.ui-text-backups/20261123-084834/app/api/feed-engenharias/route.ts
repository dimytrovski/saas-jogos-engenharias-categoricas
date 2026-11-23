import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { executeWithRetry, parseDbError } from "../../../lib/db-query";

export const dynamic = "force-dynamic";

export async function GET() {
  let feedData: any = null;

  try {
    const jsonPath = path.join(process.cwd(), "feed_multi_engenharias.json");
    const raw = await fs.readFile(jsonPath, "utf8");
    const cleanRaw = raw.replace(/^\uFEFF/, "");
    feedData = JSON.parse(cleanRaw);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Falha ao ler feed_multi_engenharias.json",
        detalhe: err?.code || err?.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }

  try {
    const talentos = await executeWithRetry<any[]>(
      "SELECT id, nome, especialidade, senioridade, disponivel FROM talentos_engenharia ORDER BY id DESC",
      [],
      1,
      200
    );
    const demandas = await executeWithRetry<any[]>(
      "SELECT id, titulo, disciplina, status_rota, talento_id FROM demandas_roteamento ORDER BY id DESC",
      [],
      1,
      200
    );

    const payload = Array.isArray(feedData)
      ? { items: feedData, dbStatus: "connected", talentos, demandas }
      : { ...feedData, dbStatus: "connected", talentos, demandas };

    return NextResponse.json(payload, { status: 200 });
  } catch (dbErr: any) {
    const info = parseDbError(dbErr);
    const payload = Array.isArray(feedData)
      ? { items: feedData, dbStatus: "fallback_json", dbError: info }
      : { ...feedData, dbStatus: "fallback_json", dbError: info };

    return NextResponse.json(payload, { status: 200 });
  }
}
