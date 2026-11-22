import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { enforceResourceCreation } from "@/lib/scale-enforcement";
import { validateLivePassAccess } from "@/lib/live-pass-guard";

const HLS_BASE_URL = process.env.HLS_BASE_URL || "http://localhost:8080/hls";
const STREAM_TOKEN_SECRET = process.env.STREAM_TOKEN_SECRET || "dev_stream_token_secret";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const passCode = String(
      (body as { passCode?: string; pass_code?: string } | undefined)?.passCode ||
        (body as { passCode?: string; pass_code?: string } | undefined)?.pass_code ||
        ""
    ).trim();

    if (passCode) {
      const passCheck = await validateLivePassAccess(passCode);
      if (!passCheck.allowed) {
        return NextResponse.json(
          {
            ok: false,
            allowed: false,
            code: passCheck.code || "PASS_DENIED",
            error: passCheck.error || "Acesso ao passe negado."
          },
          { status: passCheck.httpStatus || 403 }
        );
      }
    }

    const organizationId =
      typeof (body as { organizationId?: unknown })?.organizationId === "number"
        ? (body as { organizationId: number }).organizationId
        : null;
    const actorEmail = (body as { actorEmail?: unknown })?.actorEmail
      ? String((body as { actorEmail: unknown }).actorEmail).trim()
      : null;

    const scaleGuard = await enforceResourceCreation({
      organizationId,
      resourceType: "stream",
      actorEmail
    });

    if (!scaleGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          allowed: false,
          code: scaleGuard.code,
          error: scaleGuard.reason,
          capacity: "capacity" in scaleGuard ? scaleGuard.capacity : undefined
        },
        { status: scaleGuard.httpStatus || 409 }
      );
    }

    const rawStreamKey = String(
      (body as { streamKey?: string; stream_key?: string } | undefined)?.streamKey ||
        (body as { streamKey?: string; stream_key?: string } | undefined)?.stream_key ||
        "live_default"
    ).trim();
    const streamKey = rawStreamKey.replace(/[^a-zA-Z0-9_-]/g, "_") || "live_default";
    const expiresAt = Date.now() + 1000 * 60 * 60;
    const payload = `${streamKey}:${expiresAt}`;
    const signature = crypto
      .createHmac("sha256", STREAM_TOKEN_SECRET)
      .update(payload)
      .digest("hex");
    const token = Buffer.from(`${payload}:${signature}`, "utf8").toString("base64url");

    return NextResponse.json({
      ok: true,
      allowed: true,
      streamKey,
      token,
      expiresAt,
      manifestUrl: `${HLS_BASE_URL}/${streamKey}.m3u8`
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar token de acesso.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
