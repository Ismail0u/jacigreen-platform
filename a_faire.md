Orchestrated comprehensive handoff document for seamless AI collaboration

Bloc 3 validé. PostgreSQL+PostGIS et Redis sont healthy. La base de données tourne.

Je te génère le document de référence complet maintenant.
Create comprehensive handoff document

bash
cat > /mnt/user-data/outputs/JACIGREEN_Rapport_Travail_S1_S3.md << 'ENDDOC'
# JACIGREEN DroneSurveillance — Rapport de Travail
## Synthèse réalisé + Plan détaillé Semaines 1 à 3
**Développeur :** Ismael Moussa | **Mis à jour :** Juin 2026  
**Note :** Ce document est conçu pour être repris par n'importe quel assistant IA (ChatGPT, Gemini, Claude). Il contient tout le contexte nécessaire pour continuer le travail sans perte d'information.

---

## PARTIE 1 — CONTEXTE PROJET

### Qui est JACIGREEN ?
JACIGREEN Africa est une entreprise basée à Niamey, Niger, fondée par Mariama MAMANE.  
Elle produit des biodigesteurs JaciBiogaz qui transforment des plantes envahissantes (jacinthe d'eau, prosopis) en biogaz utilisé pour la cuisson et l'électricité dans les cantines scolaires.

### Le problème qu'on résout
Actuellement, JACIGREEN localise les plantes envahissantes **uniquement par déplacements terrain** : lent, coûteux, imprécis, non traçable.

### La solution qu'on construit
Une plateforme web + mobile qui exploite un drone pour surveiller les zones d'intervention :
1. Le drone photographie les zones cibles
2. Les photos (géolocalisées via EXIF GPS) sont importées dans la plateforme
3. Un modèle IA (YOLOv8) détecte automatiquement les plantes envahissantes
4. Les résultats s'affichent sur une carte interactive
5. Les équipes terrain consultent la carte sur l'app mobile, même sans réseau

### Périmètre du stage (MVP — 3 mois)
- Import et organisation des missions drone
- Visualisation des zones sur carte interactive (Leaflet)
- Détection automatique de la jacinthe d'eau (YOLOv8, précision ≥ 50%)
- Application mobile offline-first (React Native Expo)

---

## PARTIE 2 — ÉTAT DE L'ENVIRONNEMENT

### Machine de développement
```
OS       : Ubuntu 24.04 LTS
Chemin   : /data/projets/jacigreen-platform/
Python   : 3.12.3
Node.js  : 24.16.0
Docker   : 29.5.2
Compose  : v5.1.4
```

### Services Docker (actifs)
```
Container        Image                    Port    Statut
jacigreen_db     postgis/postgis:15-3.3   5432    healthy ✅
jacigreen_redis  redis:7-alpine           6379    healthy ✅
```

### Credentials dev local (ne jamais committer le .env)
```
DB_HOST     : localhost
DB_PORT     : 5432
DB_NAME     : jacigreen
DB_USER     : jacigreen
DB_PASS     : jacigreen_dev
REDIS_URL   : redis://localhost:6379/0
```

### Commandes de démarrage rapide
```bash
cd /data/projets/jacigreen-platform
docker compose up -d          # Démarre DB + Redis
docker compose ps             # Vérifie l'état
docker compose down           # Arrête tout (les données persistent grâce aux volumes)
docker compose down -v        # Arrête ET supprime les données (reset complet)
```

### Structure du projet (état actuel)
```
jacigreen-platform/
├── .env.example          ✅ créé
├── .env                  ✅ créé (non commité)
├── .gitignore            ✅ créé
├── README.md             ✅ créé
├── docker-compose.yml    ✅ créé
├── backend/              ✅ dossiers créés, vide
│   ├── app/
│   │   ├── api/v1/routes/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── workers/
│   ├── alembic/versions/
│   └── tests/
├── frontend/             ✅ dossier créé, vide
├── mobile/               ✅ scaffold Expo initialisé, prototype mission list créé
└── ai/
    ├── notebooks/
    ├── models/
    └── datasets/{raw,annotated,augmented}
```

---

## PARTIE 3 — SYNTHÈSE DES TRAVAUX RÉALISÉS

### Ce qui a été produit (documents)
| Document | Contenu |
|----------|---------|
| `JACIGREEN_CDC_Technique_v1.md` | Stack technique, schéma DB SQL complet, endpoints API REST, Docker Compose, exigences non-fonctionnelles |
| `JACIGREEN_System_Design_Reference.md` | 5 design patterns avec code (Repository, Strategy, Command, Observer, Factory), 6 diagrammes UML en PlantUML, ERD Mermaid, 5 ADR (décisions d'architecture), checklist sécurité |

### Ce qui a été décidé (architecture)
| Décision | Choix | Raison |
|----------|-------|--------|
| Architecture | Monolithe modulaire | 1 dev, 3 mois, budget zéro |
| Backend | FastAPI + Python 3.12 | Async natif, typage Pydantic, parfait pour IA |
| ORM | SQLAlchemy 2.x async + Alembic | Migrations propres, support PostGIS |
| Base de données | PostgreSQL 15 + PostGIS 3 | Requêtes géospatiales natives |
| Cache/Queue | Redis 7 + Celery | Traitement IA asynchrone |
| Frontend | React 18 + TypeScript + Vite | Stack maîtrisée par le dev |
| Carte | Leaflet + react-leaflet | Léger, fonctionne offline |
| Mobile | React Native + Expo SDK 51 | Stack maîtrisée, offline-first |
| Offline mobile | WatermelonDB | SQLite local, sync différée robuste |
| Stockage images | Supabase Storage (MVP) | S3-compatible, gratuit, migration transparente |
| IA | YOLOv8n (Ultralytics) | Légère, rapide CPU, fine-tuning simple |

### Ce qui est validé (infrastructure)
- ✅ Docker installé et fonctionnel
- ✅ PostgreSQL 15 + PostGIS 3.3 opérationnel
- ✅ Redis 7 opérationnel
- ✅ Structure projet créée et sous Git
- ✅ Premier commit sur branche `main`

### Ce qui reste à faire (MVP complet)
- ⬜ Bloc 4 : FastAPI minimal + /health + SQLAlchemy + Alembic
- ⬜ Bloc 5 : Frontend React + Leaflet
- ⬜ Module 1 : Import photos + EXIF + stockage
- ⬜ Module 2 : Carte interactive + GeoJSON
- ⬜ Module 3 : Pipeline IA (Celery + YOLOv8)
- ⬜ Module 4 : Application mobile offline-first (scaffold Expo initialisé, prototype de mission list + détails créé)

---

## PARTIE 4 — PLAN DÉTAILLÉ SEMAINES 1 À 3

---

## SEMAINE 1 — JOURS 1 à 5

### BLOC 4 — FastAPI Backend Minimal

#### QUOI
Créer le projet FastAPI avec :
- Connexion à PostgreSQL (SQLAlchemy async)
- Premiers modèles de données (User, Mission, Photo, Detection)
- Système de migrations Alembic
- Endpoint `GET /health` qui vérifie la connexion DB
- Variables d'environnement chargées depuis `.env`

#### POURQUOI
C'est le **squelette** sur lequel tout sera greffé. Sans ça, impossible de coder les modules métier. On valide aussi que FastAPI communique bien avec PostgreSQL+PostGIS avant d'aller plus loin.

#### COMMENT — Étapes exactes

**1. Créer l'environnement virtuel et installer les dépendances**

```bash
cd /data/projets/jacigreen-platform/backend
python3 -m venv .venv
source .venv/bin/activate

pip install fastapi==0.115.0 \
  uvicorn[standard]==0.30.0 \
  sqlalchemy[asyncio]==2.0.36 \
  asyncpg==0.30.0 \
  alembic==1.13.3 \
  geoalchemy2==0.15.2 \
  pydantic-settings==2.5.2 \
  python-jose[cryptography]==3.3.0 \
  passlib[bcrypt]==1.7.4 \
  python-multipart==0.0.12 \
  pillow==10.4.0 \
  piexif==1.1.3 \
  celery==5.4.0 \
  redis==5.1.1 \
  boto3==1.35.0 \
  httpx==0.27.0

pip freeze > requirements.txt
```

**2. Fichier de configuration (`app/core/config.py`)**

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Base de données
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # IA
    AI_CONFIDENCE_THRESHOLD: float = 0.45
    
    # App
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

**3. Connexion base de données (`app/core/database.py`)**

```python
# backend/app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,   # Log SQL en mode debug
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

# Dependency FastAPI : injecte une session DB dans chaque route
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

**4. Modèles SQLAlchemy (`app/models/`)**

```python
# backend/app/models/mission.py
from sqlalchemy import Column, String, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import uuid
import enum
from app.core.database import Base

class MissionStatus(enum.Enum):
    PENDING    = "pending"
    PROCESSING = "processing"
    COMPLETED  = "completed"
    FAILED     = "failed"
    CANCELLED  = "cancelled"

class Mission(Base):
    __tablename__ = "missions"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name         = Column(String(255), nullable=False)
    status       = Column(SAEnum(MissionStatus), default=MissionStatus.PENDING, nullable=False)
    mission_date = Column(Date, nullable=False)
    flight_path  = Column(Geometry("LINESTRING", srid=4326), nullable=True)
    notes        = Column(Text, nullable=True)
    zone_id      = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True)
    operator_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    photos     = relationship("Photo", back_populates="mission", cascade="all, delete-orphan")
    detections = relationship("Detection", back_populates="mission")
```

```python
# backend/app/models/photo.py
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import uuid
from app.core.database import Base

class Photo(Base):
    __tablename__ = "photos"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mission_id  = Column(UUID(as_uuid=True), ForeignKey("missions.id"), nullable=False)
    filename    = Column(String(500), nullable=False)
    storage_url = Column(String(1000), nullable=False)
    location    = Column(Geometry("POINT", srid=4326), nullable=False)  # GPS EXIF
    altitude_m  = Column(Integer, nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=True)
    source      = Column(String(50), default="drone")  # 'drone' ou 'mobile'

    mission    = relationship("Mission", back_populates="photos")
    detections = relationship("Detection", back_populates="photo")
```

**5. Application principale (`app/main.py`)**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine

app = FastAPI(
    title="JACIGREEN DroneSurveillance API",
    description="API de surveillance drone et détection de plantes envahissantes",
    version="1.0.0",
    docs_url="/docs",      # Swagger UI
    redoc_url="/redoc",    # ReDoc
)

# CORS : autorise le frontend à appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Vérifie que l'API et la base de données fonctionnent."""
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT PostGIS_Version()"))
        postgis_version = result.scalar()
    return {
        "status": "ok",
        "api": "JACIGREEN DroneSurveillance v1.0",
        "database": "connected",
        "postgis": postgis_version,
    }

@app.on_event("startup")
async def startup():
    # Active PostGIS à chaque démarrage (idempotent)
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
```

**6. Alembic — initialisation + première migration**

```bash
cd /data/projets/jacigreen-platform/backend
source .venv/bin/activate
alembic init alembic

# Modifier alembic/env.py pour utiliser nos modèles
# (voir ci-dessous)

# Créer la première migration
alembic revision --autogenerate -m "create_initial_tables"

# Appliquer la migration
alembic upgrade head
```

**7. Lancer et tester**

```bash
cd /data/projets/jacigreen-platform/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Tester dans le navigateur : `http://localhost:8000/health`  
Swagger UI : `http://localhost:8000/docs`

#### PIÈGES À ÉVITER

```python
# ❌ Ne JAMAIS utiliser un engine synchrone avec FastAPI async
from sqlalchemy import create_engine  # MAUVAIS
engine = create_engine("postgresql://...")

# ✅ Toujours async
from sqlalchemy.ext.asyncio import create_async_engine
engine = create_async_engine("postgresql+asyncpg://...")
#                                         ^^^^^^^^ ce préfixe est obligatoire

# ❌ Ne pas oublier le .env dans /backend/ (pas à la racine)
# Le .env doit être dans /backend/ car uvicorn est lancé depuis /backend/

# ❌ Ne pas committer le .env
# Vérifier que .gitignore contient bien .env
```

---

### BLOC 5 — Frontend React Minimal

#### QUOI
Initialiser le projet React + TypeScript avec Vite, installer Leaflet, créer une carte centrée sur Niamey qui appelle `GET /health`.

#### POURQUOI
Avoir un feedback visuel dès le début du projet. Chaque module backend développé sera immédiatement visible sur la carte. Ça motive et permet de détecter les bugs d'API tôt.

#### COMMENT — Étapes exactes

```bash
cd /data/projets/jacigreen-platform/frontend

# Initialiser Vite + React + TypeScript
npm create vite@latest . -- --template react-ts

# Installer les dépendances
npm install
npm install leaflet react-leaflet
npm install @types/leaflet
npm install axios @tanstack/react-query zustand
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Composant carte (`src/components/map/MissionMap.tsx`)**

```tsx
// src/components/map/MissionMap.tsx
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Coordonnées Niamey, Niger
const NIAMEY_CENTER: [number, number] = [13.5137, 2.1168]

export function MissionMap() {
  return (
    <MapContainer
      center={NIAMEY_CENTER}
      zoom={13}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap contributors'
      />
    </MapContainer>
  )
}
```

**Page principale (`src/App.tsx`)**

```tsx
import { useEffect, useState } from 'react'
import { MissionMap } from './components/map/MissionMap'
import axios from 'axios'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('...')

  useEffect(() => {
    axios.get('http://localhost:8000/health')
      .then(r => setApiStatus(`✅ API OK — PostGIS ${r.data.postgis}`))
      .catch(() => setApiStatus('❌ API non joignable'))
  }, [])

  return (
    <div>
      <div style={{ padding: '8px 12px', background: '#1a1a1a', color: '#fff', fontSize: 12 }}>
        JACIGREEN DroneSurveillance | {apiStatus}
      </div>
      <MissionMap />
    </div>
  )
}

