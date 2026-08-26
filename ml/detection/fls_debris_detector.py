"""Forward-Looking Sonar (FLS) Auxiliary Marine Debris Detector Adapter."""
from typing import List, Dict, Any
from ml.detection.detector_interface import DetectorInterface


class FLSDebrisDetector(DetectorInterface):
    """Adapter for models trained on Forward-Looking Sonar (FLS) marine debris data.

    Honesty Contract Note:
    Explicitly labeled MODALITY=FLS. Cannot be substituted for Side-Scan Sonar models.
    """

    def __init__(self, confidence_threshold: float = 0.3):
        self.confidence_threshold = confidence_threshold

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": "FLS Marine Debris Adapter",
            "version": "0.1.0",
            "task": "DETECTION",
            "modality": "FLS",
            "status": "EXPERIMENTAL",
            "description": "Auxiliary detector adapter for Forward-Looking Sonar datasets (e.g., Valdenegro FLS).",
            "modality_warning": "CRITICAL: This model is for Forward-Looking Sonar (FLS) only, NOT Side-Scan Sonar (SSS).",
        }

    def detect(self, image_path: str) -> List[Dict[str, Any]]:
        # FLS detection logic wrapper
        return []
