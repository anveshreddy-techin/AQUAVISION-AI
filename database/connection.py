"""Database connection and session management for AquaVision AI."""
import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from database.models.base import Base


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aquavision.db")

# Create engine - handle SQLite-specific settings
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

# Enable WAL mode for SQLite for better concurrent access
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables():
    """Create all tables. Import all models first to register them."""
    # Import all models to ensure they're registered with Base
    import database.models  # noqa: F401
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Session:
    """Get a database session for non-FastAPI use (scripts, CLI)."""
    return SessionLocal()
