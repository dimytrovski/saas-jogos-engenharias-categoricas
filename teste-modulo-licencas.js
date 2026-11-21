const pool = require("./db");
const { criarLicencaPendente, ativarLicencaAposPagamento, validarAcessoDispositivo } = require("./licencas");

async function rodar() {
  const pendente = await criarLicencaPendente({
    streamId: 1,
    buyerEmail: "parceiro.modulo@exemplo.com",
    targetDevice: "any",
    amountCents: 1999,
    currency: "USD"
  });
  console.log("Pendente:", pendente);

  const ativa = await ativarLicencaAposPagamento(pendente.id);
  console.log("Ativa:", ativa);

  const acesso = await validarAcessoDispositivo(1, ativa.access_token);
  console.log("Validação:", acesso);

  await pool.end();
}

rodar().catch(console.error);
