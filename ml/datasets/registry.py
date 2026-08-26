"""Dataset Registry and Modality Validator."""
from typing import List, Dict, Any

KNOWN_DATASETS: List[Dict[str, Any]] = [
    {
        "id": "valdenegro_fls",
        "name": "Marine Debris FLS Dataset",
        "modality": "FLS",
        "sss_eligible": False,
        "classes": [
            "bottle", "can", "chain", "drink-carton", "hook",
            "propeller", "shampoo-bottle", "standing-bottle", "tire", "valve", "wall"
        ],
        "limitations": "FLS modality - NOT SSS. Ineligible for direct SSS training.",
    },
    {
        "id": "ai4shipwrecks",
        "name": "AI4Shipwrecks",
        "modality": "SSS",
        "sss_eligible": True,
        "classes": ["shipwreck", "seabed"],
        "limitations": "Shipwreck labels only, not marine debris. Useful for SSS background.",
    },
    {
        "id": "marine_pulse",
        "name": "Marine-PULSE",
        "modality": "SSS",
        "sss_eligible": True,
        "classes": ["underwater_structures", "seabed"],
        "limitations": "Structural targets. Useful for SSS domain understanding.",
    },
]


def validate_modality_compatibility(dataset_id: str, target_modality: str = "SSS") -> bool:
    """Ensure FLS datasets are never substituted for SSS models."""
    for ds in KNOWN_DATASETS:
        if ds["id"] == dataset_id:
            return ds["modality"] == target_modality and ds["sss_eligible"]
    return False
