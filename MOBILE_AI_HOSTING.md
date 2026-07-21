# Mobile, IA Training & Hosting Gratuit - Guide Complet

## 🚀 Partie 1 : Démarrer avec Mobile (React Native + Expo)

### 1.1 Setup Initial Expo

**Prérequis**:
- Node.js 18+
- Expo CLI
- Smartphone iOS/Android

**Installation**:
```bash
cd /data/projets/jacigreen-platform.worktrees/copilot-worktree-2026-07-18T23-25-29
npx create-expo-app mobile --template  # Si besoin reset
cd mobile
npm install
```

**Démarrer**:
```bash
npm start
# Scan QR code avec Expo Go (App Store / Play Store)
```

### 1.2 Structure Mobile Offline-First

```
mobile/
├── app/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── MissionsScreen.tsx        # Liste offline
│   │   ├── MissionDetailScreen.tsx
│   │   ├── CameraScreen.tsx          # Photo capture
│   │   ├── SyncScreen.tsx            # Upload batch
│   │   └── SettingsScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # Stack navigation
│   │   └── BottomTabNavigator.tsx
│   ├── components/
│   │   ├── OfflineBadge.tsx
│   │   └── SyncStatus.tsx
│   ├── services/
│   │   ├── database.ts               # SQLite local
│   │   ├── syncService.ts            # Batch upload
│   │   └── apiClient.ts              # With token management
│   ├── context/
│   │   ├── AuthContext.tsx           # Auth state
│   │   └── SyncContext.tsx           # Sync state
│   └── App.tsx
├── assets/
├── package.json
└── app.json
```

### 1.3 Librairies Essentielles

```bash
npm install @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install expo-camera expo-location expo-image-picker
npm install expo-sqlite                          # Local DB
npm install react-native-maps                    # Maps
npm install axios                                # HTTP client
npm install date-fns                             # Date utils
```

### 1.4 SQLite Local Storage

**File**: `mobile/app/services/database.ts`

```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('jacigreen.db');

export const initDB = async () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS missions (
          id INTEGER PRIMARY KEY,
          remote_id INTEGER UNIQUE,
          title TEXT NOT NULL,
          description TEXT,
          zone_geojson TEXT,
          status TEXT DEFAULT 'pending',
          synced INTEGER DEFAULT 0,
          created_at TEXT,
          updated_at TEXT
        );`,
        [],
        () => resolve(true),
        (_, error) => reject(error)
      );
      
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS photos (
          id INTEGER PRIMARY KEY,
          mission_id INTEGER,
          filename TEXT,
          uri TEXT,
          exif_json TEXT,
          latitude REAL,
          longitude REAL,
          synced INTEGER DEFAULT 0,
          created_at TEXT
        );`,
        [],
        () => console.log('Photos table created'),
        (_, error) => console.error('Error creating photos table:', error)
      );
    });
  });
};

export const saveMissionLocally = (mission: any) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT OR REPLACE INTO missions (remote_id, title, description, zone_geojson, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [mission.id, mission.title, mission.description, JSON.stringify(mission.zone), mission.status, new Date().toISOString()],
        () => resolve(true),
        (_, error) => reject(error)
      );
    });
  });
};

export const getLocalMissions = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM missions ORDER BY created_at DESC',
        [],
        (_, result) => resolve(result.rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

export const savePhotoLocally = (photo: any) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO photos (mission_id, filename, uri, exif_json, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [photo.mission_id, photo.filename, photo.uri, JSON.stringify(photo.exif), photo.latitude, photo.longitude, new Date().toISOString()],
        () => resolve(true),
        (_, error) => reject(error)
      );
    });
  });
};

export const getUnsyncedPhotos = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM photos WHERE synced = 0',
        [],
        (_, result) => resolve(result.rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

export const markPhotoSynced = (photoId: number) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE photos SET synced = 1 WHERE id = ?',
        [photoId],
        () => resolve(true),
        (_, error) => reject(error)
      );
    });
  });
};
```

### 1.5 Sync Service (Batch Upload)

**File**: `mobile/app/services/syncService.ts`

