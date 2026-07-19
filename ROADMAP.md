# JACIGREEN Platform - Roadmap Détaillée 2026

## 🎯 Vision

Plateforme de surveillance par drone pour la détection et cartographie des plantes envahissantes au Niger.
- **Stack Web** : React + TypeScript + Tailwind CSS + Leaflet
- **Stack Backend** : FastAPI + PostgreSQL + PostGIS + Redis + Celery
- **Stack Mobile** : React Native + Expo (offline-first)
- **IA** : YOLOv8 pour détection jacinthe d'eau

---

## 📋 Phase 1 - Authentification & Autorisation (Semaine 1-2)

### 1.1 Authentification Collaborateur

**Status**: 🔴 À faire

**Objectifs**:
- Login par email + password
- Force changement password à 1ère connexion
- JWT tokens avec refresh tokens
- Support admin + collaborateur

**Fichiers à créer/modifier**:
- `backend/app/core/security.py` - JWT, password hashing (bcrypt)
- `backend/app/models/user.py` - User model avec roles
- `backend/app/schemas/auth.py` - Login, token schemas
- `backend/app/api/v1/routes/auth.py` - Auth endpoints
- `backend/app/workers/celery_app.py` - Celery config pour async tasks
- `frontend/src/pages/LoginPage.tsx` - Pro login form
- `frontend/src/services/authService.ts` - Token management

**Endpoints à implémenter**:
```
POST /api/v1/auth/register          (admin only)
POST /api/v1/auth/login             (email + password)
POST /api/v1/auth/refresh           (refresh token)
POST /api/v1/auth/change-password   (force on first login)
POST /api/v1/auth/logout
GET  /api/v1/auth/me                (current user)
```

**Considérations DevSecOps**:
- Passwords: bcrypt avec cost=12
- JWT: RS256 (RSA), 15min expiry, refresh tokens 7 jours
- Rate limiting sur /login (5 tentatives/15min)
- CORS strict par domaine
- HTTPS obligatoire en prod

---

### 1.2 RBAC & Permissions

**Status**: 🔴 À faire

**Rôles**:
- `admin` - Accès complet, création collaborateurs, gestion missions
- `collaborator` - Voir uniquement missions assignées, uploader photos
- `viewer` - Consulter données en lecture seule (optionnel phase 2)

**Modèle permissions**:
```python
class Role(Enum):
    ADMIN = "admin"
    COLLABORATOR = "collaborator"

class User(Base):
    id: int
    email: str
    role: Role
    hashed_password: str
    is_active: bool
    force_password_change: bool
    created_at: datetime
    updated_at: datetime
```

**Fichiers**:
- `backend/app/models/user.py` - User + Role enum
- `backend/app/core/security.py` - get_current_user dependency
- `backend/app/api/deps.py` - role checking functions
- Backend routes filtrées par rôle

---

## 📊 Phase 2 - Missions & Détails (Semaine 2-3)

### 2.1 Liste des Missions

**Status**: 🟡 En cours (API existe, UI à améliorer)

**Affichage collaborateur**:
- Liste missions assignées uniquement
- Cards: nom, zone, date, photos count
- Filtres: statut, date, zone
- Pagination

**Affichage admin**:
- Liste TOUTES les missions
- CRUD complet
- Assigner collaborateurs
- Voir assignations

**Fichiers**:
- `frontend/src/pages/MissionsPage.tsx` - Pro list component
- `frontend/src/components/MissionCard.tsx` - Card component
- `frontend/src/components/MissionFilters.tsx` - Filter UI
- Tailwind CSS pour responsive

---

### 2.2 Détails Mission

**Status**: 🔴 À faire

**Page détails**:
- Titre, description, zone
- Dates début/fin
- Photos count, statut mission
- Collaborateurs assignés
- Historique modifications

**Fichiers**:
- `frontend/src/pages/MissionDetailPage.tsx`
- `frontend/src/components/MissionDetail.tsx`

---

### 2.3 Carte Interactive

**Status**: 🟡 En cours

**Fonctionnalités**:
- Afficher périmètre mission (GeoJSON)
- Afficher photos (clusters pinpoints)
- Clic photo → thumbnail + EXIF data
- Zoom auto sur missions
- Controls: zoom, pan, fullscreen

**Fichiers**:
- `frontend/src/components/MissionMap.tsx` - Leaflet map
- Leaflet-cluster plugin pour grouper photos
- Popups Leaflet avec preview images

---

## 📸 Phase 3 - GPS & Photos (Semaine 3-4)

### 3.1 Extraction EXIF GPS

**Status**: 🔴 À faire

**Workflow**:
1. Upload photo
2. Backend extrait EXIF GPS automatiquement
3. Si coordonnées trouvées → enregistre en DB
4. Si non → interface fallback (saisie manuelle ou map picker)

**Librairies**:
- Backend: `piexif` ou `exifread` (Python)
- Frontend: `exif-js` (JavaScript)

