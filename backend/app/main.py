from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    Base,
    SessionLocal,
    engine,
    migrate_analysis_payload_schema,
    migrate_district_crosswalk_schema,
    migrate_legacy_schema,
)
from app.routers import (
    boundaries,
    census,
    cities,
    comparisons,
    datasets,
    demo_analyses,
    exports,
    geography,
    locations,
    market_scores,
    scenarios,
)
from app.services.dataset_registry import seed_dataset_registry


@asynccontextmanager
async def lifespan(_app: FastAPI):
    migrate_legacy_schema()
    Base.metadata.create_all(bind=engine)
    migrate_analysis_payload_schema()
    migrate_district_crosswalk_schema()
    with SessionLocal() as db:
        seed_dataset_registry(db)
    yield


app = FastAPI(
    title="ExpansionIQ API",
    description="Retail market expansion decision-support API",
    version="1.0.0",
    lifespan=lifespan,
)

default_frontend_origins = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
)
frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        ",".join(default_frontend_origins),
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cities.router, prefix="/api")
app.include_router(comparisons.router, prefix="/api")
app.include_router(demo_analyses.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")
app.include_router(exports.router, prefix="/api")
app.include_router(locations.router, prefix="/api")
app.include_router(census.router, prefix="/api")
app.include_router(geography.router, prefix="/api")
app.include_router(boundaries.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(market_scores.router, prefix="/api")


from pathlib import Path
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

FRONTEND_DIST_PATH = Path(__file__).resolve().parents[2] / "frontend" / "dist"

if (FRONTEND_DIST_PATH / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_PATH / "assets")), name="assets")


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/health")
def api_health():
    return {"status": "healthy"}


@app.get("/")
def root():
    index_file = FRONTEND_DIST_PATH / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return {
        "name": "ExpansionIQ API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    file_path = FRONTEND_DIST_PATH / full_path
    if file_path.is_file():
        return FileResponse(file_path)
    index_file = FRONTEND_DIST_PATH / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return {
        "name": "ExpansionIQ API",
        "status": "running",
        "docs": "/docs",
    }