# Documentation JACIGREEN DroneSurveillance

## 1. Vue d'ensemble

`JACIGREEN DroneSurveillance` est une plateforme de surveillance par drone pour détecter et cartographier des plantes envahissantes.

- **Backend** : FastAPI + Python 3.12
- **Base de données** : PostgreSQL + PostGIS
- **Cache / Queue** : Redis
- **Frontend** : React + TypeScript + Vite + Leaflet
- **Mobile** : Expo / React Native (scaffold initial)
- **IA** : YOLOv8 pour la détection d’objets


## 2. État actuel du projet

### 2.1 Infrastructure

- Docker Compose opérationnel avec :
  - PostgreSQL 15 + PostGIS 3.3
  - Redis 7
- Vérification PostGIS : `SELECT PostGIS_Version();` réussie
- Vérification Redis : `PONG`
- `.env.example` créé et prêt à être dupliqué en `.env`

### 2.2 Backend

- FastAPI installé et structuré dans `backend/app/`
- Endpoint `GET /api/v1/health` existant
- Routes missions et photos présentes
- Endpoints supportés :
  - `GET /api/v1/missions`
  - `GET /api/v1/missions/{mission_id}`
  - `POST /api/v1/missions`
  - `PUT /api/v1/missions/{mission_id}`
  - `DELETE /api/v1/missions/{mission_id}`
  - `GET /api/v1/missions/{mission_id}/geojson`
  - `GET /api/v1/missions/{mission_id}/flightpath`
  - `GET /api/v1/photos`
  - `GET /api/v1/photos/{photo_id}`
  - `POST /api/v1/photos`
  - `PUT /api/v1/photos/{photo_id}`
  - `DELETE /api/v1/photos/{photo_id}`
- SQLAlchemy + async PG configurés
- Modèles pour `Mission`, `Photo`, `User`, `Zone`, `Detection`, `AIAnalysisTask`
- Alembic initialisé et migration de base appliquée

### 2.3 Frontend

- React + Vite initialisé
- Composants Leaflet existants :
  - `MissionMap`
  - `MissionSelector`
  - `MissionDetails`
  - `MapAutoFit`
- Cartographie GeoJSON présente
- Build frontend validée

### 2.4 Mobile

- Structure Expo initialisée dans `mobile/`
- Prototype React Native minimal créé

### 2.5 IA

- Documentation de la stratégie IA ajoutée
- Plan de fine-tuning YOLOv8n défini
- Aucun modèle entraîné ou intégré en backend pour l’instant


## 3. Ce qui reste à faire

### 3.1 Priorités immédiates

1. **Valider le runtime backend**
   - Tester `GET /api/v1/health`
   - Créer une mission test via l’API
   - Vérifier l’endpoint GeoJSON

2. **Corriger les validations du backend**
   - vérifier l’existence d’une mission avant l’upload photo
   - gérer les erreurs foreign key proprement
   - standardiser les URLs de stockage

3. **Lancer le frontend visible**
   - vérifier la carte Leaflet en local
   - afficher la mission sélectionnée
   - charger les données via `VITE_API_URL`

4. **Lancer le pipeline IA**
   - préparer dataset YOLO
   - fine-tuner YOLOv8n
   - exporter un modèle entraîné

### 3.2 Moyenne échéance

- Upload photo + extraction EXIF
- Stockage des photos vers Supabase / S3-compatible
- Worker Celery pour l’inférence IA
- Enregistrement des détections en DB
- Visualisation des résultats sur la carte

### 3.3 Long terme MVP

- authentification JWT
- page missions complète
- mobile offline / sync
- tests automatisés backend et frontend
- déploiement Docker complet


## 4. Architecture technique

### 4.1 Backend

- `backend/app/main.py` : configuration FastAPI, CORS, routes
- `backend/app/core/config.py` : variables d’environnement
- `backend/app/core/database.py` : SQLAlchemy async + PostGIS
- `backend/app/api/deps.py` : dépendances FastAPI
- `backend/app/api/v1/routes/` : routes REST
- `backend/app/models/` : ORM SQLAlchemy
- `backend/app/schemas/` : Pydantic
- `backend/app/services/` : logique métier (à remplir)
- `backend/app/workers/` : Celery / AI tasks

