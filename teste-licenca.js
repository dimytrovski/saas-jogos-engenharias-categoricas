const pool = require("./db");
const crypto = require("crypto");

async function rodar() {
  const [users] = await pool.execute("SELECT id FROM users LIMIT 1;");
  if (users.length === 0) {
    console.log("Nenhum usuário encontrado na tabela users. Crie um usuário primeiro.");
    process.exit(1);
  }

  const userId = users[0].id;

  const [streamRes] = await pool.execute(
    `INSERT INTO streams (user_id, streamer_handle, match_title, stream_url, rights_holder_confirmed, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, "@pro_gamer_test", "Final Ranked Match #01", "https://example.com/live/stream.m3u8", true, "live"]
  );

  const streamId = streamRes.insertId;
  const token = crypto.randomBytes(16).toString("hex");

  const [licRes] = await pool.execute(
    `INSERT INTO stream_licenses (stream_id, buyer_email, target_device, amount_cents, currency, license_status, access_token)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [streamId, "parceiro@exemplo.com", "Smart TV / Browser", 999, "USD", "active", token]
  );

  console.log("Stream criada ID:", streamId);
  console.log("Licença criada ID:", licRes.insertId, "| Token:", token);
  await pool.end();
}

rodar().catch(console.error);
