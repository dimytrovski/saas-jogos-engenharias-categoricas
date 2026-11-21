const pool = require("./db");

async function validarAcesso(streamId, accessToken) {
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

async function rodar() {
  const resultado = await validarAcesso(1, "8512eec2a6100d6acb35dbc82df7265f");
  console.log("Resultado da validação (qualquer dispositivo):", resultado);
  await pool.end();
}

rodar().catch(console.error);
