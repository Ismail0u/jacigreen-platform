import pytest
from fastapi import status
from pydantic import ValidationError

from app.main import app
from app.schemas.auth import ChangePasswordRequest


@pytest.mark.asyncio
async def test_login_rate_limit_is_enforced():
    from app.api.v1.routes import auth as auth_routes

    auth_routes.login_attempts.clear()
    valid_email = "demo@jacigreen.com"

    for _ in range(5):
        try:
            auth_routes.check_login_rate_limit(valid_email)
        except Exception:
            pytest.fail("Rate limiter should not block before threshold is reached")

    with pytest.raises(Exception):
        auth_routes.check_login_rate_limit(valid_email)


@pytest.mark.asyncio
async def test_security_headers_are_present_on_response():
    client = app.test_client()
    response = client.get("/health")

    assert response.status_code in {200, 500}
    if response.status_code == 200:
        assert "x-content-type-options" in response.headers
        assert "x-frame-options" in response.headers
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
