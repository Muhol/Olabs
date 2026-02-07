from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import database, schemas, auth
from ..services import classes as service

router = APIRouter()

@router.get("/classes")
def get_classes(
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    return service.get_classes(db)

@router.post("/classes")
def create_class(
    class_in: schemas.ClassCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.create_class(db, class_in, current_user["email"])

@router.delete("/classes/{class_uuid}")
def delete_class(
    class_uuid: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.delete_class(db, class_uuid, current_user["email"])
