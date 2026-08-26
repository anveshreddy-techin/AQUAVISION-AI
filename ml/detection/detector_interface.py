"""Abstract Base Class for Sonar Object Detectors."""
from abc import ABC, abstractmethod
from typing import List, Dict, Any


class DetectorInterface(ABC):
    """Abstract interface that all AquaVision acoustic detectors must implement."""

    @abstractmethod
    def detect(self, image_path: str) -> List[Dict[str, Any]]:
        """Run detection on a single image tile.

        Returns list of detections with format:
        [
            {
                "class_name": str,
                "confidence": float,
                "bbox": [x1, y1, x2, y2],
                "metadata": dict
            }
        ]
        """
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """Return model metadata, modality certification, and maturity status."""
        pass
