import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { executeWithRetry, parseDbError } from "@/lib/db-query";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const streamId = Number(body.streamId);
    const buyerEmail = String(body.buyerEmail || "").trim();
    const targetDevice = String(body.targetDevice || "any").trim() || "any";
    const amountCents = Number(body.amountCents ?? 999);
    const currency = String(body.currency || "USD").trim() || "USD";

    if (!streamId || !buyerEmail) {
      return NextResponse.json(
        { error: "streamId e buyerEmail sao obrigatorios." },
        { status: 400 }
      );
    }

    const result: any = await executeWithRetry(
      `INSERT INTO stream_licenses
        (stream_id, buyer_email, target_device, amount_cents, currency, license_status, access_token)
       VALUES (?, ?, ?, ?, ?, "pending", NULL)`,
      [streamId, buyerEmail, targetDevice, amountCents, currency]
    );

    return NextResponse.json(
      {
        id: result.insertId,
        stream_id: streamId,
        buyer_email: buyerEmail,
        target_device: targetDevice,
        amount_cents: amountCents,
        currency,
        license_status: "pending",
        access_token: null,
      },
      { status: 201 }
    );
  } catch (err: any) {
    const info = parseDbError(err);
    console.error("POST /api/licenses erro:", info);
    return NextResponse.json(
      { error: info.message, code: info.code, address: info.address, port: info.port },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { licenseId } = await req.json();
    if (!licenseId) {
      return NextResponse.json({ error: "licenseId e obrigatorio." }, { status: 400 });
    }

    const token = crypto.randomBytes(16).toString("hex");
    const upd: any = await executeWithRetry(
      `UPDATE stream_licenses
       SET license_status = "active", access_token = ?
       WHERE id = ? AND license_status = "pending"`,
      [token, Number(licenseId)]
    );

    if (upd.affectedRows === 0) {
      return NextResponse.json(
        { error: "Licenca pendente nao encontrada ou ja ativada." },
        { status: 404 }
      );
    }

    const rows: any[] = await executeWithRetry(
      `SELECT id, stream_id, buyer_email, target_device, amount_cents, currency, license_status, access_token
       FROM stream_licenses WHERE id = ?`,
      [Number(licenseId)]
    );

    return NextResponse.json(rows[0]);
  } catch (err: any) {
    const info = parseDbError(err);
    console.error("PATCH /api/licenses erro:", info);
    return NextResponse.json({ error: info.message, code: info.code }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const streamId = Number(req.nextUrl.searchParams.get("streamId"));
    const token = req.nextUrl.searchParams.get("token");

    if (!streamId || !token) {
      return NextResponse.json(
        { allowed: false, reason: "streamId e token sao obrigatorios." },
        { status: 400 }
      );
    }

    const rows: any[] = await executeWithRetry(
      `SELECT
         l.id AS license_id,
         l.stream_id,
         l.buyer_email,
         l.target_device,
         l.license_status,
         s.streamer_handle,
         s.match_title,
         s.stream_url,
         s.status AS stream_status
       FROM stream_licenses l
       INNER JOIN streams s ON s.id = l.stream_id
       WHERE l.stream_id = ?
         AND l.access_token = ?
         AND l.license_status = "active"
       LIMIT 1`,
      [streamId, token]
    );

    if (!rows.length) {
      return NextResponse.json(
        { allowed: false, reason: "Licenca invalida, pendente ou revogada." },
        { status: 403 }
      );
    }

    return NextResponse.json({ allowed: true, data: rows[0] });
  } catch (err: any) {
    const info = parseDbError(err);
    console.error("GET /api/licenses erro:", info);
    return NextResponse.json({ allowed: false, error: info.message }, { status: 500 });
  }
}