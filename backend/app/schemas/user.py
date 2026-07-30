from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

"""
User schema definitions for handling user-related data across the application.
user.py defines Pydantic models for user creation, updating, reading, and authentication. These models ensure data validation and serialization for API requests and responses. The UserBase model serves as a base class for common user attributes, while UserCreate and UserUpdate extend it for specific use cases. UserRead is used for returning user information in API responses. TokenPayload and TokenResponse handle JWT token structures, and LoginRequest is used for user login requests. These schemas facilitate secure and consistent handling of user data throughout the application.
"""


class UserBase(BaseModel):
    email: EmailStr
    role: str = "collaborator"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    subscription_tier: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_valid_until: Optional[datetime] = None


class UserRead(UserBase):
    id: UUID
    is_active: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    force_password_change: bool
    subscription_tier: str
    subscription_status: str
    subscription_valid_until: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TokenPayload(BaseModel):
    sub: str  # user ID
    exp: datetime
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
