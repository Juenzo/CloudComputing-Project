
# =========================
# CONFIGURATION
# =========================
# Nom de l'App Service (doit correspondre au nom créé par Terraform)
$AppServiceName = "api-elearning-6285"
$ResourceGroup = "rg-elearning"         
$BackendPath = "backend"  
$RequirementsFile = "requirements.txt"
$GunicornConf = "gunicorn.conf.py"
$ZipPath = "deploy.zip"

# =========================
# Créer le ZIP
# =========================
Write-Host "Création du ZIP pour déploiement..."

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath
}

Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

# Crée un ZIP vide
$zip = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)

# Ajouter tout le contenu du dossier backend dans le ZIP sous un dossier 'backend'
Get-ChildItem -Path $BackendPath -Recurse | ForEach-Object {
    if (-not $_.PSIsContainer) {
        $relativePath = $_.FullName.Substring((Resolve-Path $BackendPath).Path.Length + 1)
        $entryName = Join-Path "backend" $relativePath
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName) | Out-Null
    }
}

if (Test-Path $RequirementsFile) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $RequirementsFile, "requirements.txt") | Out-Null
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $GunicornConf, "gunicorn.conf.py") | Out-Null
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, ".env", ".env") | Out-Null
}


$zip.Dispose()
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
# Déployer le ZIP sur l'App Service
# =========================
Write-Host "Déploiement sur Azure App Service..."
az webapp deploy --resource-group $ResourceGroup --name $AppServiceName --src-path $ZipPath --type zip

if ($LASTEXITCODE -eq 0) {
    Write-Host "Déploiement terminé !"
    Write-Host "URL de l'API : https://$AppServiceName.azurewebsites.net"
} else {
    Write-Host "Erreur lors du déploiement"
}