**Fichiers à créer**:
- `backend/app/services/exif_service.py` - Extraction EXIF
- `backend/app/utils/gps_utils.py` - GPS validation + conversion
- `frontend/src/components/PhotoUpload.tsx` - Upload with EXIF display
- `frontend/src/components/GPSFallback.tsx` - Manual GPS entry / map picker

**Endpoint**:
```
POST /api/v1/missions/{mission_id}/photos
  - multipart/form-data
  - auto-extract GPS
  - fallback if missing
```

---

### 3.2 GPS Fallback

**Status**: 🔴 À faire

**Options**:
1. Saisie manuelle latitude/longitude
2. Clic sur map Leaflet pour choisir point
3. Validation: SRID=4326, bounds Niger

**Fichiers**:
- `frontend/src/components/GPSManualEntry.tsx` - Input fields
- `frontend/src/components/MapPicker.tsx` - Leaflet point picker

---

### 3.3 Photos sur Carte

**Status**: 🔴 À faire

**Affichage**:
- Cluster de points pour denser zones
- Clic point → modal avec photo + EXIF
- Couleur points selon: date, détection status
- Légende couleurs

**Fichiers**:
- Update `MissionMap.tsx` avec photo layer
- `frontend/src/components/PhotoCluster.tsx`
- `frontend/src/components/PhotoModal.tsx` - Photo detail popup

---

## 👥 Phase 4 - Administration (Semaine 3-4)

### 4.1 Gestion Collaborateurs

**Status**: 🔴 À faire

**Admin features**:
- Liste collaborateurs avec statut, missions count
- Créer nouveau collaborateur (email + password généré)
- Editer collaborateur (email, actif/inactif)
- Supprimer collaborateur (soft delete)
- Reset password collaborateur

**Fichiers**:
- `frontend/src/pages/AdminCollaboratorsPage.tsx`
- `frontend/src/components/CollaboratorList.tsx`
- `frontend/src/components/CollaboratorForm.tsx` - Create/Edit form

**Endpoints**:
```
GET    /api/v1/admin/collaborators
POST   /api/v1/admin/collaborators
PUT    /api/v1/admin/collaborators/{user_id}
DELETE /api/v1/admin/collaborators/{user_id}
POST   /api/v1/admin/collaborators/{user_id}/reset-password
```

---

### 4.2 Affectation Missions

**Status**: 🔴 À faire

**Workflow**:
- Admin crée mission
- Sélectionne collaborateurs assignés
- Chaque collaborateur reçoit notification
- Dashboard montre progression

**Modèle DB**:
```python
class MissionAssignment(Base):
    mission_id: int
    user_id: int
    assigned_at: datetime
    assigned_by_user_id: int
    status: str  # pending, in_progress, completed
```

**Fichiers**:
- `backend/app/models/mission.py` - Update avec assignments
- `frontend/src/components/MissionAssignForm.tsx`

---

### 4.3 Réorganisation Pages Admin

**Status**: 🔴 À faire

**Layout**:
```
/admin
  ├── Dashboard (stats missions, collaborators, tasks)
  ├── Missions
  ├── Collaborators
  ├── Subscriptions
  └── Settings
```

**Fichiers**:
- `frontend/src/pages/AdminLayout.tsx` - Layout sidebar
- `frontend/src/pages/AdminDashboard.tsx`
- Route guards admin-only

---

## 🎨 Phase 5 - Interface & Design (Semaine 4-5)

### 5.1 Homepage Professionnelle

**Status**: 🔴 À faire

**Sections**:
- Hero avec CTA "Se connecter" et "À propos"
- Présentation solution JACIGREEN
- Caractéristiques principales (3-4 sections)
- Callouts stats (zones surveillées, détections)
- Footer

**Design**:
- Tailwind CSS
- Couleurs JACIGREEN (vert écologique)
- Responsive mobile-first
- Animations légères

**Fichiers**:
- `frontend/src/pages/HomePage.tsx` (rewrite)
- `frontend/src/components/HeroSection.tsx`
- `frontend/src/components/FeaturesSection.tsx`
- `frontend/src/components/StatsSection.tsx`

---

### 5.2 Section À Propos

**Status**: 🔴 À faire

**Contenu**:
- JACIGREEN mission
- Impact environnemental
- Partenaires (logos)
- Équipe (optionnel phase 1)
- Contact

**Fichiers**:
- `frontend/src/pages/AboutPage.tsx`
- `frontend/src/components/PartnersSection.tsx` - Logo carousel

**Assets**:
- `frontend/public/logos/` - Partner logos

---

### 5.3 Responsive Design

**Status**: 🟡 En cours (Tailwind setup, pages à refaire)

**Breakpoints Tailwind**:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Checklist**:
- [ ] HomePage responsive
- [ ] MissionsPage responsive (card grid)
- [ ] MissionDetail responsive (sidebar → stack)
- [ ] Map responsive (fullscreen on mobile)
- [ ] Forms responsive (inputs full-width mobile)
- [ ] Navigation responsive (burger menu mobile)