```typescript
import axios, { AxiosError } from 'axios';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUnsyncedPhotos, markPhotoSynced } from './database';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const syncPhotos = async (missionId: number): Promise<{ success: boolean; uploaded: number; failed: number }> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const unsyncedPhotos = await getUnsyncedPhotos();
    
    if (!unsyncedPhotos.length) {
      return { success: true, uploaded: 0, failed: 0 };
    }
    
    let uploaded = 0;
    let failed = 0;
    
    for (const photo of unsyncedPhotos) {
      if (photo.mission_id !== missionId) continue;
      
      try {
        const formData = new FormData();
        const fileData = await FileSystem.readAsStringAsync(photo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        formData.append('file', {
          uri: photo.uri,
          name: photo.filename,
          type: 'image/jpeg',
        } as any);
        
        formData.append('latitude', photo.latitude);
        formData.append('longitude', photo.longitude);
        
        const response = await axios.post(
          `${API_BASE_URL}/missions/${missionId}/photos`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        if (response.status === 201) {
          await markPhotoSynced(photo.id);
          uploaded++;
        }
      } catch (error) {
        console.error(`Failed to upload photo ${photo.filename}:`, error);
        failed++;
      }
    }
    
    return { success: true, uploaded, failed };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, uploaded: 0, failed: 0 };
  }
};

export const isOnline = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
    return response.status === 200;
  } catch {
    return false;
  }
};
```

### 1.6 Camera Integration

**File**: `mobile/app/screens/CameraScreen.tsx`

```typescript
import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { savePhotoLocally } from '../services/database';

export const CameraScreen = ({ route, navigation }: any) => {
  const cameraRef = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { missionId } = route.params;

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      setLoading(true);
      const result = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      
      // Get location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Save to local DB
      await savePhotoLocally({
        mission_id: missionId,
        filename: `photo_${Date.now()}.jpg`,
        uri: result.uri,
        exif: {
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        },
        latitude,
        longitude,
      });
      
      setPhoto(result);
    } catch (error) {
      console.error('Camera error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {photo && (
          <Image source={{ uri: photo.uri }} style={styles.preview} />
        )}
      </CameraView>
      
      <TouchableOpacity
        style={styles.button}
        onPress={takePicture}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Capturing...' : 'Take Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  preview: { width: 200, height: 200 },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
```

---

## 🤖 Partie 2 : Entrainement YOLOv8 - Guide Pratique

### 2.1 Setup Dataset

**Dossier structure**:
```
ai/datasets/
├── jacinthe_eau/                    # Classe principale
│   ├── train/
│   │   ├── images/                  # *.jpg, *.png
│   │   └── labels/                  # *.txt (format YOLO)
│   ├── val/
│   │   ├── images/
│   │   └── labels/
│   └── test/
│       ├── images/
│       └── labels/
└── data.yaml                        # Config YOLO
```

**Format labels YOLO** (fichier `.txt`):
```
# Pour une image avec N detections:
# class_id center_x center_y width height
# (coordonnées normalisées 0-1, relatif image size)

0 0.45 0.50 0.30 0.40
0 0.70 0.65 0.25 0.35
```

**Créer `ai/datasets/data.yaml`**:
```yaml
path: /data/projets/jacigreen-platform.worktrees/copilot-worktree-2026-07-18T23-25-29/ai/datasets/jacinthe_eau
train: train/images
val: val/images
test: test/images

nc: 1
names: ['jacinthe_eau']
```

### 2.2 Sources Dataset Public

