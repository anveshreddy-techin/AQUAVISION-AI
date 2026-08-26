"""Survey Frame Tiling Engine with Coordinate Transformation."""
import os
from typing import List, Dict, Any
import cv2
import numpy as np


class TilingEngine:
    """Splits large sonar waterfall frames into overlapping tiles for CNN inference."""

    def __init__(self, tile_size: int = 512, overlap: int = 64):
        self.tile_size = tile_size
        self.overlap = overlap
        self.stride = max(1, tile_size - overlap)

    def tile_image(self, image: np.ndarray, output_dir: str, frame_id: int) -> List[Dict[str, Any]]:
        """Slice frame into tiles and save them."""
        os.makedirs(output_dir, exist_ok=True)
        h, w = image.shape[:2]
        tiles = []
        tile_index = 0

        for y in range(0, max(1, h - self.tile_size + 1), self.stride):
            for x in range(0, max(1, w - self.tile_size + 1), self.stride):
                crop = image[y : y + self.tile_size, x : x + self.tile_size]

                # Pad boundary if smaller than tile_size
                if crop.shape[0] < self.tile_size or crop.shape[1] < self.tile_size:
                    padded = np.zeros((self.tile_size, self.tile_size), dtype=image.dtype)
                    padded[: crop.shape[0], : crop.shape[1]] = crop
                    crop = padded

                filename = f"frame_{frame_id}_tile_{tile_index}.png"
                tile_path = os.path.join(output_dir, filename)
                cv2.imwrite(tile_path, crop)

                tiles.append({
                    "tile_index": tile_index,
                    "x_offset": x,
                    "y_offset": y,
                    "width": self.tile_size,
                    "height": self.tile_size,
                    "tile_path": tile_path,
                })
                tile_index += 1

        return tiles
