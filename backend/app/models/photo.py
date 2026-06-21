import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.core.database import Base


class Photo(Base):
    """Photo captured during a `Mission`.

    Fields (ERD-aligned): mission_id, storage_url, location (POINT), altitude_m, captured_at, source, uploaded_by
    """
    __tablename__ = "photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mission_id = Column(UUID(as_uuid=True), ForeignKey("missions.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    storage_url = Column(String(1000), nullable=False)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    altitude_m = Column(Integer, nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=True)
    source = Column(String(50), default="drone", nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    mission = relationship("Mission", back_populates="photos")
    detections = relationship("Detection", back_populates="photo", cascade="all, delete-orphan")
