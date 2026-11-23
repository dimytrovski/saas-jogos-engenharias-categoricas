import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const getSigningKey = () => {
  const rawSecret = process.env.CERRO_LICENSE_SECRET || "cerro-gradle-local-dev-secret-change-in-env-2026";
  return new TextEncoder().encode(rawSecret);
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
      const { payload } = await jwtVerify(token, getSigningKey(), {
        issuer: "cerro-gradle-auth",
        audience: "cerro-gradle-client"
      });
      return NextResponse.json({
        valid: true,
        moduleCode: payload.mod,
        accountRef: payload.sub,
        exp: payload.exp
      });
    }

    const token = await new SignJWT({
      mod: moduleCode,
      scope: "module_runtime",
      non_transferable: true
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(accountRef)
      .setIssuer("cerro-gradle-auth")
      .setAudience("cerro-gradle-client")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(getSigningKey());

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