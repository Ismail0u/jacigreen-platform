import time

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.auth import ChangePasswordRequest

client = TestClient(app)


@pytest.mark.asyncio
async def test_login_rate_limit_is_enforced():
    from app.api.v1.routes import auth as auth_routes

    auth_routes.login_attempts.clear()

    email = "demo@jacigreen.com"

    for _ in range(5):
        auth_routes.login_attempts[email].append(time.monotonic())

    with pytest.raises(HTTPException):
        auth_routes.check_login_rate_limit(email)


def test_security_headers_are_present_on_response():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert "referrer-policy" in response.headers


def test_password_policy_requires_strong_passwords():
    valid = ChangePasswordRequest.model_validate({
        "old_password": "OldPass123!",
        "new_password": "NewStrongPass456!",
        "confirm_password": "NewStrongPass456!",
    })
    assert valid.new_password == "NewStrongPass456!"

    with pytest.raises(ValidationError):
        ChangePasswordRequest.model_validate({
            "old_password": "OldPass123!",
            "new_password": "weakpass",
            "confirm_password": "weakpass",
        })
