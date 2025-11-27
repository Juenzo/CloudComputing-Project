# cloud/run_tests.ps1
Write-Host "--- DÉMARRAGE DES TESTS AUTOMATISÉS ---" -ForegroundColor Cyan

# 1. TESTS BACKEND
Write-Host "`n[1/2] Lancement des tests Backend..." -ForegroundColor Yellow
$BackendPath = Join-Path $PSScriptRoot "backend"

Push-Location $BackendPath
try {
    # Installation des dépendances de test si manquantes
    # pip install pytest httpx  <-- Décommente si besoin
    
    # Lancement de pytest
    # On ajoute le dossier courant au PYTHONPATH pour que les imports fonctionnent
    $env:PYTHONPATH = $BackendPath
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

# 2. TESTS FRONTEND
Write-Host "`n[2/2] Lancement des tests Frontend..." -ForegroundColor Yellow
$FrontendPath = Join-Path $PSScriptRoot "frontend"

Push-Location $FrontendPath
try {
    # On lance les tests en mode non-interactif (CI=true évite le mode 'watch')
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