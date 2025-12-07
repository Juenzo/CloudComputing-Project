# =========================
# CONFIGURATION
# =========================
$StorageAccountName = "storagelearning6285"
$StorageAccountKey  = "your_key_here"  # Remplacez par votre clé d'accès au compte de stockage
$FrontendPath = "frontend"
$BuildDir = "build"
$ContainerName = "`$web" 
# =========================

# 1️⃣ Aller dans le dossier frontend, installer et builder l'application
Write-Host "Préparation et construction du Frontend..." -ForegroundColor Yellow

Push-Location $FrontendPath
try {
    Write-Host "Installation des dépendances (npm ci)..."
    npm ci 

    Write-Host "Construction du projet (npm run build)..."
    npm run build
}
finally {
    Pop-Location
}

if (-not (Test-Path -Path (Join-Path $FrontendPath $BuildDir) -PathType Container)) {
    Write-Host "❌ Erreur: Le dossier '$BuildDir' n'a pas été trouvé. Le build React a échoué." -ForegroundColor Red
    exit 1
}

# 2️⃣ Se connecter à Azure
Write-Host "Connexion à Azure..." -ForegroundColor Yellow
az account show > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    az login
}

# 3️⃣ Déployer les fichiers statiques vers le conteneur $web
Write-Host "Déploiement du Frontend vers Azure Storage..." -ForegroundColor Yellow

az storage blob upload-batch `
    --source (Join-Path $FrontendPath $BuildDir) `
    --destination $ContainerName `
    --account-name $StorageAccountName `
    --account-key $StorageAccountKey `
    --overwrite

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Déploiement du Frontend terminé !" -ForegroundColor Green
    
    $WebAppUrl = az storage account show `
        --name $StorageAccountName `
        --query "primaryEndpoints.web" `
        --output tsv
        
    Write-Host "URL du Frontend : $WebAppUrl" -ForegroundColor Green

} else {
    Write-Host "❌ Erreur lors du déploiement du Frontend." -ForegroundColor Red
}