---

### 5.4 Icônes & Amélioration Visual

**Status**: 🔴 À faire

**Icônes**:
- Utiliser `react-icons` (Feather ou Heroicons)
- Remplacer emoji/text par icônes
- Cohérence taille 20-24px

**Librairie**:
```bash
npm install react-icons
```

**Usage**: Importer `FiMap`, `FiUsers`, `FiSettings`, etc.

---

### 5.5 Filtres de Recherche

**Status**: 🔴 À faire

**Sur MissionsPage**:
- Filtre texte (search name/description)
- Filtre statut (pending, in_progress, completed)
- Filtre date (date range picker)
- Filtre collaborateur assigné
- Reset all filters button

**Fichiers**:
- `frontend/src/components/MissionFilters.tsx`
- `frontend/src/hooks/useFilters.ts` - Custom hook

---

## 💳 Phase 6 - Abonnements & Accès (Semaine 5)

### 6.1 Système d'Abonnements

**Status**: 🔴 À faire

**Architecture**:
- Pas de paiement pour MVP (validé manuellement)
- 3 tiers: Starter, Pro, Enterprise
- Admin valide/refuse demandes
- Token JWT contient subscription_tier
- Endpoints filtrés par tier

**Modèle**:
```python
class SubscriptionTier(Enum):
    STARTER = "starter"       # 3 missions/mois
    PRO = "pro"               # 20 missions/mois
    ENTERPRISE = "enterprise" # Illimité

class Subscription(Base):
    organization_id: int
    tier: SubscriptionTier
    status: str  # active, pending, expired, cancelled
    valid_until: datetime
    created_at: datetime
```

**Workflow**:
1. Org demande abonnement (form de contact)
2. Admin reçoit notification
3. Admin valide/refuse dans admin panel
4. Org reçoit email confirmation
5. Tier activé immédiatement

**Fichiers**:
- `backend/app/models/subscription.py`
- `backend/app/api/v1/routes/subscriptions.py`
- `frontend/src/pages/SubscriptionPage.tsx` - Request form

---

## 🤖 Phase 7 - IA & Training (Semaine 6+)

**Note**: Voir `MOBILE_AI_HOSTING.md` pour détails complets

### 7.1 Configuration YOLOv8

**Status**: 🔴 À faire

- Dataset: télécharger dataset public jacinthe d'eau + custom photos
- Fine-tuning: yolov8n (nano pour légèreté)
- Export ONNX pour backend léger
- Validation: mAP50 ≥ 0.50

### 7.2 Intégration Backend

**Status**: 🔴 À faire

- Worker Celery pour inférence async
- Enregistrement détections en DB
- Exposer résultats sur API `/api/v1/missions/{id}/detections`

---

## 📱 Phase 8 - Mobile (Semaine 7+)

**Note**: Voir `MOBILE_AI_HOSTING.md` pour setup complet

- React Native + Expo setup
- Offline-first avec SQLite local
- Sync mode → upload photos batch
- Map Leaflet sur mobile
- Camera integration

---

## 🚀 Phase 9 - Déploiement & Hosting Gratuit

**Note**: Voir `MOBILE_AI_HOSTING.md` pour instructions

- Railway.app (free backend)
- Netlify (free frontend)
- Supabase (free DB + storage)
- Render.com (backup)

---

## 🗓️ Timeline Recommandée

| Semaine | Focus |
|---------|-------|
| 1-2 | Auth + RBAC + Missions list |
| 3 | GPS/EXIF + Map photos |
| 4 | Admin UI + Abonnements |
| 5 | Homepage + Responsive design |
| 6 | IA training + Worker integration |
| 7 | Mobile setup + offline sync |
| 8 | Déploiement + optimisations |

---

## 🔐 Security Checklist

- [ ] JWT RS256 avec clés d'env
- [ ] Password bcrypt cost=12
- [ ] Rate limiting API
- [ ] CORS configuré par domaine
- [ ] HTTPS only en prod
- [ ] SQL injection prevention (ORM + parameterized queries)
- [ ] File upload validation (type, size, virus scan)
- [ ] Secrets en .env (jamais en code)
- [ ] Audit logging pour actions admin
- [ ] Data encryption at rest (DB passwords, secrets)

---

## ✅ Definition of Done

Chaque feature:
1. Code écrit + linted
2. Tests unitaires ≥ 80% coverage
3. Tests intégration (end-to-end)
4. Documentation API (Swagger/OpenAPI)
5. Documentation code (docstrings)
6. CR (code review) approuvé
7. Déployé sur staging
8. Produit validé

---

## 📞 Support & Questions

- Issues GitHub dans le repo
- Documentation: `ma_doc.md` (technique), `ROADMAP.md` (planning)
- Frontend setup: `frontend/README.md`
- Backend setup: `backend/README.md`
- Mobile setup: `MOBILE_AI_HOSTING.md`

---

**Last Updated**: July 19, 2026 | **Owner**: Dev Team | **Next Review**: Phase completion
