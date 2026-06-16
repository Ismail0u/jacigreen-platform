import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry

from app.core.database import Base


class Zone(Base):
    """Zones represent geographic areas of interest.

    Fields:
    - id: UUID
    - name: human readable name
    - boundary: geometry (MULTIPOLYGON)
    - created_by: user id UUID
    - created_at: timestamp
    """
    __tablename__ = "zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    boundary = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)
    created_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
