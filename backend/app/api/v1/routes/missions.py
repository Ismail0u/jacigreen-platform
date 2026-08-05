import json
import uuid
from pathlib import Path
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from geoalchemy2 import WKTElement
from geoalchemy2.functions import ST_AsGeoJSON, ST_X, ST_Y
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_admin
from app.models.user import User, UserRole
from app.models import Mission, Photo
from app.models.detection import Detection
from app.schemas.mission import MissionAssigneeUpdate, MissionCreate, MissionRead, MissionUpdate
from app.services.detection_geojson import mission_detections_geojson
from app.services.exif_service import GpsData, extract_gps
from app.services.mission_report import build_mission_report_payload

from app.services.storage import upload_photo

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/tiff"}
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


"""
API routes for managing missions, including listing, creating, updating, deleting missions, uploading photos,
 retrieving mission data in GeoJSON format, and generating mission reports. Access to certain endpoints is restricted based on user roles (admin or collaborator).
 Endpoints:
 - GET /missions: List all missions
 - GET /missions/{mission_id}: Get a specific mission
 - POST /missions: Create a new mission
 - PUT /missions/{mission_id}: Update a specific mission
 - PUT /missions/{mission_id}/assignee: Assign a collaborator to a mission
 """
router = APIRouter(prefix="/missions", tags=["missions"])


async def _get_accessible_mission(db: AsyncSession, mission_id: UUID, current_user: User) -> Mission:
    """Return a mission only when the current user is allowed to access it."""
    statement = select(Mission).where(Mission.id == mission_id)
    if current_user.role != UserRole.ADMIN:
        statement = statement.where(Mission.operator_id == current_user.id)

    mission = (await db.execute(statement)).scalar_one_or_none()
    if mission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission introuvable ou non autorisée",
        )
    return mission


@router.get("/", response_model=List[MissionRead])
async def list_missions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all missions for administrators, or only assigned missions for collaborators."""
    statement = select(Mission).order_by(Mission.created_at.desc())
    if current_user.role != UserRole.ADMIN:
        statement = statement.where(Mission.operator_id == current_user.id)
    result = await db.execute(statement)
    return result.scalars().all()


@router.get("/{mission_id}", response_model=MissionRead)
async def get_mission(
    mission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_accessible_mission(db, mission_id, current_user)


@router.post("/", response_model=MissionRead, status_code=status.HTTP_201_CREATED)
async def create_mission(
    payload: MissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    data = payload.model_dump()
    # If operator_id is not provided, set to current user
    if not data.get('operator_id'):
        data['operator_id'] = getattr(current_user, 'id')
    mission = Mission(**data)
    db.add(mission)
    await db.commit()
    await db.refresh(mission)
    return mission


@router.put("/{mission_id}", response_model=MissionRead)
async def update_mission(
    mission_id: UUID,
    payload: MissionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
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


@router.put("/{mission_id}/assignee", response_model=MissionRead)
async def assign_collaborator(
    mission_id: UUID,
    payload: MissionAssigneeUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Assign a collaborator to a mission. Administrators retain access to every mission."""
    mission = await db.get(Mission, mission_id)
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable")

    collaborator = await db.get(User, payload.collaborator_id)
    if collaborator is None or not collaborator.is_active or collaborator.role != UserRole.COLLABORATOR:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Le collaborateur sélectionné est introuvable ou inactif",
        )

    mission.operator_id = collaborator.id
    db.add(mission)
    await db.commit()
    await db.refresh(mission)
    return mission


@router.delete("/{mission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mission(mission_id: UUID, db: AsyncSession = Depends(get_db), _admin: User = Depends(require_admin)):
    mission = await db.get(Mission, mission_id)
    if mission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable")
    await db.delete(mission)
    await db.commit()


@router.post("/{mission_id}/photos", status_code=status.HTTP_201_CREATED)
async def upload_mission_photos(
    mission_id: UUID,
    files: list[UploadFile] = File(...),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    altitude_m: float | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload mission photos and locate them with EXIF or supplied GPS coordinates.

    Drone images normally contain EXIF GPS data. Mobile captures often do not, so
    the client can provide a pair of WGS84 coordinates as an explicit fallback.
    """
    await _get_accessible_mission(db, mission_id, current_user)

    if (latitude is None) != (longitude is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Latitude and longitude must be provided together",
        )
    if latitude is not None and not -90 <= latitude <= 90:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid latitude")
    if longitude is not None and not -180 <= longitude <= 180:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid longitude")

    uploaded = []
    errors = []
    #storage_dir = Path(__file__).resolve().parents[4] / "storage" / "photos"
    #storage_dir.mkdir(parents=True, exist_ok=True)

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
            source = "drone"
        except ValueError as exc:
            if latitude is None or longitude is None:
                errors.append({"file": file.filename, "error": str(exc)})
                continue
            gps = GpsData(latitude=latitude, longitude=longitude, altitude=altitude_m)
            source = "mobile"

        safe_filename = f"{uuid.uuid4().hex}_{Path(file.filename).name}"

        storage_url = upload_photo(
            filename=safe_filename,
            content=content,
            content_type=file.content_type,
        )

        location = WKTElement(f"POINT({gps.longitude} {gps.latitude})", srid=4326)

        photo = Photo(
            mission_id=mission_id,
            filename=file.filename,
            storage_url=storage_url,
            location=location,
            altitude_m=gps.altitude,
            captured_at=gps.captured_at,
            source=source,
            uploaded_by=getattr(current_user, 'id', None),
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
async def get_mission_geojson(
    mission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_accessible_mission(db, mission_id, current_user)
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
async def get_mission_flightpath(
    mission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mission = await _get_accessible_mission(db, mission_id, current_user)

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
async def get_mission_detections(
    mission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_accessible_mission(db, mission_id, current_user)

    return await mission_detections_geojson(db, mission_id)


@router.get("/{mission_id}/report")
async def get_mission_report(
    mission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mission = await _get_accessible_mission(db, mission_id, current_user)

    photo_result = await db.execute(select(Photo).where(Photo.mission_id == mission_id))
    photos = photo_result.scalars().all()

    detection_result = await db.execute(select(Detection).where(Detection.mission_id == mission_id))
    detections = detection_result.scalars().all()

    return build_mission_report_payload(mission, photos, detections)
