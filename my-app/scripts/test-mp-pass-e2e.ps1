param(
    [string]$BaseUrl = "http://localhost:3000",
    [int]$OrganizationId = 1,
    [double]$Amount = 29.9,
    [string]$StreamKey = "live_arena_01"
)

$ErrorActionPreference = "Stop"
$secret = if ($env:WEBHOOK_SIGNING_SECRET) { $env:WEBHOOK_SIGNING_SECRET } else { "dev_local_webhook_secret" }

Write-Host "1) Criando passe pendente via checkout Mercado Pago..." -ForegroundColor Cyan
$cp = Invoke-RestMethod -Uri "$BaseUrl/api/scale/payments/mercadopago/checkout-pass" `
    -Method Post `
    -ContentType "application/json" `
    -Body (@{
        organizationId  = $OrganizationId
        amount          = $Amount
        durationMinutes = 180
        title           = "Passe E2E Live"
    } | ConvertTo-Json)

$passCode = $cp.passCode
Write-Host "   -> passCode gerado: $passCode | status inicial: $($cp.passStatus)" -ForegroundColor Green

Write-Host "2) Simulando aprovacao de pagamento via /api/scale/webhooks/gateway..." -ForegroundColor Cyan
$eventId = "evt_mp_e2e_" + [guid]::NewGuid().ToString("N").Substring(0, 10)
$rawJson = (@{
    id             = $eventId
    provider       = "mercadopago"
    type           = "payment.approved"
    status         = "approved"
    organizationId = $OrganizationId
    passCode       = $passCode
} | ConvertTo-Json -Compress)

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
$sigHex = ([System.BitConverter]::ToString($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($rawJson))) -replace "-", "").ToLower()

$gw = Invoke-RestMethod -Uri "$BaseUrl/api/scale/webhooks/gateway" `
    -Method Post `
    -ContentType "application/json" `
    -Headers @{ "x-webhook-signature" = "sha256=$sigHex" } `
    -Body $rawJson
Write-Host "   -> webhook ok: $($gw.ok) | activated: $($gw.activated) | eventId: $eventId" -ForegroundColor Green

Write-Host "3) Validando geracao de token de stream com o passe ativado..." -ForegroundColor Cyan
$tok = Invoke-RestMethod -Uri "$BaseUrl/api/stream-token" `
    -Method Post `
    -ContentType "application/json" `
    -Body (@{
        organizationId = $OrganizationId
        streamKey      = $StreamKey
        passCode       = $passCode
    } | ConvertTo-Json)
Write-Host "   -> token ok: $($tok.ok) | allowed: $($tok.allowed) | streamKey: $($tok.streamKey)" -ForegroundColor Green
