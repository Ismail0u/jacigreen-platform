from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.v1.routes import router as api_router
from app.core.config import settings
from app.core.database import engine
from app.core.error_handlers import install_error_handlers

"""
Main application entry point for the JACIGREEN DroneSurveillance API.
This module initializes the FastAPI application, configures middleware, mounts static file directories, and includes
 the API router for version 1 of the API. It also provides health check and root endpoints to verify the application's status.
 Endpoints: 
 - GET /: Returns basic project information and status.
 - GET /health: Performs a health check on the API and database connection, returning the status and PostGIS version.
"""
app = FastAPI(
    title="JACIGREEN DroneSurveillance API",
    description="API de surveillance drone et détection de plantes envahissantes",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
install_error_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

storage_path = Path(__file__).resolve().parents[1] / "storage"
app.mount("/storage", StaticFiles(directory=str(storage_path)), name="storage")

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "project": "JACIGREEN",
        "status": "running",
    }


@app.get("/health")
async def health():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT PostGIS_Version()"))
        postgis_version = result.scalar()

    return {
        "status": "ok",
        "api": "JACIGREEN DroneSurveillance v1.0",
        "database": "connected",
        "postgis": postgis_version,
    }
