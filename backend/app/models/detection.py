import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from sqlalchemy.orm import relationship

from app.core.database import Base


class Detection(Base):
    """Detection of an object within a photo.

    ERD fields mapped here: photo_id, mission_id, species, confidence, confidence_label,
    bbox_x/bbox_y/bbox_width/bbox_height, location, area_m2, verified, verified_by, model_version, created_at
    """
    __tablename__ = "detections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    photo_id = Column(UUID(as_uuid=True), ForeignKey("photos.id"), nullable=False)
    mission_id = Column(UUID(as_uuid=True), nullable=True)
    species = Column(String(150), nullable=True)
    confidence = Column(Float, nullable=True)
    confidence_label = Column(String(50), nullable=True)
    bbox_x = Column(Integer, nullable=True)
    bbox_y = Column(Integer, nullable=True)
    bbox_width = Column(Integer, nullable=True)
    bbox_height = Column(Integer, nullable=True)
    location = Column(Geometry("POINT", srid=4326), nullable=True)
    area_m2 = Column(Float, nullable=True)
    verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(UUID(as_uuid=True), nullable=True)
    model_version = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    photo = relationship("Photo", back_populates="detections")
