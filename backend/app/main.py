from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.routes import router as api_router
from app.core.config import settings
from app.core.database import engine

"""
Main application setup for JACIGREEN DroneSurveillance API.
This module initializes the FastAPI application, configures CORS middleware, and includes the API routes
defined in the app.api.v1.routes package. It also defines a root endpoint for basic health checks and a /health endpoint that checks the database connection and retrieves the PostGIS version.
The application is configured with metadata such as title, description, version, and documentation URLs for API"""
app = FastAPI(
    title="JACIGREEN DroneSurveillance API",
    description="API de surveillance drone et détection de plantes envahissantes",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
