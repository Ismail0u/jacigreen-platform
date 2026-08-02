from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
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
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)
install_error_handlers(app)

allowed_hosts = [host.strip() for host in settings.ALLOWED_HOSTS.split(",") if host.strip()]
if not allowed_hosts:
    allowed_hosts = ["localhost", "127.0.0.1", "0.0.0.0"]

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=allowed_hosts,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    if settings.ENVIRONMENT.lower() in {"prod", "production", "live"}:
        forwarded_proto = request.headers.get("x-forwarded-proto")
        if forwarded_proto == "http" and request.url.scheme == "http":
            redirect_url = request.url.replace(scheme="https")
            return JSONResponse(status_code=308, content={"detail": "HTTPS required"}, headers={"Location": str(redirect_url)})

    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(self), geolocation=(self)")
    response.headers.setdefault("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'")
    return response


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
