from __future__ import annotations

from typing import Any

"""Service functions for generating mission reports.
This module provides utility functions for creating mission report payloads that can be used by web and mobile
 clients. The main function, build_mission_report_payload, aggregates summary metrics from a given mission, its associated photos, and detections. It calculates counts of photos and detections, as well as confidence levels based on the detections' confidence labels. The resulting payload is a dictionary containing the mission name, status, counts, and a summary of confidence and coverage information.
The build_mission_report_payload function is designed to be lightweight and easily consumable by clients,
 allowing for efficient display of mission report data in user interfaces. It can be extended or modified to include additional metrics or information as needed for specific use cases.
The function is useful for providing users with a clear understanding of the outcomes and performance of a mission"""

def build_mission_report_payload(mission: Any, photos: list[Any], detections: list[Any]) -> dict[str, Any]:
    """Create a lightweight report payload that can be used by web and mobile clients."""
    high_count = sum(1 for detection in detections if getattr(detection, "confidence_label", None) == "HIGH")
    medium_count = sum(1 for detection in detections if getattr(detection, "confidence_label", None) == "MEDIUM")
    low_count = sum(1 for detection in detections if getattr(detection, "confidence_label", None) == "LOW")

    confidence_level = "HIGH" if high_count else "MEDIUM" if medium_count else "LOW" if detections else "NONE"

    return {
        "mission_name": getattr(mission, "name", "Mission"),
        "status": getattr(mission, "status", "draft"),
        "photo_count": len(photos),
        "detection_count": len(detections),
        "high_confidence_count": high_count,
        "medium_confidence_count": medium_count,
        "low_confidence_count": low_count,
        "summary": {
            "confidence": confidence_level,
            "coverage": f"{len(photos)} photo(s) analysée(s)",
        },
    }
