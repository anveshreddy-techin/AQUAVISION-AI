"""Acoustic Preprocessing for Side-Scan Sonar (SSS) Imagery."""
import os
from pathlib import Path
import cv2
import numpy as np


class SSSPreprocessor:
    """Side-Scan Sonar Image Preprocessor.

    Applies acoustic domain enhancements:
    1. Grayscale standardisation
    2. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    3. Fast Non-Local Means acoustic speckle denoising
    4. Dynamic range normalization
    """

    def __init__(self, clip_limit: float = 2.0, tile_grid_size: tuple = (8, 8), denoise_h: int = 10):
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

    def preprocess_file(self, input_path: str, output_path: str) -> dict:
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
            "denoise_h": self.denoise_h,
        }
