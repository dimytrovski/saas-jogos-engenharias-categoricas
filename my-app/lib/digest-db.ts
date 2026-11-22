import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __progressDigestPool: mysql.Pool | undefined;
}

export async function getDigestPool(): Promise<mysql.Pool> {
  if (global.__progressDigestPool) {
    return global.__progressDigestPool;
  }

  const candidates = [
    {
      host: process.env.DB_HOST?.trim() || process.env.MYSQL_HOST?.trim() || "127.0.0.1",
      port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3307),
      user: process.env.DB_USER?.trim() || process.env.MYSQL_USER?.trim() || "root",
      password: process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? "",
      database: process.env.DB_NAME?.trim() || process.env.MYSQL_DATABASE?.trim() || "saas_gamers"
    },
    {
      host: "127.0.0.1",
      port: 3307,
      user: "root",
      password: "",
      database: "saas_gamers"
    },
    {
      host: "127.0.0.1",
      port: 3307,
      user: "usuario_saas",
      password: process.env.DB_PASSWORD || "!Dimy2002",
      database: "meu_saas"
    }
  ];

  let lastErr: unknown = null;
  for (const cfg of candidates) {
    const candidatePool = mysql.createPool({
      ...cfg,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 4000,
      dateStrings: true
    });
    try {
      const conn = await candidatePool.getConnection();
      conn.release();
      global.__progressDigestPool = candidatePool;
      return candidatePool;
    } catch (err) {
      lastErr = err;
      await candidatePool.end().catch(() => {});
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Falha ao conectar ao MariaDB na porta 3307");
}
