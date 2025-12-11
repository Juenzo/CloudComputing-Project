<div align="center">

# Maxi'Learning — Plateforme d’e-learning (Projet ISEN5 Cloud Computing)

Une plateforme d’apprentissage en ligne simple et modulaire !

</div>


## Aperçu
Maxi'Learning est une plateforme d’e-learning collaborative pensée pour être simple à utiliser, ouverte et hébergée directement sur Microsoft Azure. Elle permet à tout utilisateur de créer, publier et partager facilement des cours en ligne, sans compétences techniques particulières.

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

### Architecture
- Terraform : Création automatiquement de toute l’infrastructure sur Azure à partir d’un fichier de configuration (Azure App Service, Azure SQL Database, Azure Blob Storage, Azure OpenAI ...).
- Backend (Python) : sert d’API REST entre le frontend et les services Azure.
- Frontend (React) : interface utilisateur

### Tests
Backend (Pytest) :
- Validation du flux complet Quiz (création, soumission, score).
- Test de la Création de Leçon avec simulation de l'envoi de fichiers vers Azure Blob Storage.
- Vérification de la Suppression en cascade des cours et des ressources Cloud associées.
Frontend (React) :
- Test de la page CourseListPage (affichage, filtre et gestion des erreurs).
- Test de la page CourseCreatePage (soumission du formulaire).
- Test de la page QuizPlayPage (interaction utilisateur et envoi des réponses).
- App.tsx : Smoke Test de l'application.
Automatisation:
- L'ensemble des tests est lancé automatiquement via GitHub Actions à chaque git push pour garantir la stabilité (CI/CD).
- Un script local (run_tests.ps1) est disponible pour un retour immédiat en phase de développement.

## Initalisation 

### Lancer l'infrastructure sur Azure
1. Exécuter les commandes suivantes dans votre terminal
```bash
cd infra
terraform init
terraform plan
terraform apply
```

2. Copier les variables de output du terraform apply dans le .env (voir .env.template)

3. Exécuter le script suivant pour ajouter votre IP au firewall, et ainsi pouvoir accéder à la base de données (ne pas utiliser le réseau ISEN)
```bash
./add_ip_to_azure.ps1
```

4. Connectez-vous à Azure Portal pour récupérer une clé d'accès au blob de stockage précedemment crée, puis ajouter la au fichier .env (Compte de Stockage > Sécurité + Reseau > Clés d'accès)

5. Modifier dans le fichier frontend/.env.production la variable REACT_APP_API_BASE_URL par votre nouvelle variable api_url (trouvable dans les outputs de terraform)

6. Installer le backend (sujet à problème)
``` bash
.\deploy_backend_azure.ps1
```

7. Installer le frontend (fonctionnel)
``` bash
.\deploy_frontend_azure.ps1
```