"""Acoustic Preprocessing & Multi-Channel Visual Evidence Generator for SSS Imagery."""
import os
from pathlib import Path
from typing import Dict, Any, Tuple
import cv2
import numpy as np


class SSSPreprocessor:
    """Side-Scan Sonar Multi-Channel Preprocessor & Evidence Generator.

    Applies acoustic domain transformations:
    1. Grayscale standardization
    2. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    3. Fast Non-Local Means acoustic speckle denoising
    4. Dynamic range normalization
    5. Multi-channel Evidence Generation (Raw, Enhanced, Anomaly Heatmap, Acoustic Shadow Contrast)
    """

    def __init__(
        self,
        clip_limit: float = 2.0,
        tile_grid_size: Tuple[int, int] = (8, 8),
        denoise_h: int = 10,
    ):
        self.clip_limit = clip_limit
        self.tile_grid_size = tile_grid_size
        self.denoise_h = denoise_h

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess an in-memory grayscale image array."""
        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 1. CLAHE Contrast Equalization
        clahe = cv2.createCLAHE(clipLimit=self.clip_limit, tileGridSize=self.tile_grid_size)
        enhanced = clahe.apply(image)

        # 2. Speckle Denoising
        denoised = cv2.fastNlMeansDenoising(enhanced, h=self.denoise_h)

        # 3. Min-Max Normalization
        normalized = cv2.normalize(denoised, None, 0, 255, cv2.NORM_MINMAX)

        return normalized

    def generate_anomaly_heatmap(self, image: np.ndarray) -> np.ndarray:
        """Generate pixel-wise acoustic anomaly density heatmap."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        # Background estimation via large Gaussian kernel
        bg = cv2.GaussianBlur(gray.astype(np.float32), (0, 0), sigmaX=25)
        diff = np.abs(gray.astype(np.float32) - bg)

        # Texture gradient
        lap = np.abs(cv2.Laplacian(gray, cv2.CV_32F))

        combined = cv2.normalize(diff * 0.6 + lap * 0.4, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        # Apply Jet / Turbo acoustic color map
        heatmap_color = cv2.applyColorMap(combined, cv2.COLORMAP_JET)
        return heatmap_color

    def extract_evidence_crop(
        self,
        image: np.ndarray,
        bbox: Tuple[int, int, int, int],
        pad: int = 32,
    ) -> Dict[str, Any]:
        """Extract multi-signal evidence region: Target highlight, Acoustic Shadow, Local Background."""
        h, w = image.shape[:2]
        x1, y1, x2, y2 = bbox
        px1 = max(0, x1 - pad)
        py1 = max(0, y1 - pad)
        px2 = min(w, x2 + pad)
        py2 = min(h, y2 + pad)

        crop = image[py1:py2, px1:px2]
        target_roi = image[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]

        # Highlight intensity vs local background
        target_mean = float(np.mean(target_roi)) if target_roi.size > 0 else 0.0
        bg_mean = float(np.mean(crop)) if crop.size > 0 else 1.0
        contrast_ratio = round(target_mean / (bg_mean + 1e-5), 2)

        # Shadow detection in trailing acoustic zone
        shadow_roi = image[min(h, y2):min(h, y2 + (y2 - y1)), max(0, x1):min(w, x2)]
        shadow_intensity = float(np.mean(shadow_roi)) if shadow_roi.size > 0 else 0.0
        has_shadow = shadow_intensity < (bg_mean * 0.5)

        return {
            "bbox_padded": [px1, py1, px2, py2],
            "target_mean_intensity": round(target_mean, 2),
            "background_mean_intensity": round(bg_mean, 2),
            "acoustic_contrast_ratio": contrast_ratio,
            "shadow_detected": has_shadow,
            "shadow_mean_intensity": round(shadow_intensity, 2),
            "evidence_type": "HIGHLIGHT_WITH_SHADOW" if has_shadow else "INTENSITY_ANOMALY",
        }

    def preprocess_file(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """Preprocess an image file on disk and save result."""
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input image not found: {input_path}")

        img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"Could not decode image at {input_path}")

        h, w = img.shape
        processed = self.preprocess_image(img)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, processed)

        return {
            "input_path": input_path,
            "output_path": output_path,
            "width": w,
            "height": h,
            "clahe_clip_limit": self.clip_limit,
            "tile_grid_size": list(self.tile_grid_size),
            "denoise_h": self.denoise_h,
            "pipeline_stages": [
                "1. Grayscale standardisation",
                f"2. CLAHE (clip={self.clip_limit}, grid={self.tile_grid_size})",
                f"3. Fast Non-Local Means (h={self.denoise_h})",
                "4. Min-Max normalization [0, 255]",
            ],
        }