**Rechercher images jacinthe d'eau**:
1. **Roboflow** (https://roboflow.com)
   - Plateforme collaborative pour datasets
   - Télécharger dataset publics directement en format YOLO
   - Community: "water hyacinth detection"

2. **ImageNet / COCO**
   - Télécharger images brutes, annoter avec labelImg

3. **Google Images + Web Scraping**
   - Télécharger ~500 images jacinthe d'eau
   - Annoter avec **LabelImg** (gratuit, open-source)

**LabelImg setup**:
```bash
pip install labelimg
labelimg ai/datasets/jacinthe_eau/train/images
# Créer bounding boxes, sauver format YOLO
```

### 2.3 Fine-tuning YOLOv8 sur Colab (Recommandé)

**Avantages Colab**:
- GPU gratuit (T4, P100)
- Pas d'install locale
- Sauvegarde résultats en Drive
- ~1h fine-tuning

**Notebook Colab**:
```python
# 1. Setup
!pip install -q ultralytics opencv-python matplotlib

# 2. Télécharger dataset local (via Git ou upload)
!git clone https://github.com/your-repo/jacigreen-platform.git
cd jacigreen-platform/ai/datasets

# 3. Fine-tuning
from ultralytics import YOLO
import torch

print(f"GPU available: {torch.cuda.is_available()}")
print(f"GPU name: {torch.cuda.get_device_name(0)}")

# Charger modèle nano pré-entraîné
model = YOLO('yolov8n.pt')

# Fine-tuning
results = model.train(
    data='data.yaml',
    epochs=100,
    imgsz=640,
    batch=32,
    patience=20,
    device=0,                    # GPU
    project='runs',
    name='jacinthe_v1',
    augment=True,
    mosaic=1.0,
    flipud=0.3,
    fliplr=0.5,
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
    degrees=10,
    translate=0.1,
    scale=0.5,
)

# 4. Validation
metrics = model.val()
print(f"mAP50: {metrics.box.map50:.3f}")
print(f"Precision: {metrics.box.p.mean():.3f}")
print(f"Recall: {metrics.box.r.mean():.3f}")

# 5. Exporter en ONNX
model.export(format='onnx')
print("Model exported to runs/detect/jacinthe_v1/weights/best.onnx")

# 6. Test sur image
predictions = model.predict('test_image.jpg', conf=0.5)
predictions[0].show()
```

**Sauvegarder modèle**:
- Télécharger depuis Colab: `runs/detect/jacinthe_v1/weights/best.pt`
- Aussi: `best.onnx` (légèrement plus léger)

### 2.4 Fine-tuning Local (Alternative)

**Si pas de GPU**:
```bash
pip install ultralytics opencv-python matplotlib

python << 'EOF'
from ultralytics import YOLO

model = YOLO('yolov8n.pt')
results = model.train(
    data='ai/datasets/data.yaml',
    epochs=100,
    imgsz=640,
    batch=16,  # Réduit pour CPU
    patience=20,
    device='cpu',  # Lent mais possible
    project='ai/runs',
    name='jacinthe_v1_local',
)
EOF

# Prendra ~12h sur CPU modern
```

### 2.5 Validation & Métriques

**Tester modèle**:
```python
from ultralytics import YOLO

model = YOLO('runs/detect/jacinthe_v1/weights/best.pt')

# Sur test set
metrics = model.val(data='ai/datasets/data.yaml', split='test')
print(f"mAP50:95: {metrics.box.map:.3f}")
print(f"mAP50: {metrics.box.map50:.3f}")
print(f"Precision: {metrics.box.p.mean():.3f}")
print(f"Recall: {metrics.box.r.mean():.3f}")

# Inférence exemple
result = model.predict('ai/datasets/jacinthe_eau/test/images/example.jpg', conf=0.5)
# Voir bounding boxes
result[0].show()
```

**Critères MVP**:
- mAP50 ≥ 0.50
- Precision ≥ 0.60
- Recall ≥ 0.55
- Peu faux positifs sur eau claire

### 2.6 Intégration Backend Celery

**File**: `backend/app/workers/ai_service.py`

```python
from celery import shared_task
from ultralytics import YOLO
import cv2
import numpy as np
from app.db.session import SessionLocal
from app.models import Detection, Photo

model = YOLO('ai/models/best.pt')

@shared_task(bind=True, max_retries=3)
def run_detection(self, photo_id: int):
    """Detect objects in photo using YOLOv8"""
    db = SessionLocal()
    try:
        photo = db.query(Photo).filter(Photo.id == photo_id).first()
        if not photo:
            raise Exception(f"Photo {photo_id} not found")
        
        # Read image
        image = cv2.imread(photo.storage_key)
        if image is None:
            raise Exception(f"Failed to read image {photo.storage_key}")
        
        # Run inference
        results = model.predict(source=image, conf=0.5, verbose=False)
        
        # Save detections
        for result in results:
            for box in result.boxes:
                detection = Detection(
                    photo_id=photo_id,
                    class_id=int(box.cls[0]),
                    class_name='jacinthe_eau',
                    confidence=float(box.conf[0]),
                    bbox_x=float(box.xyxy[0][0]),
                    bbox_y=float(box.xyxy[0][1]),
                    bbox_width=float(box.xyxy[0][2] - box.xyxy[0][0]),
                    bbox_height=float(box.xyxy[0][3] - box.xyxy[0][1]),
                )
                db.add(detection)
        
        photo.status = 'processed'
        db.commit()
        return {'status': 'success', 'detections': len(results[0].boxes) if results else 0}
        
    except Exception as exc:
        print(f"Detection task failed: {exc}")
        self.retry(exc=exc, countdown=60)
    finally:
        db.close()
```

**Appeler depuis API**:
```python
# File: backend/app/api/v1/routes/photos.py
from app.workers.ai_service import run_detection

@router.post("/missions/{mission_id}/photos", response_model=PhotoResponse)
async def upload_photo(
    mission_id: int,
    file: UploadFile,
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
):
    photo = Photo(
        mission_id=mission_id,
        filename=file.filename,
        latitude=latitude,
        longitude=longitude,
        status='uploaded'
    )
    db.add(photo)
    db.commit()
    
    # Déclencher détection async
    run_detection.delay(photo.id)
    
    return photo
```

---

## 🚀 Partie 3 : Hébergement Gratuit

### 3.1 Architecture Hébergement Gratuit

```
┌─────────────┐         ┌──────────────┐        ┌─────────────┐
│ Netlify     │         │ Railway.app   │        │ Supabase    │
│ (Frontend)  │────────▶│ (Backend)     │───────▶│ (DB + File) │
│ FREE tier   │         │ FREE tier     │        │ FREE tier   │
└─────────────┘         └──────────────┘        └─────────────┘
```

### 3.2 Backend sur Railway.app

**Avantages**:
- 500h compute gratuit/mois
- PostgreSQL gratuit
- Redis gratuit
- Déploiement facile depuis Git
- Logs temps réel

**Setup**:
1. Créer compte https://railway.app
2. Connect GitHub repo
3. Ajouter variables env:
   ```
   DATABASE_URL=postgresql://...  (Railway génère auto)
   REDIS_URL=redis://...          (Railway génère auto)
   SECRET_KEY=... (générer avec openssl rand -hex 32)
   ```
4. Deploy automatique à chaque push

**Backend `Procfile`** (déjà existe):
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
worker: celery -A app.workers.celery_app worker --loglevel=info
```

### 3.3 Frontend sur Netlify

**Avantages**:
- Déploiement gratuit illimité
- SSL gratuit
- CDN global
- ~300s build time gratuit/mois

**Setup**:
1. Créer compte https://netlify.com
2. Connect GitHub repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Environment:
   ```
   VITE_API_URL=https://your-backend.railway.app/api/v1
   ```
6. Deploy automatique

**File**: `frontend/.netlify/netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
```

### 3.4 Database sur Supabase

**Avantages**:
- PostgreSQL + PostGIS gratuit
- 500MB storage gratuit
- Storage files (pour photos) 1GB gratuit
- Real-time subscriptions gratuit
- Auth gratuit

**Setup**:
1. Créer compte https://supabase.com
2. Créer project (PostgreSQL 15 + PostGIS)
3. Récupérer credentials:
   ```
   DATABASE_URL=postgresql://[user]:[password]@db.[project].supabase.co:5432/postgres
   SUPABASE_KEY=eyJ...
   ```
4. Créer bucket storage pour photos:
   ```
   Name: photos
   Public: No (signed URLs)
   ```
5. Migrer schema Alembic:
   ```bash
   export DATABASE_URL="postgresql://..."
   alembic upgrade head
   ```

### 3.5 Domaine Gratuit

**Options**:
- **Freenom** (.tk, .ml, .ga)
  ```
  railway.app → custom domain
  Ajouter DNS CNAME
  ```
- **No-IP** (dynamic DNS)
- **Ngrok** (tunneling local)

### 3.6 Monitoring Gratuit

**Uptime monitoring**:
- **UptimeRobot** (free tier)

**Logs**:
- Railway logs intégrés
- Supabase logs

**Performance**:
- Netlify analytics gratuit

---

## ✅ Checklist Déploiement

- [ ] Backend sur Railway.app
- [ ] Database Supabase avec migrations
- [ ] Frontend sur Netlify
- [ ] Domaine custom configuré
- [ ] CORS configuré par domaine
- [ ] HTTPS vérifié
- [ ] Variables env produites
- [ ] Secrets hors du code
- [ ] Tests end-to-end en prod
- [ ] Monitoring actif

---

## 📞 Troubleshooting

### Problème: "Cors error in frontend"
**Solution**: Vérifier CORS backend
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourfrontend.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problème: "Photos not loading on map"
**Solution**: Vérifier CORS storage Supabase + signed URLs

### Problème: "YOLOv8 model too slow"
**Solution**: Utiliser nano (yolov8n), exporter ONNX, reducer batch size

---

**Next Steps**: 
1. Clone repo + setup local
2. Créer comptes Railway + Supabase + Netlify
3. Pousser code (déploiement auto)
4. Configurer domaine custom
5. Test prod et itérer
