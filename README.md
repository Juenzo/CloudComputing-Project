<div align="center">

# Maxi'Learning — Plateforme d’e-learning (Projet ISEN5 Cloud Computing)

Une plateforme d’apprentissage en ligne simple, modulaire et scalable sur Azure.

</div>


## Aperçu
Maxi'Learning est une plateforme d’e-learning collaborative pensée pour être simple à utiliser, ouverte et hébergée sur Microsoft Azure. Elle permet à tout utilisateur de créer, publier et partager facilement des cours en ligne, sans compétences techniques particulières.

## Objectifs
- Accessibilité : tout le monde peut créer et partager un cours via un lien.
- Modularité : un cours est composé de chapitres, de quiz, de PDF et de vidéos.
- Évolutivité : la solution doit accueillir un grand nombre d’utilisateurs et de ressources grâce à Azure.
- Interaction : un chatbot d’assistance guidera l’apprenant dans la plateforme.

## Fonctionnalités

### A. Gestion des cours
- Création d’un cours avec titre, description, catégorie.
- Téléversement de ressources (PDF, vidéo).
- Ajout de chapitres (texte, liens, quiz associés).
- Édition après publication et historique des modifications (versioning simplifié).
- Partage via lien unique (URL courte) et contrôle du partage public/privé.

### B. Structure d’un cours
- Informations générales : titre, description, image de couverture.
- Chapitres ordonnés, contenant : texte/résumé, ressources PDF, vidéos (Azure Blob Storage), quiz QCM.
- Évaluation finale avec calcul du score et (optionnel) certificat après réussite.

### C. Quiz et évaluation
- Un quiz par cours.
- Calcul automatique du score et affichage du résultat.
- Suivi de la progression via stockage des tentatives.

### D. Chatbot d’assistance
- Basé sur Azure OpenAI Service ou Azure Bot Framework.
- Répond aux questions, résume un chapitre, propose un plan d’étude, réalisation de QCM.

### Architecture
- Terraform : Création automatiquement de toute l’infrastructure sur Azure à partir d’un fichier de configuration (Azure App Service, Azure SQL Database, Azure Blob Storage, Azure OpenAI ...).
- Backend (Python) : sert d’API REST entre le frontend et les services Azure.
- Frontend (React) : interface utilisateur


### Initalisation 

#### Lancer l'infrastructure sur Azure
```bash
cd infra
az login
terraform taint random_string.pg_suffix
terraform init
terraform plan
terraform apply
```
Ajouter son IP pour pouvoir accéder à la base de données
```bash
# 1. Récupérer les noms depuis Terraform (pour ne pas les taper à la main)
>> Push-Location infra
>> $RgName  = (terraform output -raw resource_group_name).Trim()
>> $SqlFQDN = (terraform output -raw sql_server_fqdn).Trim()
>> $SqlServerName = $SqlFQDN.Split('.')[0]
>> Pop-Location
>>
>> # 2. Détecter votre IP publique actuelle
>> Write-Host "Détection de votre IP publique..." -ForegroundColor Yellow
>> $MyIp = (Invoke-WebRequest -Uri "https://api.ipify.org").Content
>> Write-Host "Votre IP est : $MyIp" -ForegroundColor Cyan
>>
>> # 3. Créer la règle pare-feu
>> Write-Host "Ajout de la règle pare-feu sur Azure..." -ForegroundColor Yellow
>> az sql server firewall-rule create `
>>     --resource-group $RgName `
>>     --server $SqlServerName `
>>     --name "DevLocalIP" `
>>     --start-ip-address $MyIp `
>>     --end-ip-address $MyIp
>>
>> Write-Host "C'est fait ! Vous pouvez lancer le backend en local." -ForegroundColor Green
```
Lancer le backend en local 
```bash
uvicorn backend.main:app --reload
```