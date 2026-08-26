import os
import tempfile
import cv2
import numpy as np
import pytest
from ml.preprocessing.sss_preprocessor import SSSPreprocessor
from ml.preprocessing.tiling import TilingEngine
from ml.detection.demo_detector import DemoDetector
from ml.anomaly.anomaly_detector import SSSAnomalyDetector
from ml.ranking.priority_engine import PriorityEngine
from ml.explainability.explainer import CandidateExplainer

def test_sss_preprocessor():
    preprocessor = SSSPreprocessor(clip_limit=2.0, tile_grid_size=(8, 8))
    img = np.random.randint(0, 256, (100, 100), dtype=np.uint8)
    processed = preprocessor.preprocess_image(img)
    assert processed is not None
    assert processed.shape == (100, 100)
    assert processed.dtype == np.uint8

def test_tiling_engine():
    tiler = TilingEngine(tile_size=256, overlap=32)
    img = np.zeros((512, 512), dtype=np.uint8)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tiles = tiler.tile_image(img, tmpdir, frame_id=1)
        assert len(tiles) > 0
        for tile_info in tiles:
            assert os.path.exists(tile_info["tile_path"])
            assert tile_info["width"] == 256
            assert tile_info["height"] == 256

def test_demo_detector():
    detector = DemoDetector()
    img = np.zeros((256, 256), dtype=np.uint8)
    img[100:150, 100:150] = 255
    
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp_path = f.name
        cv2.imwrite(tmp_path, img)
    
    try:
        detections = detector.detect(tmp_path)
        assert isinstance(detections, list)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_anomaly_detector():
    detector = SSSAnomalyDetector(threshold=0.5)
    img = np.random.randint(0, 256, (256, 256), dtype=np.uint8)
    
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp_path = f.name
        cv2.imwrite(tmp_path, img)
        
    try:
        result = detector.detect_tile(tmp_path)
        assert "anomaly_score" in result
        assert 0.0 <= result["anomaly_score"] <= 1.0
        assert "is_anomaly" in result
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def test_priority_engine():
    engine = PriorityEngine()
    high_res = engine.rank(anomaly_score=0.9, confidence=0.95, object_class="Debris / Metal")
    assert high_res["category"] in ["CRITICAL", "HIGH"]
    assert 0.0 <= high_res["score"] <= 1.0
    
    low_res = engine.rank(anomaly_score=0.1, confidence=0.2, object_class="Natural Feature")
    assert low_res["score"] < high_res["score"]

def test_candidate_explainer():
    candidate_data = {
        "confidence": 0.88,
        "anomaly_score": 0.75,
        "object_class": "Metal Debris",
        "priority_category": "HIGH"
    }
    explanation = CandidateExplainer.explain(candidate_data)
    assert isinstance(explanation, list)
    assert len(explanation) > 0
