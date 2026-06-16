import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.core.database import Base


class Mission(Base):
    """Mission model representing a flight/operation.

    Fields aligned with ERD:
    - id, name, status
    - mission_date : date of mission
    - flight_path : geometry (LineString)
    - zone_id -> Zones.id
    - operator_id -> Users.id
    - notes, created_at, completed_at
    """
    __tablename__ = "missions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="draft", nullable=False)
    mission_date = Column(DateTime(timezone=True), nullable=True)
    flight_path = Column(Geometry("LINESTRING", srid=4326), nullable=True)
    zone_id = Column(UUID(as_uuid=True), nullable=True)
    operator_id = Column(UUID(as_uuid=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    photos = relationship("Photo", back_populates="mission", cascade="all, delete-orphan")
