from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

"""
Photo schema models for request and response validation.
These models are used to validate incoming request data and format outgoing response data for the Photo entity.
The PhotoBase model defines the common fields for creating and updating photos.
The PhotoCreate model is used for creating new photos, while the PhotoUpdate model is used for updating existing photos.
The PhotoRead model is used for formatting the response data when retrieving photo information.
"""

class PhotoBase(BaseModel):
    mission_id: UUID
    filename: str
    storage_url: str
    location: str
    altitude_m: Optional[int] = None
    captured_at: Optional[datetime] = None
    source: Optional[str] = "drone"
    uploaded_by: Optional[UUID] = None


class PhotoCreate(PhotoBase):
    pass


class PhotoUpdate(BaseModel):
    filename: Optional[str] = None
    storage_url: Optional[str] = None
    location: Optional[str] = None
    altitude_m: Optional[int] = None
    captured_at: Optional[datetime] = None
    source: Optional[str] = None
    uploaded_by: Optional[UUID] = None


class PhotoRead(PhotoBase):
    id: UUID
    created_at: datetime

    class Config:
        orm_mode = True
