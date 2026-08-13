# JACIGREEN DroneSurveillance Platform 

Plateforme web + mobile pour surveiller et cartographier les plantes envahissantes par drone au Niger.
Détection automatique via IA YOLOv8, visualisation temps réel sur carte, sync offline-first mobile.

## Stack Technique

| Composant | Tech |
|-----------|------|
| **Backend** | FastAPI · Python 3.12 · async/await |
| **Database** | PostgreSQL 15 + PostGIS 3.3 |
| **Cache/Queue** | Redis 7 + Celery |
| **Frontend Web** | React 18 · TypeScript · Vite · Tailwind CSS · Leaflet |
| **Mobile** | React Native + Expo · Offline-first · SQLite |
| **IA** | YOLOv8 (nano) · Ultralytics · ONNX export |
| **Storage** | Supabase Storage (free) · EXIF extraction |
| **Auth** | JWT (RS256) · bcrypt password hashing |

##  Audit de progression du projet (Août 2026)

### État actuel

- Backend FastAPI : en place, structure claire, endpoints principaux présents.
- Authentification : login / refresh / admin user management fonctionnels dans l’API.
- Frontend React + Vite : interface de base en place, navigation et gestion de missions visible.
- Mobile Expo : base du projet présente, flux de synchronisation de photo prévu.
- Base de données locale : Postgres + Redis via Docker fonctionnent comme environnement de dev.
- CI/CD : pipeline GitHub Actions ajouté pour tests backend, build frontend et scan Bandit.

### Écarts importants par rapport au README

- Le README décrit un état plus "production-ready" que le code actuel ; plusieurs points restent à finaliser avant mise en ligne.
- La sécurité de production est partiellement prise en compte mais pas totalement : secrets, CORS, headers HTTP, rate-limiting, HTTPS et validation de dépendances restent à verrouiller sur l’environnement réel.
- Le stockage Supabase n’est pas encore branché en production dans le code de manière complète.
- L’IA / Celery / détections automatiques sont seulement partiellement intégrées.
- Le frontend est fonctionnel mais le design, la sécurité front et l’UX production demandent une étape de polish design-system / a11y / conformité.

### Priorité immédiate

1. Finaliser les variables d’environnement de production.
2. Sécuriser les endpoints et rôles sur l’API.
3. Brancher le frontend sur un domaine Vercel et le backend sur Railway.
4. Migrer les données/stockage vers Supabase.
5. Ajouter le scanning DAST, la surveillance et la couverture de tests de sécurité.

##  Démarrage Rapide

### 1. Setup infrastructure locale

```bash
# Clone et setup env
git clone <repo>
cd jacigreen-platform
cp .env.example .env

# Docker: PostgreSQL + PostGIS + Redis
docker compose up -d
docker compose ps  # Vérifier 

# Créer venv backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Migrations DB
alembic upgrade head

# Start backend (Uvicorn)
uvicorn app.main:app --reload
# 🟢 http://localhost:8000/api/v1/health
```

### 2. Frontend web

```bash
cd frontend
npm install
npm run dev
# 🟢 http://localhost:5173
```

### 3. Mobile (Expo)

```bash
cd mobile
npm install
npm start
# Scan QR avec Expo Go
```

##  Documentation

- ** [ROADMAP.md](./ROADMAP.md)** - Feuille de route détaillée (15 phases, timeline 8 semaines)
- ** [MOBILE_AI_HOSTING.md](./MOBILE_AI_HOSTING.md)** - Setup mobile, training YOLOv8, déploiement gratuit
- ** [ma_doc.md](./ma_doc.md)** - Architecture technique approfondie
- ** [Backend README](./backend/README.md)** - Setup backend détaillé
- ** [Frontend README](./frontend/README.md)** - Setup frontend détaillé

##  Fonctionnalités MVP (Phase 1-3)

###  Authentification
- [x] Login collaborateur (email + password)
- [x] Force password change 1ère connexion
- [x] RBAC: admin vs collaborator (accès aux missions selon affectation)
- [x] JWT + refresh tokens

###  Missions
- [x] CRUD missions
- [x] Liste missions (collaborator → assignées seulement)
- [x] Détails mission + rapport
- [x] Affectation d’un collaborateur à une mission (admin)

###  Carte & GPS
- [x] Affichage zone sur Leaflet (GeoJSON)
- [x] Extraction GPS EXIF (piexif)
- [ ] Saisie manuelle GPS fallback
- [ ] Photos directes sur carte (clusters)

###  Interface
- [x] Homepage pro (Tailwind)
- [x] Section À propos + logos
- [x] Responsive design (mobile-first)
- [x] Filtres recherche missions

###  IA
- [x] Fine-tuning YOLOv8n
- [x] Celery worker pour inférence
- [ ] Enregistrement détections DB

###  Mobile
- [x] SQLite offline cache des missions et file d’attente photos
- [x] Camera + GPS capture
- [x] Batch photo upload à la synchronisation

###  Abonnements
- [x] Validation manuelle par admin
- [ ] Droits d'accès par tier

##  Architecture

```
jacigreen-platform/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/v1/routes/     # REST endpoints
│   │   ├── models/            # SQLAlchemy ORM
│   │   ├── schemas/           # Pydantic validators
│   │   ├── services/          # Business logic (EXIF, GPS, etc)
│   │   ├── workers/           # Celery tasks (IA inference)
│   │   ├── core/              # Config, security, database
│   │   └── main.py
│   ├── alembic/               # Database migrations
│   ├── tests/
│   └── requirements.txt
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── pages/             # HomePage, MissionsPage, AdminPage
│   │   ├── components/        # Reusable UI (Map, Cards, Forms)
│   │   ├── services/          # API client, auth service
│   │   ├── hooks/             # Custom React hooks
│   │   └── App.tsx
│   ├── tailwind.config.js     # Tailwind CSS config
│   └── package.json
├── mobile/                     # React Native + Expo
│   ├── app/
│   │   ├── screens/           # Navigation screens
│   │   ├── services/          # SQLite, sync, API
│   │   ├── context/           # Auth, Sync state
│   │   └── App.tsx
│   └── package.json
├── ai/                         # YOLOv8 training
│   ├── datasets/              # train/val/test YOLO format
│   ├── models/                # best.pt, best.onnx
│   └── notebooks/             # Jupyter training
├── docker-compose.yml         # PostgreSQL + Redis
└── ROADMAP.md                 # Feuille de route
```

##  Security

- JWT RS256 (key pair en env vars)
- Passwords: bcrypt cost=12
- Rate limiting: /login (5/15min)
- CORS: par domaine (env var)
- HTTPS obligatoire prod (Railway, Netlify)
- Secrets jamais en code (→ .env)

##  Déploiement

**Production (Gratuit)**:
- Backend: Railway.app (500h free/mois)
- Frontend: Netlify (unlimited free)
- DB: Supabase PostgreSQL (free tier)
- Storage: Supabase Files (1GB free)
- → Voir [MOBILE_AI_HOSTING.md](./MOBILE_AI_HOSTING.md) pour détails

##  Équipe

**Propriétaire**: JACIGREEN Africa (Mariama MAMANE, CEO)  
**Développement**: Ismail Moussa  
**DevSecOps**: Best practices FastAPI + React + Mobile

##  Support

- **Issues**: GitHub issues
- **Docs**: Lire ROADMAP.md, MOBILE_AI_HOSTING.md, ma_doc.md
- **Questions techniques**: Commenter sur PR ou ouvrir discussion

---

**Last Updated**: July 19, 2026 | **MVP Target**: End of September 2026
