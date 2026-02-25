from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import database, schemas, auth
from ..services import users as service

router = APIRouter()

from typing import Optional

@router.get("/staff")
def get_staff(
    search: Optional[str] = None,
    role_filter: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.get_staff(db, search, role_filter)

    return service.update_user_role(db, user_uuid, role_update, current_user)

@router.get("/users/{user_uuid}")
def get_user_details(
    user_uuid: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    # Allow self-fetching or admin access
    if current_user["role"] not in ["admin", "SUPER_ADMIN"] and current_user["id"] != user_uuid:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Insufficient permissions")
        
    return service.get_user_details(db, user_uuid)
