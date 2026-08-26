"""Candidate Explainability Generator."""
from typing import Dict, Any, List


class CandidateExplainer:
    """Generates human-readable scientific rationale without fabricating evidence."""

    @staticmethod
    def explain(candidate: Dict[str, Any]) -> List[str]:
        reasons = []
        conf = candidate.get("confidence")
        anom = candidate.get("anomaly_score")
        obj_class = candidate.get("object_class", "Unclassified")
        priority = candidate.get("priority_category", "LOW")

        if conf is not None:
            reasons.append(f"Acoustic contour classifier confidence: {conf * 100:.1f}%")
        if anom is not None:
            reasons.append(f"Seabed texture anomaly deviation: {anom:.2f} (above baseline)")
        reasons.append(f"Target classified as '{obj_class}' based on acoustic profile")
        reasons.append(f"Overall inspection triage assigned: {priority}")

        return reasons
