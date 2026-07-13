from app.services.mission_report import build_mission_report_payload


class DummyMission:
    def __init__(self, name: str, status: str = "draft") -> None:
        self.name = name
        self.status = status
        self.mission_date = None


class DummyPhoto:
    def __init__(self, filename: str) -> None:
        self.filename = filename


class DummyDetection:
    def __init__(self, confidence_label: str, confidence: float) -> None:
        self.confidence_label = confidence_label
        self.confidence = confidence


def test_build_mission_report_payload_aggregates_summary_metrics():
    mission = DummyMission("Mission test", status="completed")
    photos = [DummyPhoto("a.jpg"), DummyPhoto("b.jpg")]
    detections = [
        DummyDetection("HIGH", 0.91),
        DummyDetection("MEDIUM", 0.62),
        DummyDetection("LOW", 0.42),
    ]

    report = build_mission_report_payload(mission, photos, detections)

    assert report["mission_name"] == "Mission test"
    assert report["photo_count"] == 2
    assert report["detection_count"] == 3
    assert report["high_confidence_count"] == 1
    assert report["status"] == "completed"
    assert report["summary"]["confidence"] == "HIGH"
