from sqlalchemy import text
from fastapi import APIRouter

from app.core.database import engine

router = APIRouter()

@router.get("/health", tags=["Health"])
async def health_check():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT PostGIS_Version()"))
        postgis_version = result.scalar()
    return {
        "status": "ok",
        "api": "JACIGREEN DroneSurveillance v1.0",
        "database": "connected",
        "postgis": postgis_version,
    }
