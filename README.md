# JACIGREEN DroneSurveillance Platform 🚁

Plateforme web + mobile pour surveiller et cartographier les plantes envahissantes par drone au Niger.
Détection automatique via IA YOLOv8, visualisation temps réel sur carte, sync offline-first mobile.

## 📋 Stack Technique

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

## 🚀 Démarrage Rapide

### 1. Setup infrastructure locale

```bash
# Clone et setup env
git clone <repo>
cd jacigreen-platform
cp .env.example .env

# Docker: PostgreSQL + PostGIS + Redis
docker compose up -d
docker compose ps  # Vérifier ✅

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

## 📚 Documentation

- **📖 [ROADMAP.md](./ROADMAP.md)** - Feuille de route détaillée (15 phases, timeline 8 semaines)
- **📖 [MOBILE_AI_HOSTING.md](./MOBILE_AI_HOSTING.md)** - Setup mobile, training YOLOv8, déploiement gratuit
- **📖 [ma_doc.md](./ma_doc.md)** - Architecture technique approfondie
- **📖 [Backend README](./backend/README.md)** - Setup backend détaillé
- **📖 [Frontend README](./frontend/README.md)** - Setup frontend détaillé

## ✨ Fonctionnalités MVP (Phase 1-3)

### ✅ Authentification
- [x] Login collaborateur (email + password)
- [ ] Force password change 1ère connexion
- [ ] RBAC: admin vs collaborator
- [ ] JWT + refresh tokens

### ✅ Missions
- [x] CRUD missions
- [ ] Liste missions (collaborator → assignées seulement)
- [ ] Détails mission + rapport
- [ ] Affectation missions (admin)

### ✅ Carte & GPS
- [x] Affichage zone sur Leaflet (GeoJSON)
- [ ] Extraction GPS EXIF (piexif)
- [ ] Saisie manuelle GPS fallback
- [ ] Photos directes sur carte (clusters)

### ✅ Interface
- [ ] Homepage pro (Tailwind)
- [ ] Section À propos + logos
- [ ] Responsive design (mobile-first)
- [ ] Filtres recherche missions

### ✅ IA
- [ ] Fine-tuning YOLOv8n
- [ ] Celery worker pour inférence
- [ ] Enregistrement détections DB

### ✅ Mobile
- [ ] SQLite offline sync
- [ ] Camera + GPS capture
- [ ] Batch photo upload

### ✅ Abonnements
- [ ] Validation manuelle par admin
- [ ] Droits d'accès par tier

## 🏗️ Architecture

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

## 🔐 Security

- JWT RS256 (key pair en env vars)
- Passwords: bcrypt cost=12
- Rate limiting: /login (5/15min)
- CORS: par domaine (env var)
- HTTPS obligatoire prod (Railway, Netlify)
- Secrets jamais en code (→ .env)

## 🚢 Déploiement

**Production (Gratuit)**:
- Backend: Railway.app (500h free/mois)
- Frontend: Netlify (unlimited free)
- DB: Supabase PostgreSQL (free tier)
- Storage: Supabase Files (1GB free)
- → Voir [MOBILE_AI_HOSTING.md](./MOBILE_AI_HOSTING.md) pour détails

## 👥 Équipe

**Propriétaire**: JACIGREEN Africa (Mariama MAMANE, CEO)  
**Développement**: Ismail Moussa  
**DevSecOps**: Best practices FastAPI + React + Mobile

## 📞 Support

- **Issues**: GitHub issues
- **Docs**: Lire ROADMAP.md, MOBILE_AI_HOSTING.md, ma_doc.md
- **Questions techniques**: Commenter sur PR ou ouvrir discussion

---

**Last Updated**: July 19, 2026 | **MVP Target**: End of September 2026