export default App
```

**Lancer le frontend**

```bash
cd /data/projets/jacigreen-platform/frontend
npm run dev
# Ouvrir : http://localhost:5173
```

#### PIÈGES À ÉVITER

```tsx
// ❌ Oublier d'importer le CSS Leaflet → carte sans styles
import { MapContainer } from 'react-leaflet'
// Sans : import 'leaflet/dist/leaflet.css' → les tuiles s'affichent mal

// ❌ Utiliser Leaflet côté serveur (SSR)
// Leaflet a besoin de window (DOM). Avec Vite c'est OK, mais avec Next.js
// il faudrait lazy-load le composant côté client uniquement.

// ❌ Mettre l'URL API en dur dans le code
axios.get('http://localhost:8000/health')  // Mauvais pour la prod

// ✅ Utiliser une variable d'environnement Vite
// .env.local : VITE_API_URL=http://localhost:8000
const apiUrl = import.meta.env.VITE_API_URL
axios.get(`${apiUrl}/health`)
```

---

## SEMAINE 2 — JOURS 6 à 10

### MODULE 1 — Import Photos + Extraction EXIF + Stockage

#### QUOI
Construire le pipeline complet d'import d'une photo drone :
1. L'utilisateur uploade des photos via l'interface web
2. FastAPI extrait automatiquement les coordonnées GPS depuis les métadonnées EXIF
3. L'image est stockée sur Supabase Storage (S3)
4. Les métadonnées (GPS, altitude, date) sont sauvegardées en PostgreSQL avec PostGIS
5. L'API retourne les photos géolocalisées

#### POURQUOI
C'est le **flux fondamental** du MVP. Sans import de photos géolocalisées, il n'y a pas de carte, pas de détection IA, pas de système. Tout part de là.

#### COMMENT — Étapes exactes

**1. Schéma Pydantic pour la validation**

```python
# backend/app/schemas/photo.py
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class PhotoResponse(BaseModel):
    id: UUID
    mission_id: UUID
    filename: str
    storage_url: str
    latitude: float
    longitude: float
    altitude_m: Optional[float]
    captured_at: Optional[datetime]
    source: str

    class Config:
        from_attributes = True