### 4.2 Frontend

- `frontend/src/App.tsx` : point d’entrée
- `frontend/src/components/` : composants réutilisables
- `frontend/src/App.css` : styles globaux
- `frontend/src/main.tsx` : initialisation React + Leaflet

### 4.3 Données géospatiales

- utiliser `SRID=4326`
- stocker `POINT(longitude latitude)` dans PostGIS
- exposer GeoJSON compatible Leaflet
- vérifier toujours l’ordre `longitude, latitude` dans les réponses

### 4.4 Stockage objet

- stocker les photos dans Supabase Storage ou S3-compatible
- conserver `storage_key` en base et générer l’URL signée à la demande
- ne pas stocker de chemin local dans la DB


## 5. Plan IA et fine-tuning YOLO

### 5.1 Stratégie recommandée

- utiliser `yolov8n.pt` pré-entraîné
- faire du **fine-tuning** sur la classe `jacinthe_eau`
- éviter l’entraînement from scratch
- prioriser le dataset existant plutôt que l’architecture
- exporter en ONNX pour le backend léger

### 5.2 Organisation du dataset

Structure recommandée :

```
ai/datasets/
  train/
    images/
    labels/
  val/
    images/
    labels/
  test/
    images/
    labels/
```

Fichier de config YOLO :

```yaml
path: ai/datasets
train: train/images
val: val/images
test: test/images
nc: 1
names: ["jacinthe_eau"]
```

### 5.3 Entraînement rapide

#### Sur Google Colab

```bash
pip install ultralytics opencv-python matplotlib
```

```python
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
model.train(
    data='ai/datasets/yolov8_data.yaml',
    epochs=50,
    imgsz=640,
    batch=16,
    augment=True,
    mosaic=1.0,
    flipud=0.3,
    fliplr=0.5,
    project='ai/runs',
    name='jacinthe_v1',
    patience=10,
    device='cuda',
)
```

#### Sur Kaggle

- utile pour experimentation rapide
- bon pour versionner un dataset simple
- limité à ~9 heures de session

### 5.4 Validation

- tester sur un jeu `test/` séparé
- mesurer `mAP50`, `precision`, `recall`
- vérifier les faux positifs sur eau claire
- corriger le modèle avec 30-50 images Niamey réelles si nécessaire

### 5.5 Intégration backend

- placer le modèle dans `ai/models/`
- créer un service IA dans `backend/app/services/`
- utiliser un worker Celery pour l’inférence
- enregistrer les boîtes dans la table `Detection`
- exposer un endpoint de résultat / tâches


## 6. Roadmap des 2-3 prochaines semaines

### Semaine 1

- validation de l’infrastructure Docker
- backend FastAPI minimal en runtime
- frontend Leaflet basique fonctionnel
- test de l’API `/health`

### Semaine 2

- upload photo + extraction EXIF
- stockage objet + metadata en DB
- endpoint GeoJSON pour map
- première intégration IA (worker Celery)

### Semaine 3

- fine-tuning YOLOv8
- export ONNX
- intégration IA dans backend
- visualisation des détections sur la carte
- tests end-to-end


## 7. Recommandations pratiques

- prioriser le résultat visible plutôt que le code parfait
- valider chaque étape en runtime
- ne pas attendre le dataset parfait pour démarrer l’intégration
- garder les secrets hors du repo
- documenter les choix d’architecture dans `ma_doc.md`


## 8. Résumé d’action immédiate

1. vérifier le backend runtime et API health
2. corriger les validations mission/photo sur le backend
3. démarrer le dataset YOLO et le fine-tuning
4. intégrer le modèle dans le backend via worker
5. afficher les résultats sur la carte Leaflet


---

> Ce document décrit l’état actuel du projet, la stratégie IA, les prochaines étapes et les bons réflexes pour transformer JACIGREEN en MVP exploitable.
