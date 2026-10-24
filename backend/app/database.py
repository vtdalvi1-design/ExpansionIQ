import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

DEFAULT_DB_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "expansioniq.db"
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{DEFAULT_DB_PATH.as_posix()}",
)

if DATABASE_URL.startswith("sqlite:///") and DATABASE_URL != "sqlite:///:memory:":
    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)
pool_options = (
    {"poolclass": StaticPool}
    if DATABASE_URL in {"sqlite://", "sqlite:///:memory:"}
    else {}
)

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    **pool_options,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def migrate_legacy_schema(bind=engine) -> None:
    with bind.begin() as connection:
        if not inspect(connection).has_table("retail_locations"):
            return
        columns = {
            column["name"]
            for column in inspect(connection).get_columns("retail_locations")
        }
        if "location_type" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE retail_locations "
                    "ADD COLUMN location_type VARCHAR(20) "
                    "NOT NULL DEFAULT 'candidate'"
                )
            )


def migrate_district_crosswalk_schema(bind=engine) -> None:
    with bind.begin() as connection:
        inspector = inspect(connection)
        if not inspector.has_table("district_crosswalks"):
            return
        columns = {
            column["name"]
            for column in inspector.get_columns("district_crosswalks")
        }
        additions = {
            "official_state_name": "VARCHAR(160)",
            "census_state_code": "VARCHAR(20)",
            "census_district_code": "VARCHAR(30)",
            "census_reference_year": "INTEGER",
        }
        for name, column_type in additions.items():
            if name not in columns:
                connection.execute(
                    text(
                        f"ALTER TABLE district_crosswalks ADD COLUMN {name} "
                        f"{column_type}"
                    )
                )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS "
                "uq_district_crosswalk_census_code ON district_crosswalks "
                "(boundary_source_version, census_reference_year, "
                "census_state_code, census_district_code)"
            )
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