```

**2. Service d'extraction EXIF**

```python
# backend/app/services/exif_service.py
from PIL import Image
import piexif
import io
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class GpsData:
    latitude: float
    longitude: float
    altitude: Optional[float]
    captured_at: Optional[datetime]

def extract_gps(image_bytes: bytes) -> GpsData:
    """
    Extrait les coordonnées GPS depuis les métadonnées EXIF d'une image.
    Lève ValueError si aucune donnée GPS n'est trouvée.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif_raw = img.info.get("exif", b"")
        if not exif_raw:
            raise ValueError("Pas de données EXIF dans l'image")
        
        exif = piexif.load(exif_raw)
        gps = exif.get("GPS", {})
        
        if not gps:
            raise ValueError("Pas de données GPS dans l'EXIF")
        
        def dms_to_decimal(dms, ref):
            """Convertit Degrés/Minutes/Secondes en décimal."""
            d = dms[0][0] / dms[0][1]
            m = dms[1][0] / dms[1][1]
            s = dms[2][0] / dms[2][1]
            result = d + m / 60 + s / 3600
            if ref in [b'S', b'W']:
                result = -result
            return result
        
        lat = dms_to_decimal(
            gps[piexif.GPSIFD.GPSLatitude],
            gps[piexif.GPSIFD.GPSLatitudeRef]
        )
        lng = dms_to_decimal(
            gps[piexif.GPSIFD.GPSLongitude],
            gps[piexif.GPSIFD.GPSLongitudeRef]
        )
        
        # Altitude (optionnelle)
        altitude = None
        if piexif.GPSIFD.GPSAltitude in gps:
            alt_raw = gps[piexif.GPSIFD.GPSAltitude]
            altitude = alt_raw[0] / alt_raw[1]
        
        return GpsData(latitude=lat, longitude=lng, altitude=altitude, captured_at=None)
    
    except (KeyError, ZeroDivisionError, TypeError) as e:
        raise ValueError(f"Extraction GPS impossible : {e}")
```

**3. Endpoint upload photos**

```python
# backend/app/api/v1/routes/photos.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.elements import WKTElement
from uuid import UUID
from app.core.database import get_db
from app.services.exif_service import extract_gps
from app.models.photo import Photo

router = APIRouter(prefix="/missions/{mission_id}/photos", tags=["photos"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/tiff"}
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

@router.post("/", status_code=201)
async def upload_photos(
    mission_id: UUID,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    uploaded = []
    errors   = []

    for file in files:
        # Validation type MIME
        if file.content_type not in ALLOWED_TYPES:
            errors.append({"file": file.filename, "error": "Format non supporté (JPEG/PNG/TIFF)"})
            continue

        content = await file.read()

        # Validation taille
        if len(content) > MAX_SIZE_BYTES:
            errors.append({"file": file.filename, "error": "Fichier trop lourd (max 20MB)"})
            continue

        # Extraction GPS
        try:
            gps = extract_gps(content)
        except ValueError as e:
            errors.append({"file": file.filename, "error": str(e)})
            continue

        # TODO Semaine 2 : upload vers Supabase Storage
        storage_url = f"/tmp/{file.filename}"  # Placeholder MVP local

        # Point géospatial PostGIS (WGS84)
        point_wkt = WKTElement(
            f"POINT({gps.longitude} {gps.latitude})",
            srid=4326
        )

        photo = Photo(
            mission_id=mission_id,
            filename=file.filename,
            storage_url=storage_url,
            location=point_wkt,
            altitude_m=gps.altitude,
        )
        db.add(photo)
        uploaded.append(file.filename)

    await db.commit()

    return {
        "uploaded": len(uploaded),
        "errors": errors,
        "files": uploaded,
    }
```

**4. Tester l'extraction EXIF avec une vraie photo**

```python
# Script de test rapide (lancer depuis /backend avec venv activé)
# test_exif.py
from app.services.exif_service import extract_gps

with open("test_photo.jpg", "rb") as f:
    content = f.read()

try:
    gps = extract_gps(content)
    print(f"✅ Latitude  : {gps.latitude}")
    print(f"✅ Longitude : {gps.longitude}")
    print(f"✅ Altitude  : {gps.altitude}m")
except ValueError as e:
    print(f"❌ {e}")
```

**Prendre 5-10 photos avec son smartphone à Niamey et tester ce script.**  
Si ça marche → les photos drone marcheront aussi (même format EXIF).

#### PIÈGES À ÉVITER

```python
# ❌ Ne pas appeler await file.read() deux fois
content = await file.read()
content2 = await file.read()  # Retourne b"" ! Le stream est consommé.

# ✅ Lire une fois, réutiliser la variable
content = await file.read()
# Utiliser content partout ensuite

# ❌ Confondre latitude/longitude dans PostGIS
# PostGIS POINT(longitude latitude) — pas l'inverse !
WKTElement("POINT(13.5137 2.1168)", srid=4326)   # FAUX (lat, lng)
WKTElement("POINT(2.1168 13.5137)", srid=4326)   # CORRECT (lng, lat)

# ❌ Oublier de valider que la mission existe avant d'uploader
# Ajouter une vérification en DB : la mission_id doit exister
```

---

### MODULE 2 — Carte Interactive + GeoJSON

#### QUOI
- Endpoint `GET /missions/{id}/geojson` qui retourne toutes les photos d'une mission au format GeoJSON
- Affichage des marqueurs sur la carte Leaflet (clic → voir la photo)
- Tracé du chemin de vol (polyline reliant les photos dans l'ordre chronologique)
- Filtre par mission dans l'interface

#### POURQUOI
C'est le **livrable visible** pour Mariama MAMANE. Après ce module, elle peut voir exactement où son drone est passé et cliquer sur chaque photo. C'est ce qui démontre la valeur du système.

#### COMMENT

**1. Endpoint GeoJSON (backend)**

```python
# backend/app/api/v1/routes/missions.py
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.functions import ST_AsGeoJSON, ST_X, ST_Y
import json
from app.core.database import get_db
from app.models.photo import Photo

router = APIRouter(prefix="/missions", tags=["missions"])

@router.get("/{mission_id}/geojson")
async def get_mission_geojson(mission_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retourne les photos d'une mission au format GeoJSON.
    Compatible directement avec Leaflet L.geoJSON().
    """
    result = await db.execute(
        select(
            Photo.id,
            Photo.filename,
            Photo.storage_url,
            Photo.altitude_m,
            ST_X(Photo.location).label("longitude"),
            ST_Y(Photo.location).label("latitude"),
        )
        .where(Photo.mission_id == mission_id)
        .order_by(Photo.captured_at.asc())
    )
    photos = result.all()

    # Construction du GeoJSON FeatureCollection
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [photo.longitude, photo.latitude]
            },
            "properties": {
                "id": str(photo.id),
                "filename": photo.filename,
                "storage_url": photo.storage_url,
                "altitude_m": photo.altitude_m,
            }
        }
        for photo in photos
    ]

    return {
        "type": "FeatureCollection",
        "features": features,
        "meta": {"count": len(features), "mission_id": mission_id}
    }
