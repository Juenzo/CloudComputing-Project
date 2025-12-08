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

$AppServiceName   = $cfg["APP_SERVICE_NAME"]   ; if (-not $AppServiceName)   { $AppServiceName = "api-elearning-6285" }
$ResourceGroup    = $cfg["RESOURCE_GROUP"]     ; if (-not $ResourceGroup)    { $ResourceGroup = "rg-elearning" }
$BackendPath      = $cfg["BACKEND_PATH"]       ; if (-not $BackendPath)      { $BackendPath = "backend" }
$RequirementsFile = $cfg["REQUIREMENTS_FILE"]  ; if (-not $RequirementsFile) { $RequirementsFile = "requirements.txt" }
$ZipPath          = $cfg["ZIP_PATH"]           ; if (-not $ZipPath)          { $ZipPath = "deploy.zip" }

# =========================
# 1️⃣ Créer le ZIP
# =========================
Write-Host "Création du ZIP pour déploiement..."

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath
}

Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

# Crée un ZIP vide
$zip = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)

# Ajouter tout le contenu du dossier backend
Get-ChildItem -Path $BackendPath -Recurse | ForEach-Object {
    if (-not $_.PSIsContainer) {
        $relativePath = $_.FullName.Substring((Resolve-Path $BackendPath).Path.Length + 1)
        $entryName = $relativePath.Replace('\', '/')
        
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName) | Out-Null
    }
}

# Ajouter requirements.txt et .env à la racine du ZIP
if (Test-Path $RequirementsFile) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $RequirementsFile, $RequirementsFile) | Out-Null
}
if (Test-Path $EnvFile) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $EnvFile, $EnvFile) | Out-Null
}

$zip.Dispose()
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
# 3️⃣ Déployer le ZIP sur l'App Service
# =========================
Write-Host "Déploiement sur Azure App Service..."
az webapp deploy --resource-group $ResourceGroup --name $AppServiceName --src-path $ZipPath --type zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Déploiement terminé !"
    Write-Host "URL de l'API : https://$AppServiceName.azurewebsites.net"
} else {
    Write-Host "❌ Erreur lors du déploiement"
}