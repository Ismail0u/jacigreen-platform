"""
Object detection strategies.

This module defines a common interface for AI detection models and
provides concrete implementations using different inference engines.

Architecture:
    Application
        |
        v
    DetectionStrategy
        |
        +----------------+
        |                |
        v                v
    YOLOv8Strategy   ONNXStrategy

The goal is to allow changing the AI backend without modifying
the business logic.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


# Generic structure returned by every detection model.
DetectionResult = dict[str, Any]


class DetectionStrategy(ABC):
    """
    Abstract interface for object detection models.

    Every detection engine must implement:
    - object detection from image bytes
    - model version identification
    """

    @abstractmethod
    def detect(
        self,
        image_bytes: bytes,
        threshold: float
    ) -> list[DetectionResult]:
        """
        Run inference on an image.

        Args:
            image_bytes:
                Raw image content.

            threshold:
                Minimum confidence score accepted.

        Returns:
            List of detections containing:
            - detected class
            - confidence score
            - bounding box coordinates
        """

    @property
    @abstractmethod
    def model_version(self) -> str:
        """
        Return the model identifier stored with detections.
        """


class YOLOv8Strategy(DetectionStrategy):
    """
    YOLOv8 inference implementation using Ultralytics.

    Used when running the original YOLO model directly with Python.
    """

    def __init__(self, model_path: str | Path):
        from ultralytics import YOLO

        # Load trained YOLO model.
        self._model = YOLO(str(model_path))


    def detect(
        self,
        image_bytes: bytes,
        threshold: float = 0.45
    ) -> list[DetectionResult]:
        """
        Execute YOLO inference and format predictions.
        """

        import tempfile

        tmp_path = None

        # YOLO expects an image file, so temporarily store bytes.
        with tempfile.NamedTemporaryFile(
            suffix=".jpg",
            delete=False
        ) as tmp:
            tmp.write(image_bytes)
            tmp_path = Path(tmp.name)


        try:
            results = self._model(
                str(tmp_path),
                conf=threshold
            )

            detections = []

            for result in results:
                for box in result.boxes:
                    detections.append(
                        {
                            "species": self._model.names[int(box.cls)],
                            "confidence": float(box.conf),
                            "bbox_xyxy": [
                                float(value)
                                for value in box.xyxy[0].tolist()
                            ],
                        }
                    )

            return detections

        finally:
            # Remove temporary image after inference.
            if tmp_path:
                tmp_path.unlink(missing_ok=True)


    @property
    def model_version(self) -> str:
        """Version stored with generated detections."""
        return "yolov8n-jacinthe-v1"



class ONNXStrategy(DetectionStrategy):
    """
    ONNX Runtime inference implementation.

    Used for optimized model execution without requiring
    the Ultralytics framework.
    """

    def __init__(self, model_path: str | Path):
        import onnxruntime as ort

        # Load ONNX model for CPU inference.
        self._session = ort.InferenceSession(
            str(model_path),
            providers=["CPUExecutionProvider"],
        )


    def detect(
        self,
        image_bytes: bytes,
        threshold: float = 0.45
    ) -> list[DetectionResult]:
        """
        Prepare image tensor, execute ONNX inference,
        then convert raw predictions into application format.
        """

        import io

        import numpy as np
        from PIL import Image


        # Convert image bytes into model input tensor.
        image = (
            Image.open(io.BytesIO(image_bytes))
            .convert("RGB")
            .resize((640, 640))
        )

        image_array = (
            np.array(image, dtype=np.float32) / 255.0
        )

        tensor = np.expand_dims(
            image_array.transpose(2, 0, 1),
            0
        )


        input_name = self._session.get_inputs()[0].name

        outputs = self._session.run(
            None,
            {input_name: tensor}
        )


        predictions = outputs[0][0].T

        detections = []

        for prediction in predictions:

            confidence = float(prediction[4])

            # Ignore weak detections.
            if confidence < threshold:
                continue


            x_center, y_center, width, height = [
                float(value)
                for value in prediction[:4]
            ]


            detections.append(
                {
                    "species": "jacinthe_eau",
                    "confidence": confidence,

                    # Convert center format to xyxy format.
                    "bbox_xyxy": [
                        x_center - width / 2,
                        y_center - height / 2,
                        x_center + width / 2,
                        y_center + height / 2,
                    ],
                }
            )

        return detections


    @property
    def model_version(self) -> str:
        """ONNX model version identifier."""
        return "yolov8n-jacinthe-v1-onnx"