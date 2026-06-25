"""
Service for converting mission detections into GeoJSON format.

This module retrieves AI detections from PostGIS and transforms them
into a GeoJSON FeatureCollection for map visualization (Leaflet, GIS...).
"""

from uuid import UUID

from geoalchemy2.functions import ST_X, ST_Y
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.detection import Detection


# Colors used by frontend to display detection confidence levels.
DETECTION_COLORS = {
    "HIGH": "#dc2626",
    "MEDIUM": "#f59e0b",
    "LOW": "#eab308",
}


async def mission_detections_geojson(
    db: AsyncSession,
    mission_id: UUID,
) -> dict:
    """
    Get all detections of a mission and return them as GeoJSON.

    The function:
    - fetches detections linked to a mission
    - extracts coordinates from PostGIS geometry
    - formats each detection as a GeoJSON Feature

    Args:
        db:
            Async database session.

        mission_id:
            ID of the mission to retrieve detections from.

    Returns:
        GeoJSON FeatureCollection containing:
        - detection points
        - AI information
        - mission metadata
    """

    # Retrieve detections with geographic coordinates.
    result = await db.execute(
        select(
            Detection.id,
            Detection.species,
            Detection.confidence,
            Detection.confidence_label,
            Detection.bbox_x,
            Detection.bbox_y,
            Detection.bbox_width,
            Detection.bbox_height,
            Detection.model_version,

            # Convert PostGIS POINT to longitude/latitude.
            ST_X(Detection.location).label("longitude"),
            ST_Y(Detection.location).label("latitude"),
        )
        .where(Detection.mission_id == mission_id)
        .where(Detection.location.is_not(None))
        .order_by(Detection.confidence.desc())
    )

    rows = result.all()

    # Build GeoJSON response for mapping tools.
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        row.longitude,
                        row.latitude,
                    ],
                },
                "properties": {
                    "id": str(row.id),
                    "species": row.species,
                    "confidence": row.confidence,
                    "confidence_label": row.confidence_label,

                    # Object detection bounding box.
                    "bbox_x": row.bbox_x,
                    "bbox_y": row.bbox_y,
                    "bbox_width": row.bbox_width,
                    "bbox_height": row.bbox_height,

                    # Used by frontend visualization.
                    "color": DETECTION_COLORS.get(
                        row.confidence_label,
                        "#6b7280",
                    ),

                    "model_version": row.model_version,
                },
            }
            for row in rows
        ],

        # Additional API information.
        "meta": {
            "count": len(rows),
            "mission_id": str(mission_id),
        },
    }