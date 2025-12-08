Write-Host "--- DÉMARRAGE DES TESTS AUTOMATISÉS ---" -ForegroundColor Cyan

# TESTS BACKEND
Write-Host "`n[1/2] Lancement des tests Backend..." -ForegroundColor Yellow
$BackendPath = Join-Path $PSScriptRoot "backend"

Push-Location $BackendPath
try {
    $env:PYTHONPATH = $BackendPath
    $env:sql_server_fqdn = "localhost"
    $env:sql_database_name = "test_db"
    $env:DB_USER = "fake_user"
    $env:DB_PASSWORD = "fake_password"
    python -m pytest tests/ -v
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ÉCHEC des tests Backend !"
        exit 1
    }
    Write-Host "Tests Backend : SUCCÈS" -ForegroundColor Green
}
finally {
    Pop-Location
}

# TESTS FRONTEND
Write-Host "`n[2/2] Lancement des tests Frontend..." -ForegroundColor Yellow
$FrontendPath = Join-Path $PSScriptRoot "frontend"

Push-Location $FrontendPath
try {
    $env:CI = "true"
    npm test
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ÉCHEC des tests Frontend !"
        exit 1
    }
    Write-Host "Tests Frontend : SUCCÈS" -ForegroundColor Green
}
finally {
    Pop-Location
}

Write-Host "`n--- TOUS LES TESTS SONT PASSÉS ! BRAVO ! ---" -ForegroundColor Cyan