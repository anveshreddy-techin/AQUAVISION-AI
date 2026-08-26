"""SSS Acoustic Anomaly Detector."""
import os
from typing import List, Dict, Any
import cv2
import numpy as np


class SSSAnomalyDetector:
    """Detects texture and reconstruction deviations on sonar seabed swaths."""

    def __init__(self, threshold: float = 0.5):
        self.threshold = threshold

    def detect_tile(self, image_path: str) -> Dict[str, Any]:
        """Compute anomaly deviation score on a single sonar tile."""
        if not os.path.exists(image_path):
            return {
                "reconstruction_error": 0.0,
                "anomaly_score": 0.0,
                "threshold": self.threshold,
                "is_anomaly": False,
            }

        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {
                "reconstruction_error": 0.0,
                "anomaly_score": 0.0,
                "threshold": self.threshold,
                "is_anomaly": False,
            }

        # Texture variance & local gradient deviations
        blur = cv2.GaussianBlur(img.astype(np.float32), (0, 0), sigmaX=15)
        diff = np.abs(img.astype(np.float32) - blur)
        reconstruction_error = float(np.mean(diff) / 255.0)

        laplacian_var = float(cv2.Laplacian(img, cv2.CV_64F).var() / 8000.0)
        anomaly_score = min(1.0, max(0.0, reconstruction_error * 0.6 + laplacian_var * 0.4))
        is_anomaly = anomaly_score >= self.threshold

        return {
            "tile_path": image_path,
            "reconstruction_error": round(reconstruction_error, 4),
            "anomaly_score": round(anomaly_score, 4),
            "threshold": self.threshold,
            "is_anomaly": bool(is_anomaly),
        }
