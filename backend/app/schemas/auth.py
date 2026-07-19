"""Pydantic schemas for authentication endpoints."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class LoginRequest(BaseModel):
    """Login request with email and password."""
    email: EmailStr
    password: str = Field(..., min_length=6)


class ChangePasswordRequest(BaseModel):
    """Change password request."""
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    class Config:
        json_schema_extra = {
            "example": {
                "old_password": "currentPass123",
                "new_password": "newSecurePass2026",
                "confirm_password": "newSecurePass2026"
            }
        }


class TokenResponse(BaseModel):
    """Token response with access and refresh tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


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


class ResetPasswordRequest(BaseModel):
    """Reset password request."""
    user_id: UUID


class ResetPasswordResponse(BaseModel):
    """Reset password response with temporary password."""
    temporary_password: str
    message: str = "Temporary password generated. User must change it on first login."
