import json
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.functions import ST_AsGeoJSON, ST_X, ST_Y
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models import Mission, Photo
from app.schemas.mission import MissionCreate, MissionRead, MissionUpdate


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
    mission = Mission(**payload.dict())
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
    for field, value in payload.dict(exclude_unset=True).items():
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
    result = await db.execute(
        select(ST_AsGeoJSON(Mission.flight_path).label("geojson"))
        .where(Mission.id == mission_id)
    )
    geometry = result.scalar_one_or_none()
    if geometry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission not found")

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
