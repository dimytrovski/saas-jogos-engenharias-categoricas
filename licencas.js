const pool = require("./db");
const crypto = require("crypto");

async function criarLicencaPendente({ streamId, buyerEmail, targetDevice = "any", amountCents = 999, currency = "USD" }) {
  if (!streamId || !buyerEmail) {
    throw new Error("streamId e buyerEmail são obrigatórios.");
  }

  const [result] = await pool.execute(
    `INSERT INTO stream_licenses
      (stream_id, buyer_email, target_device, amount_cents, currency, license_status, access_token)
     VALUES (?, ?, ?, ?, ?, "pending", NULL)`,
    [streamId, buyerEmail, targetDevice, amountCents, currency]
  );

  return {
    id: result.insertId,
    stream_id: streamId,
    buyer_email: buyerEmail,
    target_device: targetDevice,
    amount_cents: amountCents,
    currency,
    license_status: "pending",
    access_token: null
  };
}

async function ativarLicencaAposPagamento(licenseId) {
  if (!licenseId) {
    throw new Error("licenseId é obrigatório.");
  }

  const token = crypto.randomBytes(16).toString("hex");
  const [upd] = await pool.execute(
    `UPDATE stream_licenses
     SET license_status = "active", access_token = ?
     WHERE id = ? AND license_status = "pending"`,
    [token, licenseId]
  );

  if (upd.affectedRows === 0) {
    throw new Error("Licença pendente não encontrada ou já ativada.");
  }

  const [rows] = await pool.execute(
    `SELECT id, stream_id, buyer_email, target_device, amount_cents, currency, license_status, access_token
     FROM stream_licenses WHERE id = ?`,
    [licenseId]
  );

  return rows[0];
}

async function validarAcessoDispositivo(streamId, accessToken) {
  if (!streamId || !accessToken) {
    return { allowed: false, reason: "streamId e accessToken são obrigatórios." };
  }

  const [rows] = await pool.execute(
    `SELECT
       l.id AS license_id,
       l.stream_id,
       l.buyer_email,
       l.target_device,
       l.license_status,
       s.streamer_handle,
       s.match_title,
       s.stream_url,
       s.status AS stream_status
     FROM stream_licenses l
     INNER JOIN streams s ON s.id = l.stream_id
     WHERE l.stream_id = ?
       AND l.access_token = ?
       AND l.license_status = "active"
     LIMIT 1`,
    [streamId, accessToken]
  );

  if (rows.length === 0) {
    return { allowed: false, reason: "Licença inválida, pendente, revogada ou token incorreto." };
  }

  return { allowed: true, data: rows[0] };
}

module.exports = {
  criarLicencaPendente,
  ativarLicencaAposPagamento,
  validarAcessoDispositivo
};