```

**2. Affichage sur la carte (frontend)**

```tsx
// src/components/map/MissionMarkers.tsx
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'

interface Props {
  missionId: string
}

export function MissionMarkers({ missionId }: Props) {
  const map = useMap()

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/missions/${missionId}/geojson`)
      .then(({ data }) => {
        // Afficher les marqueurs
        const layer = L.geoJSON(data, {
          onEachFeature(feature, layer) {
            layer.bindPopup(`
              <b>${feature.properties.filename}</b><br/>
              Altitude : ${feature.properties.altitude_m ?? 'N/A'}m<br/>
              <img src="${feature.properties.storage_url}"
                   style="max-width:200px;margin-top:8px"/>
            `)
          }
        }).addTo(map)

        // Centrer la carte sur les données
        if (data.features.length > 0) {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] })
        }
      })
  }, [missionId, map])

  return null
}
```

---

## SEMAINE 3 — JOURS 11 à 15

### MODULE 3 — Pipeline IA (Celery + YOLOv8)

#### QUOI
- Installer et configurer Celery avec Redis comme broker
- Créer un worker qui télécharge les photos d'une mission et lance l'inférence YOLOv8
- Sauvegarder les détections en base de données avec leur géolocalisation
- Endpoint `POST /ai/analyze/{mission_id}` pour déclencher l'analyse
- Endpoint `GET /ai/tasks/{task_id}` pour suivre la progression

#### POURQUOI
C'est la **fonctionnalité différenciante** du MVP. Sans ça, la plateforme n'est qu'un gestionnaire de photos. L'IA transforme des photos brutes en informations actionnables (où exactement se trouve la jacinthe d'eau).

L'inférence YOLOv8 prend 2 à 10 secondes par image. Sur 50 photos : 5 minutes minimum. Il est **impossible** de faire ça de façon synchrone dans une requête HTTP (timeout à 30s). D'où Celery : traitement asynchrone en arrière-plan.

#### COMMENT

**1. Ajouter le worker au Docker Compose**

```yaml
# Ajouter dans docker-compose.yml
  worker:
    build: ./backend
    command: celery -A app.workers.ai_tasks worker --loglevel=info -Q ai
    environment:
      DATABASE_URL: postgresql+asyncpg://jacigreen:jacigreen_dev@db:5432/jacigreen
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
      - ./ai/models:/app/ai/models
```

**2. Configuration Celery**

```python
# backend/app/core/celery_app.py
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "jacigreen",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.ai_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Niamey",
    task_track_started=True,
    task_acks_late=True,        # Acknowledge seulement après succès
    worker_prefetch_multiplier=1,  # 1 tâche à la fois (inférence IA gourmande)
)
```

**3. Tâche Celery d'analyse IA**

```python
# backend/app/workers/ai_tasks.py
from celery import shared_task
from ultralytics import YOLO
import requests
import tempfile
import os

model = None  # Chargé une seule fois au démarrage du worker

def get_model():
    global model
    if model is None:
        model_path = os.getenv("AI_MODEL_PATH", "yolov8n.pt")
        model = YOLO(model_path)  # Téléchargement auto si absent
    return model

@shared_task(
    bind=True,
    name="ai.analyze_mission",
    max_retries=3,
    default_retry_delay=60,
)
def analyze_mission(self, mission_id: str):
    """
    Analyse toutes les photos d'une mission avec YOLOv8.
    Sauvegarde les détections en base de données.
    """
    from app.core.database import AsyncSessionLocal
    from app.models.photo import Photo
    from app.models.detection import Detection
    from sqlalchemy import select
    import asyncio

    async def _run():
        async with AsyncSessionLocal() as db:
            # 1. Récupérer les photos de la mission
            result = await db.execute(
                select(Photo).where(Photo.mission_id == mission_id)
            )
            photos = result.scalars().all()

            yolo = get_model()
            threshold = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.45"))

            for photo in photos:
                # 2. Télécharger l'image
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                    response = requests.get(photo.storage_url, timeout=30)
                    tmp.write(response.content)
                    tmp_path = tmp.name

                # 3. Inférence YOLOv8
                results = yolo(tmp_path)
                os.unlink(tmp_path)  # Nettoyer le fichier temporaire

                # 4. Sauvegarder les détections
                for result in results:
                    for box in result.boxes:
                        conf = float(box.conf)
                        if conf < threshold:
                            continue

                        detection = Detection(
                            photo_id=photo.id,
                            mission_id=mission_id,
                            species=yolo.names[int(box.cls)],
                            confidence=conf,
                            confidence_label=_confidence_label(conf),
                            bbox_x=int(box.xyxy[0][0]),
                            bbox_y=int(box.xyxy[0][1]),
                            bbox_width=int(box.xyxy[0][2] - box.xyxy[0][0]),
                            bbox_height=int(box.xyxy[0][3] - box.xyxy[0][1]),
                            location=photo.location,  # Même point que la photo
                            model_version="yolov8n-v1.0",
                        )
                        db.add(detection)

            await db.commit()

    asyncio.run(_run())
    return {"mission_id": mission_id, "status": "completed"}

def _confidence_label(conf: float) -> str:
    if conf >= 0.75: return "HIGH"
    if conf >= 0.50: return "MEDIUM"
    return "LOW"
```

**4. Endpoint pour déclencher et suivre l'analyse**

```python
# backend/app/api/v1/routes/ai.py
from fastapi import APIRouter
from app.workers.ai_tasks import analyze_mission

router = APIRouter(prefix="/ai", tags=["IA"])

@router.post("/analyze/{mission_id}")
async def trigger_analysis(mission_id: str):
    """Déclenche l'analyse IA en arrière-plan."""
    task = analyze_mission.delay(mission_id)
    return {"task_id": task.id, "status": "queued", "mission_id": mission_id}

@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Retourne le statut d'une tâche IA (pour le polling frontend)."""
    from app.core.celery_app import celery_app
    task = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task.status,        # PENDING, STARTED, SUCCESS, FAILURE
        "result": task.result if task.ready() else None,
    }
```

#### PIÈGES À ÉVITER

```python
# ❌ Charger le modèle YOLOv8 à chaque tâche
def analyze_mission(self, mission_id):
    model = YOLO("yolov8n.pt")  # 100MB rechargés à chaque fois !

# ✅ Charger une fois au niveau module (variable globale dans le worker)
model = None
def get_model():
    global model
    if model is None:
        model = YOLO("yolov8n.pt")
    return model

# ❌ Laisser les fichiers temporaires sur le disque
tmp_path = "/tmp/photo.jpg"
# Si le worker crash, le fichier reste

# ✅ Toujours utiliser try/finally pour nettoyer
try:
    results = yolo(tmp_path)
finally:
    os.unlink(tmp_path)

# ❌ worker_prefetch_multiplier trop élevé
# Celery va charger 4 tâches en même temps → OutOfMemory sur CPU avec YOLOv8
# ✅ Toujours mettre 1 pour l'inférence IA
celery_app.conf.worker_prefetch_multiplier = 1
```

---

## PARTIE 5 — CONVENTIONS ET RÈGLES DU PROJET

### Commits Git
```
feat(api): ajouter endpoint upload photos avec extraction EXIF
feat(map): afficher marqueurs détections sur carte Leaflet
fix(exif): corriger parsing GPS pour drones DJI
fix(ai): gérer les images sans canal alpha pour YOLOv8
chore(db): migration Alembic table detections
chore(deps): mettre à jour ultralytics 8.3.0
docs(readme): ajouter instructions démarrage backend
test(api): tests unitaires MissionRepository
```

### Branches Git
```
main          → code stable uniquement
develop       → intégration
feat/upload   → nouvelle fonctionnalité
fix/exif-gps  → correction de bug
```

### Structure des réponses API
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 50 }
}
```
```json
{
  "success": false,
  "error": { "code": "PHOTO_NO_GPS", "message": "Aucun GPS dans l'EXIF" }
}
```

### Variables d'environnement
- Jamais de secrets dans le code
- Toujours dans `.env` (non commité)
- Documenter dans `.env.example`
- Générer SECRET_KEY avec : `openssl rand -hex 32`

---

## PARTIE 6 — COMMANDES DE RÉFÉRENCE RAPIDE

```bash
# ── Docker ──────────────────────────────────────
docker compose up -d              # Démarrer services
docker compose ps                 # État des services
docker compose logs -f db         # Logs PostgreSQL en temps réel
docker compose down               # Arrêter (données conservées)
docker compose down -v            # Arrêter + supprimer données

