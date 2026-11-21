import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.STREAM_SIGNING_SECRET || "dev-secret-change-in-production";
const HLS_BASE_URL = process.env.NEXT_PUBLIC_HLS_BASE_URL || "https://localhost/hls";

function signPayload(payloadB64: string): string {
  return crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const streamKey = typeof body.streamKey === "string" && body.streamKey.trim()
      ? body.streamKey.trim().replace(/[^a-zA-Z0-9_-]/g, "")
      : "teste";

    const exp = Date.now() + 5 * 60 * 1000; // válido por 5 minutos
    const payload = { streamKey, exp };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = signPayload(payloadB64);
    const token = `${payloadB64}.${sig}`;

    return NextResponse.json({
      token,
      expiresAt: exp,
      manifestUrl: `${HLS_BASE_URL}/${streamKey}.m3u8`,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao gerar token de acesso." }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const parts = token.split(".");
  if (parts.length !== 2) {
    return NextResponse.json({ valid: false, reason: "Token malformado." }, { status: 401 });
  }

  const [payloadB64, sig] = parts;
  const expectedSig = signPayload(payloadB64);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ valid: false, reason: "Assinatura inválida." }, { status: 401 });
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      streamKey?: string;
      exp?: number;
    };

    if (!parsed.exp || Date.now() > parsed.exp) {
      return NextResponse.json({ valid: false, reason: "Token expirado." }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      streamKey: parsed.streamKey || "teste",
      expiresAt: parsed.exp,
    });
  } catch {
    return NextResponse.json({ valid: false, reason: "Payload inválido." }, { status: 401 });
  }
}
