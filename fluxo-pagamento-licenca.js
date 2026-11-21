const pool = require("./db");
const crypto = require("crypto");

async function rodar() {
  const streamId = 1;
  const buyerEmail = "espectador.tv@exemplo.com";
  const targetDevice = "Smart TV Samsung";
  const amountCents = 1499;
  const currency = "USD";

  // 1. Cria licença pendente (sem token de acesso ativo)
  const [insertRes] = await pool.execute(
    `INSERT INTO stream_licenses
      (stream_id, buyer_email, target_device, amount_cents, currency, license_status, access_token)
     VALUES (?, ?, ?, ?, ?, "pending", NULL)`,
    [streamId, buyerEmail, targetDevice, amountCents, currency]
  );

  const licenseId = insertRes.insertId;
  console.log("1) Licença criada como PENDING -> ID:", licenseId);

  // 2. Após confirmação do pagamento, gera token e ativa a licença
  const accessToken = crypto.randomBytes(16).toString("hex");
  await pool.execute(
    `UPDATE stream_licenses
     SET license_status = "active", access_token = ?
     WHERE id = ? AND license_status = "pending"`,
    [accessToken, licenseId]
  );

  const [rows] = await pool.execute(
    `SELECT id, stream_id, buyer_email, target_device, amount_cents, currency, license_status, access_token
     FROM stream_licenses WHERE id = ?`,
    [licenseId]
  );

  console.log("2) Após pagamento confirmado:");
  console.log(rows[0]);

  await pool.end();
}

rodar().catch(console.error);
