"""
Telegram Mini App init data validation.

Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
"""
import hashlib
import hmac
import json
from urllib.parse import parse_qsl, unquote

from fastapi import Header, HTTPException, status

from config import settings


def _build_data_check_string(init_data: str) -> tuple[str, dict]:
    """
    Parse initData query string, extract hash, build data-check-string
    as per Telegram spec.
    Returns (data_check_string, parsed_dict).
    """
    params = dict(parse_qsl(unquote(init_data), keep_blank_values=True))
    received_hash = params.pop("hash", "")

    # Keys must be sorted alphabetically
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(params.items())
    )
    return data_check_string, params, received_hash


def validate_init_data(init_data: str) -> dict:
    """
    Validates Telegram initData HMAC.
    Returns parsed user dict on success, raises HTTPException on failure.
    """
    if settings.skip_auth:
        # Dev mode — return a fake user
        return {"id": 999999, "first_name": "Dev", "username": "devuser"}

    if not init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Telegram init data",
        )

    try:
        data_check_string, params, received_hash = _build_data_check_string(init_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed init data",
        )

    # secret_key = HMAC-SHA256(bot_token, "WebAppData")
    secret_key = hmac.new(
        b"WebAppData",
        settings.bot_token.encode(),
        hashlib.sha256,
    ).digest()

    expected_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram signature",
        )

    user_raw = params.get("user")
    if not user_raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No user in init data",
        )

    try:
        return json.loads(user_raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed user payload",
        )


# FastAPI dependency — extracts & validates the Telegram user from the header
def get_current_user(
    x_telegram_init_data: str = Header(default=""),
) -> dict:
    return validate_init_data(x_telegram_init_data)
