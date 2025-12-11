# =========================
# CONFIGURATION VIA .env
# =========================
function Load-DotEnv {
    param(
        [string]$Path = ".env"
    )
    $envMap = @{}
    if (-not (Test-Path $Path)) { return $envMap }
    Get-Content -Path $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith('#')) { return }
        $idx = $line.IndexOf('=')
        if ($idx -gt 0) {
            $key = $line.Substring(0, $idx).Trim()
            $val = $line.Substring($idx + 1).Trim()
            # Remove optional quotes (double or single)
            if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
                $val = $val.Trim('"', "'")
            }
            $envMap[$key] = $val
        }
    }
    return $envMap
}

$EnvFile = ".env"
$cfg = Load-DotEnv -Path $EnvFile

$AppServiceName   = $cfg["api_name"]
$ResourceGroup    = $cfg["resource_group_name"]
$BackendPath = "backend"
$RequirementsFile = "requirements.txt"
$ZipPath = "deploy.zip"

# =========================
# 1️⃣ Créer le ZIP
# =========================
Write-Host "Création du ZIP pour déploiement..."

# Utiliser un dossier de staging pour contrôler le contenu du ZIP
$StagingDir = Join-Path $PWD "deploy_staging"
if (Test-Path $StagingDir) { Remove-Item -Recurse -Force $StagingDir }
New-Item -ItemType Directory -Path $StagingDir | Out-Null

# Copier le dossier backend (non aplati) dans le staging
Copy-Item -Path $BackendPath -Destination $StagingDir -Recurse -Force

# Copier requirements.txt et .env à la racine du staging
if (Test-Path $RequirementsFile) { Copy-Item -Path $RequirementsFile -Destination (Join-Path $StagingDir (Split-Path $RequirementsFile -Leaf)) -Force }
if (Test-Path $EnvFile) { Copy-Item -Path $EnvFile -Destination (Join-Path $StagingDir (Split-Path $EnvFile -Leaf)) -Force }

# Copier la configuration gunicorn à la racine pour que Oryx la trouve par chemin relatif
$GunicornConfSrc = Join-Path $BackendPath "gunicorn_conf.py"
if (Test-Path $GunicornConfSrc) { Copy-Item -Path $GunicornConfSrc -Destination (Join-Path $StagingDir "gunicorn_conf.py") -Force }

# Créer le ZIP depuis le staging (racine propre)
if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }
Compress-Archive -Path (Join-Path $StagingDir '*') -DestinationPath $ZipPath -Force

# Nettoyer le staging
Remove-Item -Recurse -Force $StagingDir
Write-Host "ZIP créé : $ZipPath"

# =========================
# 2️⃣ Se connecter à Azure
# =========================
Write-Host "Connexion à Azure..."
az account show > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    az login
}

# =========================
# 3️⃣ Configurer le App Service
# =========================
Write-Host "Configuration de l'App Service..."
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --settings SCM_POST_DEPLOYMENT_ACTIONS_DIR=/opt/startup

# Configurer la commande de démarrage
az webapp config set `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --startup-file "python3 -m gunicorn backend.main:app -c gunicorn_conf.py"

# =========================
# 4️⃣ Déployer le ZIP sur l'App Service
# =========================
Write-Host "Déploiement sur Azure App Service..."
Write-Host "NB : le déploiement peut prendre quelques minutes..."
az webapp deploy --resource-group $ResourceGroup --name $AppServiceName --src-path $ZipPath --type zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Déploiement terminé !"
    Write-Host "URL de l'API : https://$AppServiceName.azurewebsites.net"
} else {
    Write-Host "❌ Erreur lors du déploiement"
}