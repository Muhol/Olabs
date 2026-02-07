from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from .. import database, schemas, auth
from ..services import students as service

router = APIRouter()

@router.get("/students")
def get_students(
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    class_id: Optional[str] = None,
    stream_id: Optional[str] = None
):
    return service.get_students(db, skip, limit, search, class_id, stream_id)

@router.post("/students")
def create_student(
    student_in: schemas.StudentCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.create_student(db, student_in)

@router.patch("/students/{student_uuid}")
def update_student(
    student_uuid: str,
    student_in: schemas.StudentUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.update_student(db, student_uuid, student_in)

@router.delete("/students/{student_uuid}")
def delete_student(
    student_uuid: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.delete_student(db, student_uuid)
