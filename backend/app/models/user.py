import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, String, Boolean, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    COLLABORATOR = "collaborator"


class User(Base):
    """User model with role-based access control.
    
    Fields:
    - id: UUID primary key
    - email: unique identifier for login
    - password_hash: hashed credential (bcrypt)
    - role: admin or collaborator
    - first_name: user first name
    - last_name: user last name
    - is_active: account activation status
    - force_password_change: force password change at next login
    - last_login: timestamp of last successful login
    - created_at: account creation timestamp
    - updated_at: last update timestamp
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(500), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.COLLABORATOR)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    force_password_change = Column(Boolean, default=True, nullable=False)
    subscription_tier = Column(String(30), default="starter", nullable=False)
    subscription_status = Column(String(30), default="active", nullable=False)
    subscription_valid_until = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_user_email_active", "email", "is_active"),
    )
