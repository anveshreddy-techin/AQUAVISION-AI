"""Dataset Registry and Modality Validator."""
from typing import List, Dict, Any

KNOWN_DATASETS: List[Dict[str, Any]] = [
    {
        "id": "ai4shipwrecks",
        "name": "AI4Shipwrecks",
        "source": "University of Michigan Field Robotics Group (DOI: 10.7302/dmf4-x492)",
        "url": "https://umfieldrobotics.github.io/ai4shipwrecks/",
        "modality": "SSS",
        "license": "CC BY-NC 4.0 / Research Use",
        "download_status": "COMPLETED",
        "image_count": 286,
        "sss_eligible": True,
        "classes": ["shipwreck", "background", "seabed"],
        "limitations": "Shipwreck-labeled SSS ground truth from Lake Huron (24 sites). Preserved as authentic acoustic structure/seabed; not relabeled as debris.",
    },
    {
        "id": "valdenegro_fls",
        "name": "Marine Debris FLS Dataset",
        "source": "Forward-Looking Sonar research dataset (Valdenegro-Toro)",
        "url": "https://github.com/mvaldenegro/marine-debris-fls-datasets",
        "modality": "FLS",
        "license": "CC BY 4.0",
        "download_status": "NOT_DOWNLOADED",
        "image_count": 1868,
        "sss_eligible": False,
        "classes": [
            "bottle", "can", "chain", "drink-carton", "hook",
            "propeller", "shampoo-bottle", "standing-bottle", "tire", "valve", "wall"
        ],
        "limitations": "FLS modality - NOT SSS. Ineligible for direct SSS training; cataloged for acoustic cross-reference only.",
    },
    {
        "id": "marine_pulse",
        "name": "Marine-PULSE",
        "source": "SSS underwater structures dataset",
        "url": "https://github.com/marine-pulse",
        "modality": "SSS",
        "license": "Research Use",
        "download_status": "NOT_DOWNLOADED",
        "image_count": 420,
        "sss_eligible": True,
        "classes": ["underwater_structures", "seabed"],
        "limitations": "Structural targets and bathymetry. Useful for SSS background modeling, not debris detection.",
    },
]


def validate_modality_compatibility(dataset_id: str, target_modality: str = "SSS") -> bool:
    """Ensure FLS datasets are never substituted for SSS models."""
    for ds in KNOWN_DATASETS:
        if ds["id"] == dataset_id:
            return ds["modality"] == target_modality and ds["sss_eligible"]
    return False
