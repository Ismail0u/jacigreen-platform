import asyncio
from datetime import datetime
from pathlib import Path
from uuid import UUID

from sqlalchemy import select, update

from app.core.celery_app import celery_app
from app.core.config import ROOT_DIR, settings
from app.core.database import AsyncSessionLocal, engine  # Import de l'engine ajouté ici
from app.models.ai_analysis_task import AIAnalysisTask
from app.models.detection import Detection
from app.models.mission import Mission
from app.models.photo import Photo

_strategy = None


def _model_path() -> Path:
    path = Path(settings.AI_MODEL_PATH)
    if path.is_absolute():
        return path
    return ROOT_DIR / path


def get_strategy():
    global _strategy
    if _strategy is not None:
        return _strategy

    model_path = _model_path()
    if model_path.suffix.lower() == ".onnx":
        from app.services.ai.detection_strategy import ONNXStrategy
        _strategy = ONNXStrategy(model_path)
    else:
        from app.services.ai.detection_strategy import YOLOv8Strategy
        _strategy = YOLOv8Strategy(model_path)
    return _strategy


async def _read_image_bytes(storage_url: str) -> bytes:
    if storage_url.startswith("/storage/"):
        storage_path = Path(__file__).resolve().parents[2] / storage_url.lstrip("/")
        return storage_path.read_bytes()

    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get(storage_url, timeout=30)
        response.raise_for_status()
        return response.content


def _confidence_label(confidence: float) -> str:
    if confidence >= 0.75:
        return "HIGH"
    if confidence >= 0.50:
        return "MEDIUM"
    return "LOW"


@celery_app.task(
    bind=True,
    name="ai.analyze_mission",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def analyze_mission(self, mission_id: str):
    """
    Point d'entrée synchrone Celery exécutant la logique de boucle asynchrone.
    """
    global _strategy
    # 1. Reset de la stratégie globale pour détruire les liens avec une boucle précédente
    _strategy = None

    # 2. CRITIQUE : Force l'engine SQLAlchemy à jeter le pool de connexions lié à l'ancienne boucle.
    # Les prochaines requêtes ouvriront de nouvelles connexions saines sur la nouvelle boucle.
    asyncio.run(engine.dispose(close=False))

    # 3. Exécution isolée et sécurisée via asyncio.run
    return asyncio.run(_async_analyze(mission_id, self.request.id))


async def _async_analyze(mission_id: str, celery_task_id: str | None = None) -> dict:
    mission_uuid = UUID(mission_id)
    threshold = float(settings.AI_CONFIDENCE_THRESHOLD)
    strategy = get_strategy()

    async with AsyncSessionLocal() as db:
        mission = await db.get(Mission, mission_uuid)
        if mission is None:
            raise ValueError(f"Mission introuvable: {mission_id}")

        task_row = None
        if celery_task_id:
            result = await db.execute(
                select(AIAnalysisTask).where(AIAnalysisTask.celery_task_id == celery_task_id)
            )
            task_row = result.scalar_one_or_none()

        if task_row is not None:
            task_row.status = "STARTED"
            task_row.model_version = strategy.model_version

        await db.execute(
            update(Mission)
            .where(Mission.id == mission_uuid)
            .values(status="processing")
        )
        await db.commit()

        try:
            result = await db.execute(select(Photo).where(Photo.mission_id == mission_uuid))
            photos = result.scalars().all()

            loop = asyncio.get_running_loop()

            for photo in photos:
                image_bytes = await _read_image_bytes(photo.storage_url)
                
                # Exécution de l'inférence CPU/GPU synchrone dans un thread séparé
                detections_raw = await loop.run_in_executor(
                    None, strategy.detect, image_bytes, threshold
                )

                for detection_raw in detections_raw:
                    x1, y1, x2, y2 = detection_raw["bbox_xyxy"]
                    confidence = float(detection_raw["confidence"])
                    db.add(
                        Detection(
                            photo_id=photo.id,
                            mission_id=mission_uuid,
                            species=detection_raw.get("species", "jacinthe_eau"),
                            confidence=confidence,
                            confidence_label=_confidence_label(confidence),
                            bbox_x=int(x1),
                            bbox_y=int(y1),
                            bbox_width=int(x2 - x1),
                            bbox_height=int(y2 - y1),
                            location=photo.location,
                            model_version=strategy.model_version,
                        )
                    )

            await db.execute(
                update(Mission)
                .where(Mission.id == mission_uuid)
                .values(status="completed", completed_at=datetime.utcnow())
            )
            if task_row is not None:
                task_row.status = "SUCCESS"
                task_row.completed_at = datetime.utcnow()
            await db.commit()
            
        except Exception as exc:
            await db.execute(
                update(Mission)
                .where(Mission.id == mission_uuid)
                .values(status="failed")
            )
            if task_row is not None:
                task_row.status = "FAILURE"
                task_row.completed_at = datetime.utcnow()
                task_row.error_message = str(exc)
            await db.commit()
            raise

    return {"mission_id": mission_id, "status": "completed"}