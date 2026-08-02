# Guide de déploiement de JACIGREEN

## 1. Stack recommandé (100 % gratuit)

* **Frontend :** Vercel
* **Backend API :** Railway
* **Base de données :** Supabase PostgreSQL
* **Stockage des fichiers :** Supabase Storage
* **Redis :** Upstash ou Railway Redis (offre gratuite)
* **Supervision :** GitHub Actions + UptimeRobot

---

## 2. Variables d'environnement

### Backend (Railway)

```bash
ENVIRONMENT=production
SECRET_KEY=<valeur_aléatoire_très_sécurisée>
DATABASE_URL=postgresql+asyncpg://utilisateur:motdepasse@hote:5432/base_de_donnees
REDIS_URL=redis://hote:6379/0
ALLOWED_ORIGINS=https://votre-frontend.vercel.app
ALLOWED_HOSTS=votre-api.up.railway.app,localhost
DEBUG=false
AI_MODEL_PATH=ai/models/jacinthe_v1.onnx
AI_CONFIDENCE_THRESHOLD=0.45
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=<clé_anonyme_ou_service_role>
SUPABASE_STORAGE_BUCKET=photos
```

### Frontend (Vercel)

```bash
VITE_API_URL=https://votre-api.up.railway.app
```

---

## 3. Processus de déploiement

1. Envoyer le code sur GitHub (`git push`).
2. L'intégration continue (CI) exécute automatiquement :

   * les tests du backend ;
   * la compilation du frontend ;
   * l'analyse de sécurité avec **Bandit**.
3. Vercel déploie automatiquement le frontend après une fusion dans la branche **main**.
4. Railway déploie automatiquement l'API FastAPI.
5. Supabase gère la base de données PostgreSQL ainsi que le stockage des fichiers.

---

## 4. Liste de contrôle de sécurité

Avant toute mise en production, vérifiez les points suivants :

* Utiliser exclusivement **HTTPS**.
* Stocker tous les secrets (clés, mots de passe, jetons) dans les variables d'environnement.
* Restreindre **CORS** uniquement aux domaines du frontend autorisés.
* Désactiver la documentation Swagger/ReDoc en production si elle n'est pas nécessaire.
* Renouveler régulièrement les clés JWT et les mots de passe de la base de données.
* Stocker les fichiers téléversés en dehors du répertoire principal du serveur et privilégier des **URL signées** pour leur accès lorsque cela est possible.

---

## 5. Outils gratuits recommandés

### Analyse statique du code (SAST)

* **Bandit**
* **GitHub CodeQL** (optionnel)

### Analyse dynamique de sécurité (DAST)

* **OWASP ZAP**, exécuté dans la chaîne CI/CD ou via une analyse planifiée chaque nuit.

### Supervision et performances

* **Vercel Analytics**
* **Railway Metrics**
* **UptimeRobot**
