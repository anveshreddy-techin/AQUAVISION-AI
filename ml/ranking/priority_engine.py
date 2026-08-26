"""Inspection Priority Ranking Engine."""
from typing import Dict, Any, List


class PriorityEngine:
    """Computes transparent, weighted priority scores for candidate regions.

    Formula (Spec Section 33):
    Priority = w1*Anomaly + w2*Confidence + w3*TypeWeight + w4*Uncertainty
    """

    TYPE_WEIGHTS: Dict[str, float] = {
        "Ghost Net Candidate": 0.95,
        "Potential Net-like Structure": 0.90,
        "Fishing Gear": 0.85,
        "Metal Debris": 0.80,
        "Plastic Debris": 0.75,
        "Container": 0.70,
        "Potential Debris": 0.65,
        "Unknown Object": 0.60,
        "Potential Anomaly": 0.55,
        "Natural Feature": 0.20,
    }

    def __init__(
        self,
        w_anomaly: float = 0.35,
        w_confidence: float = 0.25,
        w_type: float = 0.20,
        w_uncertainty: float = 0.20,
    ):
        self.w_anomaly = w_anomaly
        self.w_confidence = w_confidence
        self.w_type = w_type
        self.w_uncertainty = w_uncertainty

    def rank(
        self,
        anomaly_score: float = 0.0,
        confidence: float = 0.0,
        object_class: str = "Unknown Object",
    ) -> Dict[str, Any]:
        """Compute priority score and category."""
        anom = max(0.0, min(1.0, float(anomaly_score or 0.0)))
        conf = max(0.0, min(1.0, float(confidence or 0.0)))
        type_weight = self.TYPE_WEIGHTS.get(object_class, 0.50)

        # Uncertainty is maximum when confidence is near 0.50
        uncertainty = 1.0 - (abs(conf - 0.50) * 2.0) if conf > 0 else 0.50

        raw_score = (
            self.w_anomaly * anom
            + self.w_confidence * conf
            + self.w_type * type_weight
            + self.w_uncertainty * uncertainty
        )
        score = max(0.0, min(1.0, raw_score))

        if score >= 0.80:
            category = "CRITICAL"
        elif score >= 0.60:
            category = "HIGH"
        elif score >= 0.40:
            category = "MEDIUM"
        else:
            category = "LOW"

        reasons = [
            f"Anomaly deviation: {anom:.2f} (weight {self.w_anomaly})",
            f"Detector confidence: {conf:.2f} (weight {self.w_confidence})",
            f"Class importance '{object_class}': {type_weight:.2f} (weight {self.w_type})",
            f"Uncertainty factor: {uncertainty:.2f} (weight {self.w_uncertainty})",
        ]

        return {
            "score": round(score, 4),
            "category": category,
            "reasons": reasons,
        }
