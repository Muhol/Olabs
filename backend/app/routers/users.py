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

@router.patch("/users/{user_uuid}/role")
def update_user_role(
    user_uuid: str,
    role_update: schemas.UserRoleUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.update_user_role(db, user_uuid, role_update, current_user)
