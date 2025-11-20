# deploy.ps1

Write-Host "--- DÉMARRAGE DU DÉPLOIEMENT (Architecture Séparée) ---" -ForegroundColor Cyan

# 1. CONFIGURATION DES CHEMINS
# On utilise $PSScriptRoot pour être sûr qu'on part du dossier où se trouve le script
$RootFolder = $PSScriptRoot
$InfraFolder = Join-Path $RootFolder "infra"
$BackendFolder = Join-Path $RootFolder "backend"
$ReqFile = Join-Path $RootFolder "requirements.txt"
$ZipFile = Join-Path $RootFolder "deploy_package.zip"

# 2. VÉRIFICATIONS PRÉLIMINAIRES
# On vérifie si le dossier infra existe vraiment
if (-not (Test-Path $InfraFolder)) {
    Write-Error "ERREUR CRITIQUE : Le dossier 'infra' est introuvable ici : $InfraFolder"
    exit
}

# On vérifie la connexion Azure
try {
    az account show > $null
} catch {
    Write-Error "Vous n'êtes pas connecté. Lancez 'az login' d'abord."
    exit
}

# 3. RÉCUPÉRATION DES INFOS TERRAFORM
Write-Host "Lecture de la configuration Terraform..." -ForegroundColor Yellow

# METHODE SÛRE : On entre dans le dossier, on récupère l'info, on ressort.
Push-Location $InfraFolder 
try {
    # Le -raw est important pour ne pas avoir de guillemets
    $AppName = (terraform output -raw api_name).Trim()
    $RgName  = (terraform output -raw resource_group_name).Trim()
    $ApiUrl  = (terraform output -raw api_url).Trim()
} catch {
    Pop-Location # On ressort même en cas d'erreur
    Write-Error "Erreur : Impossible de lire les outputs. Avez-vous fait 'terraform apply' dans le dossier infra ?"
    exit
}
Pop-Location # On revient à la racine du projet

# Vérification que les variables ne sont pas vides
if ([string]::IsNullOrWhiteSpace($AppName)) {
    Write-Error "Erreur : Le nom de l'App est vide. Vérifiez vos outputs Terraform."
    exit
}

Write-Host "Cible détectée : $AppName (Groupe: $RgName)" -ForegroundColor Green

# 4. CRÉATION DU ZIP
if (Test-Path $ZipFile) { Remove-Item $ZipFile }

Write-Host "Création de l'archive ZIP..." -ForegroundColor Yellow

if (-not (Test-Path $BackendFolder) -or -not (Test-Path $ReqFile)) {
    Write-Error "Erreur : Dossier 'backend' ou 'requirements.txt' manquant."
    exit
}

# On compresse les éléments
Compress-Archive -Path $BackendFolder, $ReqFile -DestinationPath $ZipFile -Force

# 5. DÉPLOIEMENT AZURE
Write-Host "Envoi du code vers Azure (Patience...)..." -ForegroundColor Yellow
az webapp deployment source config-zip --resource-group $RgName --name $AppName --src $ZipFile

# 6. NETTOYAGE
Remove-Item $ZipFile

Write-Host "--- DÉPLOIEMENT TERMINÉ ! ---" -ForegroundColor Cyan
Write-Host "L'API va redémarrer."
Write-Host "Lien pour tester : $ApiUrl/docs"