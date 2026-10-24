from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    Base,
    SessionLocal,
    engine,
    migrate_district_crosswalk_schema,
    migrate_legacy_schema,
)
from app.routers import (
    boundaries,
    census,
    cities,
    comparisons,
    datasets,
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
app.include_router(scenarios.router, prefix="/api")
app.include_router(exports.router, prefix="/api")
app.include_router(locations.router, prefix="/api")
app.include_router(census.router, prefix="/api")
app.include_router(geography.router, prefix="/api")
app.include_router(boundaries.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(market_scores.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "ExpansionIQ API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/health")
def api_health():
    return {"status": "healthy"}