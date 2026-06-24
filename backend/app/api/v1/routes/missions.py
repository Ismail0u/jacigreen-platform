import json
import uuid
from pathlib import Path
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from geoalchemy2 import WKTElement
from geoalchemy2.functions import ST_AsGeoJSON, ST_X, ST_Y
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models import Mission, Photo
from app.schemas.mission import MissionCreate, MissionRead, MissionUpdate
from app.services.detection_geojson import mission_detections_geojson
from app.services.exif_service import extract_gps

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/tiff"}
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


"""
Mission API routes.
This module defines the API routes for managing missions in the JACIGREEN DroneSurveillance application
. It includes endpoints for listing, retrieving, creating, updating, and deleting missions. Each endpoint interacts with the database through the async session. 
    The routes are organized under the "/missions" prefix and are tagged as "missions" for API documentation purposes. The endpoints use Pydantic schemas for request validation and response serialization. 
    The list_missions endpoint retrieves all missions, while the get_mission endpoint retrieves a specific mission by its ID. The create_mission endpoint allows for creating a new mission, and the update_mission endpoint allows for updating an existing mission. Finally, the delete_mission endpoint allows for deleting a mission by its ID.
    Additionally, there is an endpoint to retrieve the GeoJSON representation of all photos associated with a specific mission, which can be used for mapping and spatial analysis purposes.
get_mission_geojson endpoint retrieves all photos associated with a specific mission and returns them in GeoJSON format, which includes the photo's ID, filename, storage URL, altitude, and geographic coordinates (longitude and latitude). This allows for easy integration with mapping libraries and spatial analysis tools.
missions are a core entity in the application, representing a drone surveillance operation that can have multiple photos associated with it. The API routes defined in this module provide the necessary functionality to manage missions and their related photos effectively.
routes are designed to follow RESTful principles, making it easy for clients to interact with the API and perform CRUD operations on missions and their associated photos. The use of async database sessions ensures that the API can handle concurrent requests efficiently, providing a responsive experience for users.
validation and error handling are implemented to ensure that clients receive appropriate responses when interacting with the API, such as returning a 404 status code when a mission or photo is not found. This helps maintain the integrity of the application and provides clear feedback to clients.
mission management is a critical aspect of the JACIGREEN DroneSurveillance application, and the API routes defined in this module provide a comprehensive set of tools for managing missions and their associated photos. By leveraging FastAPI, SQLAlchemy, and GeoAlchemy2, the application can efficiently handle spatial data and provide a robust platform for drone surveillance operations.
postgis and spatial data support are integral to the application's functionality, allowing for advanced geospatial queries and analysis. The use of GeoAlchemy2 enables seamless integration with PostGIS, providing powerful spatial capabilities for managing and analyzing geographic data related to missions and photos.
yolov8 and object detection integration can be implemented in the future to enhance the capabilities of the JACIGREEN DroneSurveillance application. By leveraging YOLOv8 for real-time object detection, the application can automatically identify and classify objects in drone-captured images, providing valuable insights for surveillance and monitoring purposes. This integration can further enhance the application's functionality and provide users with advanced tools for analyzing and interpreting spatial data collected during drone missions.
routes are designed to be modular and extensible, allowing for easy addition of new features and functionality as the application evolves. This modularity ensures that the application can adapt to changing requirements and incorporate new technologies and methodologies as they become available.
"""
router = APIRouter(prefix="/missions", tags=["missions"])


@router.get("/", response_model=List[MissionRead])
async def list_missions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).order_by(Mission.created_at.desc()))
    return result.scalars().all()


