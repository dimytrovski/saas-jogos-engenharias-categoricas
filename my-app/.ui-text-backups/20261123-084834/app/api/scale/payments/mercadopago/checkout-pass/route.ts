import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "@/lib/digest-db";
import { recordAuditLog } from "@/lib/scale-governance";

interface ColumnRow extends RowDataPacket {
  Field: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const title = String(body?.title || "Passe PPV Transmissao ao Vivo").trim();
    const amount = Number(body?.amount ?? 29.9);
    const currencyId = String(body?.currencyId || "BRL").trim();
    const organizationId =
      typeof body?.organizationId === "number" && body.organizationId > 0
        ? body.organizationId
        : 1;
    const durationMinutes =
      typeof body?.durationMinutes === "number" && body.durationMinutes > 0
        ? Math.min(Math.floor(body.durationMinutes), 10080)
        : 180;
    const payerEmail = body?.payerEmail ? String(body.payerEmail).trim() : null;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Valor ('amount') deve ser maior que zero." },
        { status: 400 }
      );
    }

    const passCode = `PASS_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const now = new Date();
    const validUntil = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const pool = await getDigestPool();
    const [columns] = await pool.query<ColumnRow[]>(`SHOW COLUMNS FROM live_access_passes`);
    const colNames = new Set(columns.map((c) => c.Field));

    const insertCols: string[] = [];
    const insertVals: unknown[] = [];

    if (colNames.has("organization_id")) {
      insertCols.push("organization_id");
      insertVals.push(organizationId);
    }
    if (colNames.has("pass_code")) {
      insertCols.push("pass_code");
      insertVals.push(passCode);
    } else if (colNames.has("code")) {
      insertCols.push("code");
      insertVals.push(passCode);
    }
    if (colNames.has("status")) {
      insertCols.push("status");
      insertVals.push("pending");
    }
    if (colNames.has("valid_from")) {
      insertCols.push("valid_from");
      insertVals.push(now);
    }
    if (colNames.has("valid_until")) {
      insertCols.push("valid_until");
      insertVals.push(validUntil);
    } else if (colNames.has("expires_at")) {
      insertCols.push("expires_at");
      insertVals.push(validUntil);
    }
    if (colNames.has("amount")) {
      insertCols.push("amount");
      insertVals.push(amount);
    }
    if (colNames.has("price")) {
      insertCols.push("price");
      insertVals.push(amount);
    }
    if (colNames.has("title")) {
      insertCols.push("title");
      insertVals.push(title);
    }

    if (insertCols.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Tabela live_access_passes sem colunas compativeis mapeadas." },
        { status: 500 }
      );
    }

    const placeholders = insertCols.map(() => "?").join(", ");
    await pool.query<ResultSetHeader>(
      `INSERT INTO live_access_passes (${insertCols.join(", ")}) VALUES (${placeholders})`,
      insertVals
    );

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const prefId = `pref_mp_${crypto.randomBytes(6).toString("hex")}`;

    await recordAuditLog({
      organizationId,
      action: "mercadopago_pass_checkout_created",
      entityType: "live_access_pass",
      entityId: passCode,
      metadata: {
        preferenceId: prefId,
        amount,
        currencyId,
        durationMinutes,
        payerEmail,
        mode: accessToken ? "live_api_ready" : "simulated"
      }
    });

    return NextResponse.json({
      ok: true,
      provider: "mercadopago",
      mode: accessToken ? "live_api_ready" : "simulated",
      preferenceId: prefId,
      passCode,
      passStatus: "pending",
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      checkoutUrl: `/demonstracao?pref=${encodeURIComponent(prefId)}&passCode=${encodeURIComponent(passCode)}`,
      webhookHint: {
        endpoint: "/api/scale/webhooks/gateway",
        eventType: "payment.approved",
        organizationId,
        passCode
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao iniciar checkout de passe.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
