"""Shared types and constants for Pocket Smyth Portal.

Used by the Control Plane API (FastAPI) and Provisioning Functions.
"""

from enum import StrEnum

# --- B2C Custom Attribute Prefix ---

B2C_EXT_PREFIX = "extension_3575970a911e4699ad1ccc1a507d2312_"


# --- User Status ---


class UserStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    ACTIVE = "active"
    REVOKED = "revoked"


class UserRole(StrEnum):
    USER = "user"
    ADMIN = "admin"


# --- Agent State ---


class AgentState(StrEnum):
    RUNNING = "running"
    STOPPED = "stopped"
    STARTING = "starting"
    ERROR = "error"
    UNKNOWN = "unknown"


# --- Username Validation ---

USERNAME_MIN_LENGTH = 4
USERNAME_MAX_LENGTH = 10
USERNAME_PATTERN = r"^[a-z0-9][a-z0-9-]*[a-z0-9]$"

RESERVED_USERNAMES = frozenset(
    {
        "admin",
        "app",
        "www",
        "api",
        "mail",
        "portal",
        "system",
        "root",
        "public",
        "static",
        "login",
        "dev",
    }
)
