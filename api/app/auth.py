"""Auth middleware — decode JWT from X-Auth-Request-Access-Token header.

In production, OAuth2-Proxy validates the JWT at the trust boundary.
The API just base64-decodes the payload to extract user claims.
In local dev, a mock JWT is injected by docker-compose (see mock-auth/).
"""

import base64
import json
from dataclasses import dataclass

from fastapi import HTTPException, Request


@dataclass
class UserClaims:
    """Decoded JWT claims for the current user."""

    oid: str  # B2C object ID
    email: str
    status: str  # pending | approved | active | revoked
    role: str  # user | admin
    username: str | None = None
    container_port: int | None = None


B2C_EXT_PREFIX = "extension_3575970a911e4699ad1ccc1a507d2312_"


def get_current_user(request: Request) -> UserClaims:
    """Extract user claims from the JWT in the X-Auth-Request-Access-Token header.

    OAuth2-Proxy has already validated the token. We just base64-decode the payload.
    """
    token = request.headers.get("X-Auth-Request-Access-Token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing auth token")

    try:
        # JWT is 3 parts separated by dots: header.payload.signature
        payload_b64 = token.split(".")[1]
        # Add padding if needed
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
    except (IndexError, ValueError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    return UserClaims(
        oid=payload.get("oid", ""),
        email=payload.get("emails", [payload.get("email", "")])[0],
        status=payload.get(f"{B2C_EXT_PREFIX}Status", "pending"),
        role=payload.get(f"{B2C_EXT_PREFIX}Role", "user"),
        username=payload.get(f"{B2C_EXT_PREFIX}Username"),
        container_port=payload.get(f"{B2C_EXT_PREFIX}ContainerPort"),
    )
