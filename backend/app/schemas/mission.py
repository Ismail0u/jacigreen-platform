from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

"""
Mission schema models for request and response validation.
These models are used to validate incoming request data and format outgoing response data for the Mission entity.
The MissionBase model defines the common fields for creating and updating missions.
The MissionCreate model is used for creating new missions, while the MissionUpdate model is used for updating existing missions.
The MissionRead model is used for formatting the response data when retrieving mission information.
"""
class MissionBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "draft"
    mission_date: Optional[datetime] = None
    flight_path: Optional[str] = None
    zone_id: Optional[UUID] = None
    operator_id: Optional[UUID] = None
    notes: Optional[str] = None


class MissionCreate(MissionBase):
    pass


class MissionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    mission_date: Optional[datetime] = None
    zone_id: Optional[UUID] = None
    operator_id: Optional[UUID] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None


class MissionRead(MissionBase):
    id: UUID
    created_at: datetime
    completed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
