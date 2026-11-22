import { getPool, getDbConfig } from "./db";

export interface DbErrorInfo {
  message: string;
  code?: string;
  address?: string;
  port?: number;
  syscall?: string;
  isConnectionRefused: boolean;
}

export function parseDbError(err: any): DbErrorInfo {
  const cfg = getDbConfig();
  const code = err?.code;
  const address = err?.address || cfg.host;
  const port = Number(err?.port || cfg.port);
  const syscall = err?.syscall;
  const isConnectionRefused = code === "ECONNREFUSED";

  const message = isConnectionRefused
    ? `connect ECONNREFUSED ${address}:${port} (MariaDB recusou conexao no host/porta configurados)`
    : err?.message || "Erro ao executar consulta no banco de dados.";

  return { message, code, address, port, syscall, isConnectionRefused };
}

export async function executeWithRetry<T = any>(
  sql: string,
  params: any[] = [],
  retries = 2,
  delayMs = 300
): Promise<T> {
  const pool = getPool();
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows as T;
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.code === "ECONNREFUSED" ||
        err?.code === "ECONNRESET" ||
        err?.code === "ETIMEDOUT" ||
        err?.code === "PROTOCOL_CONNECTION_LOST";

      if (!isTransient || attempt === retries) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}
