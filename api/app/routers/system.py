from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/status")
async def get_system_status(request: Request):
    """Get system resource overview via Admin Agent (admin only)."""
    # TODO: Phase 4
    return {"message": "not implemented"}


@router.get("/config")
async def get_system_config(request: Request):
    """Get system configuration (admin only)."""
    # TODO: Phase 4
    return {"message": "not implemented"}
