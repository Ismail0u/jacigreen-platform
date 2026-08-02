"""Pydantic schemas for authentication endpoints."""

from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    """Login request with email and password."""
    email: EmailStr
    password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    """Change password request."""
    old_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must contain at least 8 characters")
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one number")
        if not any(not char.isalnum() for char in value):
            raise ValueError("Password must contain at least one special character")
        return value

    class Config:
        json_schema_extra = {
            "example": {
                "old_password": "CurrentPass123!",
                "new_password": "NewSecurePass2026!",
                "confirm_password": "NewSecurePass2026!"
            }
        }


class TokenResponse(BaseModel):
    """Token response with access and refresh tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    requires_password_change: bool = False


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


class UserResponse(BaseModel):
    """User response for API responses."""
    id: UUID
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    force_password_change: bool
    subscription_tier: str
    subscription_status: str
    subscription_valid_until: Optional[datetime] = None
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreateRequest(BaseModel):
    """Create user request (admin only)."""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str = "collaborator"
    subscription_tier: str = "starter"
    subscription_status: str = "active"
    subscription_valid_until: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "collaborator@jacigreen.com",
                "first_name": "Ismael",
                "last_name": "Moussa",
                "role": "collaborator"
            }
        }


class UserUpdateRequest(BaseModel):
    """Update user request (admin only)."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    subscription_tier: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_valid_until: Optional[datetime] = None


class UserCreateResponse(UserResponse):
    """A newly-created account exposes its temporary password exactly once."""

    temporary_password: str


class ResetPasswordRequest(BaseModel):
    """Reset password request."""
    user_id: UUID


class ResetPasswordResponse(BaseModel):
    """Reset password response with temporary password."""
    temporary_password: str
    message: str = "Temporary password generated. User must change it on first login."
