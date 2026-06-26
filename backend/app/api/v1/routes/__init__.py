from fastapi import APIRouter

from app.api.v1.routes.ai import router as ai_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.missions import router as missions_router
from app.api.v1.routes.photos import router as photos_router

router = APIRouter()
router.include_router(ai_router)
router.include_router(health_router)
router.include_router(missions_router)
router.include_router(photos_router)
