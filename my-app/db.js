require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "usuario_saas",
  password: process.env.DB_PASSWORD || "!Dimy2002",
  database: process.env.DB_NAME || "meu_saas",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
