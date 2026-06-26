import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.celery_app import celery_app
from app.core.config import settings
from app.models.ai_analysis_task import AIAnalysisTask
from app.models.mission import Mission
from app.services.detection_geojson import mission_detections_geojson
from app.workers.ai_tasks import analyze_mission


router = APIRouter(prefix="/ai", tags=["IA"])


@router.post("/analyze/{mission_id}", status_code=status.HTTP_202_ACCEPTED)
async def trigger_analysis(mission_id: UUID, db: AsyncSession = Depends(get_db)):
    mission = await db.get(Mission, mission_id)
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable")

    task_id = str(uuid.uuid4())
    db.add(
        AIAnalysisTask(
            celery_task_id=task_id,
            mission_id=mission_id,
            status="PENDING",
            confidence_threshold=settings.AI_CONFIDENCE_THRESHOLD,
        )
    )
    await db.commit()

    task = analyze_mission.apply_async(args=[str(mission_id)], task_id=task_id)

    return {"task_id": task.id, "status": "queued", "mission_id": str(mission_id)}


@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    task = celery_app.AsyncResult(task_id)
    result = task.result if task.ready() and task.successful() else None
    error = str(task.result) if task.failed() else None
    return {
        "task_id": task_id,
        "status": task.status,
        "result": result,
        "error": error,
    }


@router.get("/missions/{mission_id}/detections")
async def get_ai_mission_detections(mission_id: UUID, db: AsyncSession = Depends(get_db)):
    mission = await db.get(Mission, mission_id)
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable")

    return await mission_detections_geojson(db, mission_id)
