"""Demonstration Detector for Side-Scan Sonar Imagery."""
import os
from typing import List, Dict, Any
import cv2
import numpy as np
from ml.detection.detector_interface import DetectorInterface


class DemoDetector(DetectorInterface):
    """Contour-based heuristic detector used for reproducible hackathon demonstrations.

    Honesty Contract Note:
    This class is explicitly labeled DEMO. It uses shape and intensity heuristics
    rather than trained neural network weights, ensuring truthful presentation.
    """

    def __init__(self, confidence_threshold: float = 0.25):
        self.confidence_threshold = confidence_threshold

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": "SSS Demo Detector",
            "version": "0.1.0",
            "task": "DETECTION",
            "modality": "SSS",
            "status": "DEMO",
            "description": "PRECOMPUTED DEMO - Adaptive contour heuristic detector for SSS imagery.",
            "metrics": "N/A - Requires validated ground-truth SSS test set",
        }

    def detect(self, image_path: str) -> List[Dict[str, Any]]:
        if not os.path.exists(image_path):
            return []

        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return []

        h, w = img.shape
        _, thresh = cv2.threshold(img, 180, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 80 or area > (w * h * 0.4):
                continue

            x, y, bw, bh = cv2.boundingRect(cnt)
            aspect = max(bw, bh) / (min(bw, bh) + 1e-5)
            hull_area = cv2.contourArea(cv2.convexHull(cnt)) + 1e-5
            solidity = area / hull_area

            # Estimate heuristic confidence
            conf = min(0.95, 0.3 + solidity * 0.3 + (1.0 / (aspect + 1)) * 0.2 + min(area / 4000, 0.2))
            if conf < self.confidence_threshold:
                continue

            if aspect > 3.0:
                class_name = "Potential Net-like Structure"
            elif area > 2000:
                class_name = "Potential Debris"
            elif solidity > 0.8:
                class_name = "Unknown Object"
            else:
                class_name = "Potential Anomaly"

            detections.append({
                "class_name": class_name,
                "confidence": round(float(conf), 3),
                "bbox": [float(x), float(y), float(x + bw), float(y + bh)],
                "metadata": {
                    "area": float(area),
                    "solidity": float(solidity),
                    "aspect_ratio": float(aspect),
                    "heuristic": "DEMO_CONTOUR",
                },
            })

        return detections
