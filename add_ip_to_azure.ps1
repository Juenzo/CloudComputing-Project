Push-Location infra
$RgName  = (terraform output -raw resource_group_name).Trim()
$SqlFQDN = (terraform output -raw sql_server_fqdn).Trim()
$SqlServerName = $SqlFQDN.Split('.')[0]
Pop-Location

# Détection de votre IP publique actuelle
Write-Host "Détection de votre IP publique..." -ForegroundColor Yellow
$MyIp = (Invoke-WebRequest -Uri "https://api.ipify.org").Content
Write-Host "Votre IP est : $MyIp" -ForegroundColor Cyan

# Création de la règle pare-feu
Write-Host "Ajout de la règle pare-feu sur Azure..." -ForegroundColor Yellow
az sql server firewall-rule create `
    --resource-group $RgName `
    --server $SqlServerName `
    --name "DevLocalIP" `
    --start-ip-address $MyIp `
    --end-ip-address $MyIp

Write-Host "C'est fait ! Vous pouvez lancer le backend en local." -ForegroundColor Green