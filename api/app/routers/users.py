from fastapi import APIRouter, Request

router = APIRouter()


@router.get("")
async def list_users(request: Request):
    """List all users (admin only)."""
    # TODO: Phase 4 — Graph API query
    return {"users": []}


@router.post("/{user_id}/approve")
async def approve_user(user_id: str, request: Request):
    """Approve a pending user and queue provisioning."""
    # TODO: Phase 4
    return {"message": "not implemented"}


@router.post("/{user_id}/reject")
async def reject_user(user_id: str, request: Request):
    """Reject a pending user."""
    # TODO: Phase 4
    return {"message": "not implemented"}


@router.post("/{user_id}/revoke")
async def revoke_user(user_id: str, request: Request):
    """Revoke an active user's access."""
    # TODO: Phase 4
    return {"message": "not implemented"}


@router.delete("/{user_id}")
async def delete_user(user_id: str, request: Request):
    """Soft delete a user."""
    # TODO: Phase 4
    return {"message": "not implemented"}
