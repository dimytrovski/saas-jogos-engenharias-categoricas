import mysql from "mysql2/promise";

declare global {
  var __mariadbPool: mysql.Pool | undefined;
}

export function getDbPool(): mysql.Pool {
  if (!globalThis.__mariadbPool) {
    globalThis.__mariadbPool = mysql.createPool({
      host: process.env.MARIADB_HOST || "127.0.0.1",
      port: Number(process.env.MARIADB_PORT || 3306),
      user: process.env.MARIADB_USER || "root",
      password: process.env.MARIADB_PASSWORD || "",
      database: process.env.MARIADB_DATABASE || "microsaas_streams",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: "Z",
    });
  }
  return globalThis.__mariadbPool;
}
