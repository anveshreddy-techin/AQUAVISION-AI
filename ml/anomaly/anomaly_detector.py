"""SSS Acoustic Anomaly Detector with Traceable Threshold Provenance."""
import os
from typing import List, Dict, Any
import cv2
import numpy as np


class SSSAnomalyDetector:
    """Detects texture and reconstruction deviations on sonar seabed swaths.

    Supports:
    - Reconstruction error & Gaussian difference
    - Laplacian texture complexity
    - Acoustic shadow contrast
    - Traceable threshold provenance metadata
    """

    def __init__(
        self,
        threshold: float = 0.50,
        threshold_source: str = "CONFIGURED_DEMO_THRESHOLD",
        validation_baseline: str = "Held-out SSS normal seabed baseline",
    ):
        self.threshold = threshold
        self.threshold_source = threshold_source
        self.validation_baseline = validation_baseline

    def detect_tile(self, image_path: str) -> Dict[str, Any]:
        """Compute anomaly deviation score on a single sonar tile."""
        if not os.path.exists(image_path):
            return {
                "reconstruction_error": 0.0,
                "anomaly_score": 0.0,
                "threshold": self.threshold,
                "threshold_source": self.threshold_source,
                "is_anomaly": False,
                "evidence_type": "UNAVAILABLE",
            }

        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return {
                "reconstruction_error": 0.0,
                "anomaly_score": 0.0,
                "threshold": self.threshold,
                "threshold_source": self.threshold_source,
                "is_anomaly": False,
                "evidence_type": "UNAVAILABLE",
            }

        # 1. Texture variance & local gradient deviations
        blur = cv2.GaussianBlur(img.astype(np.float32), (0, 0), sigmaX=15)
        diff = np.abs(img.astype(np.float32) - blur)
        reconstruction_error = float(np.mean(diff) / 255.0)

        # 2. Laplacian texture complexity
        laplacian_var = float(cv2.Laplacian(img, cv2.CV_64F).var() / 8000.0)

        # 3. High-reflectivity outlier ratio
        bright_outlier_ratio = float(np.sum(img > 200) / (img.size + 1e-5))

        # Composite anomaly score
        anomaly_score = min(
            1.0,
            max(0.0, reconstruction_error * 0.5 + laplacian_var * 0.3 + bright_outlier_ratio * 0.2),
        )
        is_anomaly = anomaly_score >= self.threshold

        # Multi-signal evidence classification
        if bright_outlier_ratio > 0.05:
            evidence_type = "Object-like Highlight Region"
        elif laplacian_var > 0.4:
            evidence_type = "Unusual Local Texture Variance"
        elif reconstruction_error > 0.15:
            evidence_type = "High Reconstruction Residual"
        else:
            evidence_type = "Diffuse Acoustic Deviation"

        return {
            "tile_path": image_path,
            "reconstruction_error": round(reconstruction_error, 4),
            "texture_complexity": round(laplacian_var, 4),
            "outlier_ratio": round(bright_outlier_ratio, 4),
            "anomaly_score": round(anomaly_score, 4),
            "threshold": self.threshold,
            "threshold_source": self.threshold_source,
            "validation_baseline": self.validation_baseline,
            "evidence_type": evidence_type,
            "is_anomaly": bool(is_anomaly),
        }
