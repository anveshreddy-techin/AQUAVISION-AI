"""Transparent Inspection Priority Ranking Engine.

Formula (Spec Section 33):
Priority = w1 * Anomaly + w2 * Confidence + w3 * TypeWeight + w4 * Uncertainty

Weights:
- w_anomaly:     0.35 (Acoustic texture & reconstruction deviation)
- w_confidence:  0.25 (Detector probability)
- w_type:        0.20 (Domain risk classification weight)
- w_uncertainty: 0.20 (Higher when detector is ambiguous / near boundary)
"""
from typing import Dict, Any, List


class PriorityEngine:
    """Computes transparent, weighted priority scores for candidate regions."""

    TYPE_WEIGHTS: Dict[str, float] = {
        "Potential Net-like Anomaly": 0.95,
        "Potential Fishing Gear": 0.90,
        "Ghost Net Candidate (Unverified)": 0.88,
        "Metallic Container Debris": 0.82,
        "Submerged Pipeline Anomaly": 0.80,
        "Metal Debris": 0.78,
        "Plastic / Synthetic Dump": 0.72,
        "Container": 0.70,
        "Potential Debris": 0.65,
        "Unknown Object": 0.60,
        "Unknown Anomaly": 0.58,
        "Potential Anomaly": 0.50,
        "Natural Rock Outcrop": 0.20,
        "Natural Feature": 0.15,
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
        """Compute priority score, category, and transparent mathematical contribution breakdown."""
        anom = max(0.0, min(1.0, float(anomaly_score or 0.0)))
        conf = max(0.0, min(1.0, float(confidence or 0.0)))
        type_weight = self.TYPE_WEIGHTS.get(object_class, 0.50)

        # Uncertainty is peak (1.0) when detector confidence is 0.50 (maximum decision ambiguity)
        uncertainty = 1.0 - (abs(conf - 0.50) * 2.0) if conf > 0 else 0.50

        # Component contributions
        anomaly_contrib = self.w_anomaly * anom
        confidence_contrib = self.w_confidence * conf
        type_contrib = self.w_type * type_weight
        uncertainty_contrib = self.w_uncertainty * uncertainty

        raw_score = (
            anomaly_contrib
            + confidence_contrib
            + type_contrib
            + uncertainty_contrib
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
            f"Anomaly deviation: {anom:.2f} (weight {self.w_anomaly} -> +{anomaly_contrib:.3f})",
            f"Detector confidence: {conf:.2f} (weight {self.w_confidence} -> +{confidence_contrib:.3f})",
            f"Class importance '{object_class}': {type_weight:.2f} (weight {self.w_type} -> +{type_contrib:.3f})",
            f"Decision uncertainty: {uncertainty:.2f} (weight {self.w_uncertainty} -> +{uncertainty_contrib:.3f})",
        ]

        return {
            "score": round(score, 4),
            "category": category,
            "formula": "0.35*Anomaly + 0.25*Confidence + 0.20*TypeWeight + 0.20*Uncertainty",
            "breakdown": {
                "anomaly_score": round(anom, 4),
                "anomaly_weight": self.w_anomaly,
                "anomaly_contribution": round(anomaly_contrib, 4),
                "confidence": round(conf, 4),
                "confidence_weight": self.w_confidence,
                "confidence_contribution": round(confidence_contrib, 4),
                "object_class": object_class,
                "type_weight": type_weight,
                "type_weight_factor": self.w_type,
                "type_contribution": round(type_contrib, 4),
                "uncertainty": round(uncertainty, 4),
                "uncertainty_weight": self.w_uncertainty,
                "uncertainty_contribution": round(uncertainty_contrib, 4),
            },
            "reasons": reasons,
        }
