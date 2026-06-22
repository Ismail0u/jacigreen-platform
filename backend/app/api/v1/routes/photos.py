from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models import Photo
from app.schemas.photo import PhotoCreate, PhotoRead, PhotoUpdate
"""Photo API routes.
This module defines the API routes for managing photos in the JACIGREEN DroneSurveillance application. It includes endpoints for listing, retrieving, creating, updating, and deleting photos. Each endpoint interacts with the database through the async session. 
    The routes are organized under the "/photos" prefix and are tagged as "photos" for API documentation purposes. The endpoints use Pydantic schemas for request validation and response serialization.
    The list_photos endpoint retrieves all photos, while the get_photo endpoint retrieves a specific photo by its ID. The create_photo endpoint allows for creating a new photo, and the update_photo endpoint allows for updating an existing photo. Finally, the delete_photo endpoint allows for deleting a photo by its ID.
"""

router = APIRouter(prefix="/photos", tags=["photos"])


@router.get("/", response_model=List[PhotoRead])
async def list_photos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Photo).order_by(Photo.created_at.desc()))
    return result.scalars().all()


@router.get("/{photo_id}", response_model=PhotoRead)
async def get_photo(photo_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Photo).where(Photo.id == photo_id))
    photo = result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    return photo


@router.post("/", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
async def create_photo(payload: PhotoCreate, db: AsyncSession = Depends(get_db)):
    photo = Photo(**payload.dict())
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    return photo


@router.put("/{photo_id}", response_model=PhotoRead)
async def update_photo(photo_id: UUID, payload: PhotoUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Photo).where(Photo.id == photo_id))
    photo = result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(photo, field, value)
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    return photo


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(photo_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Photo).where(Photo.id == photo_id))
    photo = result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    await db.delete(photo)
    await db.commit()
