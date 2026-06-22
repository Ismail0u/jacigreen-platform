import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class AIAnalysisTask(Base):
    """Background AI analysis task metadata.

    Fields:
    - id: UUID
    - celery_task_id: string
    - mission_id: UUID
    - status: string
    - model_version: string
    - confidence_threshold: float
    - created_at, completed_at, error_message
    """
    __tablename__ = "ai_analysis_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    celery_task_id = Column(String(255), nullable=True)
    mission_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(String(50), nullable=True)
    model_version = Column(String(100), nullable=True)
    confidence_threshold = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(String(2000), nullable=True)
