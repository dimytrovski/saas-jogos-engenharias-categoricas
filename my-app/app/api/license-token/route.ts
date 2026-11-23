import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const getPrimaryKey = () => {
  const secret =
    process.env.SYNSTROM_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "synstrom-local-dev-secret-change-in-env-2026";
  return new TextEncoder().encode(secret);
};

const getLegacyKey = () => {
  const legacy =
    process.env.LEGACY_JWT_SECRET ||
    "cerro-gradle-local-dev-secret-change-in-env-2026";
  return new TextEncoder().encode(legacy);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "issue").trim();
    const moduleCode = String(body?.moduleCode || "ENG-101").trim().toUpperCase();
    const accountRef = String(body?.accountRef || "guest-session").trim();

    if (action === "verify") {
      const token = String(body?.token || "").trim();
      if (!token) {
        return NextResponse.json({ valid: false, reason: "missing_token" }, { status: 400 });
      }

      try {
        const { payload } = await jwtVerify(token, getPrimaryKey(), {
          issuer: "synstrom-auth",
          audience: "synstrom-client"
        });
        return NextResponse.json({
          valid: true,
          moduleCode: payload.mod,
          accountRef: payload.sub,
          exp: payload.exp
        });
      } catch {
        const { payload } = await jwtVerify(token, getLegacyKey(), {
          issuer: "cerro-gradle-auth",
          audience: "cerro-gradle-client"
        });
        return NextResponse.json({
          valid: true,
          moduleCode: payload.mod,
          accountRef: payload.sub,
          exp: payload.exp,
          legacyIssuer: true
        });
      }
    }

    const token = await new SignJWT({
      mod: moduleCode,
      scope: "module_runtime",
      non_transferable: true
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(accountRef)
      .setIssuer("synstrom-auth")
      .setAudience("synstrom-client")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(getPrimaryKey());

    return NextResponse.json({
      valid: true,
      moduleCode,
      token,
      expiresInSeconds: 7200
    });
  } catch {
    return NextResponse.json({ valid: false, reason: "invalid_or_expired" }, { status: 401 });
  }
}