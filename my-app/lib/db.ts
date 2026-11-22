import mysql from "mysql2/promise";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

let pool: mysql.Pool | null = null;

export function getDbConfig(): DbConfig {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || "app_saas",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "saas_db",
  };
}

export function getPool(): mysql.Pool {
  if (!pool) {
    const cfg = getDbConfig();
    pool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 6000,
    });
  }
  return pool;
}

export async function getDbPool() {
  if (typeof getPool === "function") {
    return await getPool();
  }
  const { getDigestPool } = await import("./digest-db");
  return await getDigestPool();
}

export default getDbConfig;

