# JACIGREEN DroneSurveillance Platform

Système de surveillance par drone pour la détection des plantes envahissantes au Niger.

## Stack
- **Backend** : FastAPI · Python 3.12 · PostgreSQL + PostGIS · Redis · Celery
- **Frontend** : React · TypeScript · Vite · Leaflet
- **Mobile** : React Native · Expo
- **IA** : YOLOv8 · Ultralytics

## Démarrage rapide

```bash
cp .env.example .env
docker compose up -d
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Structure
jacigreen-platform/
├── backend/     # FastAPI API
├── frontend/    # React web app
├── mobile/      # React Native Expo
├── ai/          # Notebooks + modèles YOLOv8
└── docker-compose.yml