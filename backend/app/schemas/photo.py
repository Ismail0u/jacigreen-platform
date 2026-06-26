from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PhotoBase(BaseModel):
    mission_id: UUID
    filename: str
    storage_url: str
    altitude_m: Optional[int] = None
    captured_at: Optional[datetime] = None
    source: Optional[str] = "drone"
    uploaded_by: Optional[UUID] = None


class PhotoCreate(PhotoBase):
    location: str


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
    latitude: float
    longitude: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
