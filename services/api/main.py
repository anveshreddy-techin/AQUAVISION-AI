"""AquaVision AI - FastAPI Application Entry Point.

AI-Powered Underwater Marine Debris & Anomaly Detection Platform
SIH26057 - Side-Scan Sonar Survey Intelligence System
"""
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from services.api.config import settings
from database.connection import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    # Startup
    settings.ensure_dirs()
    create_tables()
    print("✅ AquaVision AI API started successfully")
    print(f"   Database: {settings.DATABASE_URL}")
    print(f"   Storage: {settings.STORAGE_ROOT}")
    print(f"   ML Device: {settings.ML_DEVICE}")
    yield
    # Shutdown
    print("🛑 AquaVision AI API shutting down")


app = FastAPI(
    title="AquaVision AI API",
    description=(
        "AI-Powered Underwater Marine Debris & Anomaly Detection Platform. "
        "Automated Side-Scan Sonar survey screening with prioritized human review. "
        "SIH26057 - Smart India Hackathon 2026."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount storage for serving images
storage_path = Path(settings.STORAGE_ROOT)
if storage_path.exists():
    app.mount("/storage", StaticFiles(directory=str(storage_path)), name="storage")

# Import and include routers
from services.api.routers.auth import router as auth_router
from services.api.routers.surveys import router as surveys_router
from services.api.routers.review import router as review_router
from services.api.routers.all_routers import (
    candidates_router, analytics_router, health_router,
    maps_router, reports_router, models_router, datasets_router,
    processing_router, notifications_router, audit_router, users_router,
)

PREFIX = settings.API_PREFIX

app.include_router(auth_router, prefix=PREFIX)
app.include_router(surveys_router, prefix=PREFIX)
app.include_router(review_router, prefix=PREFIX)
app.include_router(candidates_router, prefix=PREFIX)
app.include_router(analytics_router, prefix=PREFIX)
app.include_router(health_router, prefix=PREFIX)
app.include_router(maps_router, prefix=PREFIX)
app.include_router(reports_router, prefix=PREFIX)
app.include_router(models_router, prefix=PREFIX)
app.include_router(datasets_router, prefix=PREFIX)
app.include_router(processing_router, prefix=PREFIX)
app.include_router(notifications_router, prefix=PREFIX)
app.include_router(audit_router, prefix=PREFIX)
app.include_router(users_router, prefix=PREFIX)


@app.get("/")
def root():
    return {
        "name": "AquaVision AI",
        "subtitle": "AI-Powered Underwater Marine Debris & Anomaly Detection Platform",
        "version": "0.1.0",
        "api_docs": "/docs",
        "health": f"{PREFIX}/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.api.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
