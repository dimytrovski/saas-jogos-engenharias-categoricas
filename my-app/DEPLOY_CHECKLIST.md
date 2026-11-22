# Roteiro de Deploy em Nuvem — SaaS de Transmissões ao Vivo

## 1. Ambiente e Infraestrutura
- [ ] Hospedar a aplicação Next.js em servidor/plataforma em nuvem com HTTPS obrigatório (TLS 1.2+).
- [ ] Mover a base MariaDB para instância gerenciada ou servidor dedicado com *backups* automáticos e acesso restrito por IP/rede privada.
- [ ] Evitar manter o diretório de produção em pastas sincronizadas com nuvem pessoal (como OneDrive).

## 2. Variáveis de Ambiente em Produção
- [ ] `DATABASE_URL` / credenciais MariaDB de produção configuradas.
- [ ] `WEBHOOK_SIGNING_SECRET` definido com segredo forte e único (nunca usar o *fallback* local).
- [ ] `STREAM_TOKEN_SECRET` e `HLS_BASE_URL` apontando para o servidor de *streaming* / CDN de produção.
- [ ] Chaves e *webhook secrets* do *gateway* de pagamento (`Stripe` / `Mercado Pago`) configurados.

## 3. Base de Dados e Segurança
- [ ] Aplicar todas as migrações SQL pendentes (incluindo `022_live_revenue_and_passes.sql`).
- [ ] Confirmar que `organizations`, `live_access_passes`, `live_revenue_splits`, `webhook_deliveries` e `audit_logs` estão íntegros.
- [ ] Validar assinatura HMAC, idempotência por `eventId` e respostas `401` / `402` / `403` / `409`.

## 4. Validação Pós-Deploy
- [ ] Rodar `npm run build` e `npm run start` no ambiente de destino.
- [ ] Testar criação de passe com rateio (`/api/scale/live-passes`), validação de janela ativa, geração de token (`/api/stream-token`), sessão ao vivo (`/api/scale/live-session`) e ativação via *webhook* (`/api/scale/webhooks/gateway`).
- [ ] Monitorizar `audit_logs` e *logs* de erro durante a primeira transmissão ao vivo.
