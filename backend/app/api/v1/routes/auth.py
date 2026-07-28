"""Authentication API routes for login, token management, and password changes."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_admin
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    generate_temporary_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    ChangePasswordRequest,
    RefreshTokenRequest,
    UserResponse,
    UserCreateResponse,
    UserCreateRequest,
    UserUpdateRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])

"""Authentication and user management endpoints.
This module provides endpoints for user login, token management (access and refresh tokens), password changes,
 and admin-only user management operations such as creating, updating, resetting passwords, and deleting users.
 Endpoints:
auth/login: User login with email and password, returns access and refresh tokens.
auth/refresh: Refresh access token using a valid refresh token.
auth/change-password: Change password for the current authenticated user.
auth/me: Get current authenticated user information.
auth/logout: Logout the current user (token revocation can be implemented in production).
Admin-only endpoints:
auth/admin/users: Create a new user (collaborator) with a temporary password.
auth/admin/users/{user_id}: Update user details.
auth/admin/users/{user_id}/reset-password: Reset user password to a temporary value.
auth/admin/users/{user_id}: Delete user (soft delete by marking as inactive).
"""

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password.
    
    On first login, returns tokens but user must change password via /change-password endpoint.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.add(user)
    await db.commit()

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=15 * 60,  # 15 minutes in seconds
    )


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token."""
    # Note: In production, verify refresh token properly and check it's not revoked
    from app.core.security import decode_token_payload

    token_payload = decode_token_payload(payload.refresh_token)
    user_id = token_payload.get("sub") if token_payload and token_payload.get("type") == "refresh" else None

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=15 * 60,
    )


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password. Required on first login (force_password_change = True)."""
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match",
        )

    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect",
        )

    # Update password and clear force_password_change flag
    current_user.password_hash = hash_password(payload.new_password)
    current_user.force_password_change = False
    db.add(current_user)
    await db.commit()

    return {"message": "Password changed successfully"}


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return UserResponse.model_validate(current_user)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: User = Depends(get_current_user)):
    """Logout current user. In production, could revoke tokens."""
    return {"message": "Logged out successfully"}


# Admin-only endpoints for user management

@router.post("/admin/users", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create new collaborator (admin only).
    
    Generates temporary password that must be changed on first login.
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    temp_password = generate_temporary_password()

    new_user = User(
        email=payload.email,
        password_hash=hash_password(temp_password),
        role=payload.role or UserRole.COLLABORATOR,
        first_name=payload.first_name,
        last_name=payload.last_name,
        is_active=True,
        force_password_change=True,  # Must change password on first login
        subscription_tier=payload.subscription_tier,
        subscription_status=payload.subscription_status,
        subscription_valid_until=payload.subscription_valid_until,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserCreateResponse.model_validate({
        **UserResponse.model_validate(new_user).model_dump(),
        "temporary_password": temp_password,
    })


@router.put("/admin/users/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(
    user_id: UUID,
    payload: UserUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update user details (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update fields if provided
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(user, field, value)

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/admin/users/{user_id}/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Reset user password to temporary value (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    temp_password = generate_temporary_password()
    user.password_hash = hash_password(temp_password)
    user.force_password_change = True
    db.add(user)
    await db.commit()

    return ResetPasswordResponse(temporary_password=temp_password)


@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete user (admin only). This is a soft delete (marks is_active = False)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Soft delete: just mark as inactive
    user.is_active = False
    db.add(user)
    await db.commit()
