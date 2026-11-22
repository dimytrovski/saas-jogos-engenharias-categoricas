$ErrorActionPreference = "Stop"

Write-Host "=== Verificacao de Prontidao de Producao ===" -ForegroundColor Cyan

$pwdPath = (Get-Location).Path
if ($pwdPath -match "OneDrive") {
    Write-Warning "Projeto esta dentro de pasta OneDrive ($pwdPath). Em producao/servidor, prefira caminho local dedicado (ex.: C:\apps\meu-projeto-saas)."
} else {
    Write-Host "[OK] Caminho local sem sincronizacao de nuvem pessoal: $pwdPath" -ForegroundColor Green
}

$requiredVars = @(
    "WEBHOOK_SIGNING_SECRET",
    "STREAM_TOKEN_SECRET",
    "MERCADOPAGO_ACCESS_TOKEN"
)

foreach ($varName in $requiredVars) {
    $val = [Environment]::GetEnvironmentVariable($varName)
    if ([string]::IsNullOrWhiteSpace($val)) {
        Write-Warning "Variavel $varName nao definida no ambiente atual (verifique .env / servidor)."
    } elseif ($val -match "dev_local|troque_por") {
        Write-Warning "Variavel $varName parece usar valor de desenvolvimento/exemplo."
    } else {
        Write-Host "[OK] $varName configurada." -ForegroundColor Green
    }
}

if (Test-Path ".\.env.production.example") {
    Write-Host "[OK] .env.production.example presente." -ForegroundColor Green
} else {
    Write-Warning ".env.production.example nao encontrado."
}

if (Test-Path ".\DEPLOY_CHECKLIST.md") {
    Write-Host "[OK] DEPLOY_CHECKLIST.md presente." -ForegroundColor Green
} else {
    Write-Warning "DEPLOY_CHECKLIST.md nao encontrado."
}
