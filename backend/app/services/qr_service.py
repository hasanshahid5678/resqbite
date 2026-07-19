import base64
import io
import uuid
from datetime import datetime, timedelta, timezone

import qrcode
from jose import jwt

from app.config import settings


def _sign_payload(payload: dict) -> str:
    payload = {**payload, "exp": datetime.now(timezone.utc) + timedelta(days=2), "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.QR_SECRET_KEY, algorithm="HS256")


def generate_qr_data_url(reservation_id, customer_id: int, listing_id: int) -> tuple[str, str]:
    """Return (qr_token, data_url_png_b64)."""
    payload = {
        "rid": str(reservation_id),
        "cid": customer_id,
        "lid": listing_id,
    }
    token = _sign_payload(payload)

    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode("ascii")
    data_url = f"data:image/png;base64,{b64}"
    return token, data_url


def decode_qr_token(token: str) -> dict:
    return jwt.decode(token, settings.QR_SECRET_KEY, algorithms=["HS256"])


def new_id() -> str:
    return str(uuid.uuid4())