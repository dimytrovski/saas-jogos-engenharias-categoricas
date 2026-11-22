param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Provider = "mercadopago",
    [string]$EventId = ("evt_mp_" + [guid]::NewGuid().ToString("N").Substring(0, 12)),
    [int]$OrganizationId = 1,
    [string]$PassCode = "PASS_MWSDDKIH"
)

$ErrorActionPreference = "Stop"
$secret = if ($env:WEBHOOK_SIGNING_SECRET) { $env:WEBHOOK_SIGNING_SECRET } else { "dev_local_webhook_secret" }

$bodyObj = @{
    id             = $EventId
    provider       = $Provider
    type           = "payment.approved"
    status         = "approved"
    organizationId = $OrganizationId
    passCode       = $PassCode
}

$rawJson = $bodyObj | ConvertTo-Json -Compress
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
$sigBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($rawJson))
$sigHex = ([System.BitConverter]::ToString($sigBytes) -replace "-", "").ToLower()

$res = Invoke-RestMethod -Uri "$BaseUrl/api/scale/webhooks/gateway" `
    -Method Post `
    -ContentType "application/json" `
    -Headers @{
        "x-webhook-signature" = "sha256=$sigHex"
        "x-payment-provider"  = $Provider
    } `
    -Body $rawJson

$res | ConvertTo-Json -Depth 4
