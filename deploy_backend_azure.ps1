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
# Créer le ZIP
# =========================
Write-Host "Création du ZIP pour déploiement..."

$StagingDir = Join-Path $PWD "deploy_staging"
if (Test-Path $StagingDir) { Remove-Item -Recurse -Force $StagingDir }
New-Item -ItemType Directory -Path $StagingDir | Out-Null

Copy-Item -Path $BackendPath -Destination $StagingDir -Recurse -Force

if (Test-Path $RequirementsFile) { Copy-Item -Path $RequirementsFile -Destination (Join-Path $StagingDir (Split-Path $RequirementsFile -Leaf)) -Force }
if (Test-Path $EnvFile) { Copy-Item -Path $EnvFile -Destination (Join-Path $StagingDir (Split-Path $EnvFile -Leaf)) -Force }

$GunicornConfSrc = Join-Path $BackendPath "gunicorn_conf.py"
if (Test-Path $GunicornConfSrc) { Copy-Item -Path $GunicornConfSrc -Destination (Join-Path $StagingDir "gunicorn_conf.py") -Force }

if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }
Compress-Archive -Path (Join-Path $StagingDir '*') -DestinationPath $ZipPath -Force

Remove-Item -Recurse -Force $StagingDir
Write-Host "ZIP créé : $ZipPath"

# =========================
# Se connecter à Azure
# =========================
Write-Host "Connexion à Azure..."
az account show > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    az login
}

# =========================
# Configurer le App Service
# =========================
Write-Host "Configuration de l'App Service..."
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --settings SCM_POST_DEPLOYMENT_ACTIONS_DIR=/opt/startup

az webapp config set `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --startup-file "python3 -m gunicorn backend.main:app -c gunicorn_conf.py"

# =========================
# Déployer le ZIP sur l'App Service
# =========================
Write-Host "Déploiement sur Azure App Service..."
Write-Host "NB : le déploiement peut prendre quelques minutes..."
az webapp deploy --resource-group $ResourceGroup --name $AppServiceName --src-path $ZipPath --type zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "Déploiement terminé !"
    Write-Host "URL de l'API : https://$AppServiceName.azurewebsites.net"
} else {
    Write-Host "Erreur lors du déploiement"
}