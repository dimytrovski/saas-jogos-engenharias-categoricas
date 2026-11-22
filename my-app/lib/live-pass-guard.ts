import { RowDataPacket } from "mysql2/promise";
import { getDigestPool } from "./digest-db";
import { recordAuditLog } from "./scale-governance";

interface PassCheckRow extends RowDataPacket {
  id: number;
  organization_id: number;
  pass_code: string;
  starts_at: string;
  expires_at: string;
  status: "active" | "expired" | "revoked";
}

export async function validateLivePassAccess(passCode: string) {
  const normalized = passCode.trim();
  if (!normalized) {
    return { allowed: true, reason: "NO_PASS_PROVIDED" };
  }

  const pool = await getDigestPool();
  const [rows] = await pool.query<PassCheckRow[]>(
    `SELECT id, organization_id, pass_code, starts_at, expires_at, status
     FROM live_access_passes
     WHERE pass_code = ?
     LIMIT 1`,
    [normalized]
  );

  const pass = rows[0];
  if (!pass) {
    return {
      allowed: false,
      httpStatus: 404,
      code: "PASS_NOT_FOUND",
      error: "Passe de acesso ao vivo nao encontrado."
    };
  }

  const now = Date.now();
  const withinWindow =
    now >= new Date(pass.starts_at).getTime() &&
    now <= new Date(pass.expires_at).getTime();

  const allowed = pass.status === "active" && withinWindow;

  await recordAuditLog({
    organizationId: pass.organization_id,
    action: allowed ? "stream_token_pass_allowed" : "stream_token_pass_denied",
    entityType: "live_access_pass",
    entityId: pass.pass_code,
    metadata: { status: pass.status, withinWindow }
  });

  if (!allowed) {
    return {
      allowed: false,
      httpStatus: 403,
      code: "PASS_INACTIVE_OR_EXPIRED",
      error: "Passe inativo ou fora da janela temporal permitida."
    };
  }

  return {
    allowed: true,
    passCode: pass.pass_code,
    organizationId: pass.organization_id
  };
}
