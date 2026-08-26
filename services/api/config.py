"""Application configuration loaded from environment variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aquavision.db")

    # API
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_PREFIX: str = os.getenv("API_PREFIX", "/api/v1")
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-only-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_MINUTES", "10080"))

    # Storage
    STORAGE_ROOT: Path = Path(os.getenv("STORAGE_ROOT", str(PROJECT_ROOT / "storage")))
    ORIGINALS_DIR: Path = Path(os.getenv("ORIGINALS_DIR", str(PROJECT_ROOT / "storage" / "originals")))
    PROCESSED_DIR: Path = Path(os.getenv("PROCESSED_DIR", str(PROJECT_ROOT / "storage" / "processed")))
    EVIDENCE_DIR: Path = Path(os.getenv("EVIDENCE_DIR", str(PROJECT_ROOT / "storage" / "evidence")))
    REPORTS_DIR: Path = Path(os.getenv("REPORTS_DIR", str(PROJECT_ROOT / "storage" / "reports")))

    # ML/AI
    ML_MODELS_DIR: Path = Path(os.getenv("ML_MODELS_DIR", str(PROJECT_ROOT / "ml" / "models")))
    ML_DEVICE: str = os.getenv("ML_DEVICE", "cpu")
    ML_BATCH_SIZE: int = int(os.getenv("ML_BATCH_SIZE", "16"))
    DETECTION_CONFIDENCE_THRESHOLD: float = float(os.getenv("DETECTION_CONFIDENCE_THRESHOLD", "0.25"))
    ANOMALY_THRESHOLD: float = float(os.getenv("ANOMALY_THRESHOLD", "0.5"))
    TILE_SIZE: int = int(os.getenv("TILE_SIZE", "512"))
    TILE_OVERLAP: int = int(os.getenv("TILE_OVERLAP", "64"))

    # Processing
    MAX_CONCURRENT_JOBS: int = int(os.getenv("MAX_CONCURRENT_JOBS", "2"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "500"))

    # Ensure directories exist
    def ensure_dirs(self):
        for d in [self.STORAGE_ROOT, self.ORIGINALS_DIR, self.PROCESSED_DIR,
                  self.EVIDENCE_DIR, self.REPORTS_DIR, self.ML_MODELS_DIR]:
            d.mkdir(parents=True, exist_ok=True)


settings = Settings()
