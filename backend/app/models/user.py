import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class User(Base):
    """User model.

    Fields based on ERD:
    - id: UUID primary key
    - email: unique identifier for login
    - password_hash: hashed credential (never store plaintext)
    - role: simple role string (e.g. admin, operator)
    - created_at: record creation timestamp
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(500), nullable=False)
    role = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