# ── Backend ─────────────────────────────────────
cd /data/projets/jacigreen-platform/backend
source .venv/bin/activate
uvicorn app.main:app --reload     # Lancer l'API
celery -A app.workers.ai_tasks worker --loglevel=info  # Lancer worker

# ── Alembic (migrations DB) ──────────────────────
alembic revision --autogenerate -m "description"  # Créer migration
alembic upgrade head              # Appliquer migrations
alembic downgrade -1              # Revenir en arrière

# ── Frontend ─────────────────────────────────────
cd /data/projets/jacigreen-platform/frontend
npm run dev                       # Lancer frontend (port 5173)

# ── Base de données ──────────────────────────────
docker exec -it jacigreen_db psql -U jacigreen -d jacigreen
\dt                               # Lister les tables
\d missions                       # Décrire la table missions
SELECT COUNT(*) FROM photos;      # Compter les photos
```

---

## PARTIE 7 — POUR L'ASSISTANT IA QUI REPREND CE TRAVAIL

Si tu lis ce document pour aider Ismael, voici les points clés :

1. **Le projet est à** `/data/projets/jacigreen-platform/`
2. **Docker tourne** : PostgreSQL port 5432, Redis port 6379
3. **Le dev est junior-intermédiaire** en React/RN, découvre FastAPI, PostGIS et YOLOv8
4. **Expliquer comme à un dev qui veut devenir senior** : exemples concrets, erreurs à éviter, pourquoi ce choix
5. **L'objectif MVP** : import photos drone → carte interactive → détection jacinthe d'eau ≥ 50%
6. **Priorité au concret** : commandes exactes, code complet, pas de "voir la documentation"
7. **Ubuntu 24.04**, Python 3.12, Node 24, Docker 29
8. **Async partout** dans le backend FastAPI (SQLAlchemy async, asyncpg)
9. **PostGIS** : POINT(longitude latitude) — pas l'inverse
10. **Celery** : worker_prefetch_multiplier=1 pour l'inférence IA

---
*Document généré le Juin 2026 — À mettre à jour après chaque session de travail*
ENDDOC
