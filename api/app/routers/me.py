from fastapi import APIRouter, Request

router = APIRouter()


@router.get("")
async def get_current_user(request: Request):
    """Get current user info from B2C via Graph API."""
    # TODO: Phase 4 — decode JWT from X-Auth-Request-Access-Token,
    # fetch user details from Graph API
    return {"message": "not implemented"}


@router.get("/agent")
async def get_agent_status(request: Request):
    """Get current user's agent container status via Admin Agent."""
    # TODO: Phase 4 — call Admin Agent sidecar
    return {"status": "unknown"}


@router.post("/agent/restart")
async def restart_agent(request: Request):
    """Restart current user's agent container."""
    # TODO: Phase 4 — call Admin Agent sidecar
    return {"message": "not implemented"}


@router.put("/settings")
async def update_settings(request: Request):
    """Update current user's settings."""
    # TODO: Phase 4
    return {"message": "not implemented"}
