from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from .. import database, schemas, auth
from ..services import streams as service

router = APIRouter()

@router.get("/streams")
def get_streams(
    class_id: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    return service.get_streams(db, class_id)

@router.post("/streams")
def create_stream(
    stream_in: schemas.StreamCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.create_stream(db, stream_in)

@router.patch("/streams/{stream_uuid}")
def update_stream(
    stream_uuid: str,
    stream_in: schemas.StreamUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.update_stream(db, stream_uuid, stream_in)

@router.delete("/streams/{stream_uuid}")
def delete_stream(
    stream_uuid: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.delete_stream(db, stream_uuid)
