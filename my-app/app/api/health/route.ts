import { NextResponse } from "next/server";
import { getDigestPool } from "@/lib/digest-db";

export async function GET() {
  try {
    const pool = await getDigestPool();
    await pool.query("SELECT 1");

    return NextResponse.json({
      ok: true,
      service: "live-monetization-saas",
      db: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database health check failed";
    return NextResponse.json(
      {
        ok: false,
        service: "live-monetization-saas",
        db: "unreachable",
        error: msg,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