@router.get("/{mission_id}", response_model=MissionRead)
async def get_mission(mission_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    mission = result.scalar_one_or_none()
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")
    return mission


@router.post("/", response_model=MissionRead, status_code=status.HTTP_201_CREATED)
async def create_mission(payload: MissionCreate, db: AsyncSession = Depends(get_db)):
    mission = Mission(**payload.model_dump())
    db.add(mission)
    await db.commit()
    await db.refresh(mission)
    return mission


@router.put("/{mission_id}", response_model=MissionRead)
async def update_mission(mission_id: UUID, payload: MissionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    mission = result.scalar_one_or_none()
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(mission, field, value)
    db.add(mission)
    await db.commit()
    await db.refresh(mission)
    return mission


@router.delete("/{mission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mission(mission_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    mission = result.scalar_one_or_none()
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")
    await db.delete(mission)
    await db.commit()


@router.post("/{mission_id}/photos", status_code=status.HTTP_201_CREATED)
async def upload_mission_photos(
    mission_id: UUID,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    mission = result.scalar_one_or_none()
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

    uploaded = []
    errors = []
    storage_dir = Path(__file__).resolve().parents[4] / "storage" / "photos"
    storage_dir.mkdir(parents=True, exist_ok=True)

    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            errors.append({"file": file.filename, "error": "Format non supporté (JPEG/PNG/TIFF)"})
            continue

        content = await file.read()
        if len(content) > MAX_SIZE_BYTES:
            errors.append({"file": file.filename, "error": "Fichier trop lourd (max 20MB)"})
            continue

        try:
            gps = extract_gps(content)
        except ValueError as exc:
            errors.append({"file": file.filename, "error": str(exc)})
            continue

        safe_filename = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
        target_path = storage_dir / safe_filename
        target_path.write_bytes(content)
        storage_url = f"/storage/photos/{safe_filename}"

        location = WKTElement(f"POINT({gps.longitude} {gps.latitude})", srid=4326)

        photo = Photo(
            mission_id=mission_id,
            filename=file.filename,
            storage_url=storage_url,
            location=location,
            altitude_m=gps.altitude,
            captured_at=gps.captured_at,
        )
        db.add(photo)
        uploaded.append({"file": file.filename, "storage_url": storage_url})

    await db.commit()

    return {
        "uploaded": uploaded,
        "errors": errors,
        "mission_id": str(mission_id),
    }


@router.get("/{mission_id}/geojson")
async def get_mission_geojson(mission_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            Photo.id,
            Photo.filename,
            Photo.storage_url,
            Photo.altitude_m,
            ST_X(Photo.location).label("longitude"),
            ST_Y(Photo.location).label("latitude"),
        )
        .where(Photo.mission_id == mission_id)
        .order_by(Photo.captured_at.asc())
    )

    photos = result.all()
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [photo.longitude, photo.latitude],
            },
            "properties": {
                "id": str(photo.id),
                "filename": photo.filename,
                "storage_url": photo.storage_url,
                "altitude_m": photo.altitude_m,
            },
        }
        for photo in photos
    ]

    return {
        "type": "FeatureCollection",
        "features": features,
        "meta": {"count": len(features), "mission_id": str(mission_id)},
    }


@router.get("/{mission_id}/flightpath")
async def get_mission_flightpath(mission_id: UUID, db: AsyncSession = Depends(get_db)):
    mission = await db.get(Mission, mission_id)
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

    if mission.flight_path is None:
        return {"type": "FeatureCollection", "features": []}

    result = await db.execute(
        select(ST_AsGeoJSON(Mission.flight_path).label("geojson"))
        .where(Mission.id == mission_id)
    )
    geometry = result.scalar_one_or_none()

    if geometry is None:
        return {"type": "FeatureCollection", "features": []}

    if geometry == "null":
        return {"type": "FeatureCollection", "features": []}

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": json.loads(geometry),
                "properties": {"mission_id": str(mission_id)},
            }
        ],
    }


@router.get("/{mission_id}/detections")
async def get_mission_detections(mission_id: UUID, db: AsyncSession = Depends(get_db)):
    mission = await db.get(Mission, mission_id)
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

    return await mission_detections_geojson(db, mission_id)
