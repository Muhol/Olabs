from fastapi import APIRouter, Depends
from .. import auth

router = APIRouter()

@router.get("/auth/me")
def get_me(current_user: dict = Depends(auth.get_current_user)):
    """
    Returns the current user's database record.
    The get_current_user dependency ensures the DB is synced with Clerk.
    """
    return {
        "id": current_user.get("id"),
        "clerk_id": current_user.get("clerk_id") or current_user.get("id_"), # Compatibility
        "full_name": current_user.get("full_name"),
        "email": current_user.get("email"),
        "role": current_user.get("role"),
        "assigned_class_id": current_user.get("assigned_class_id"),
        "assigned_stream_id": current_user.get("assigned_stream_id")
    }
