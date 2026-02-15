from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database, auth, schemas
from ..services import student_features as service

router = APIRouter()

@router.post("/attendance")
def record_attendance(
    attendance_in: schemas.AttendanceCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN", "teacher"]))
):
    return service.record_attendance(
        db, 
        str(attendance_in.student_id), 
        attendance_in.status, 
        str(attendance_in.subject_id) if attendance_in.subject_id else None, 
        attendance_in.remarks
    )

@router.post("/timetable")
def add_timetable_entry(
    entry_in: schemas.TimetableEntryCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.add_timetable_entry(db, entry_in)

@router.post("/announcements")
def create_announcement(
    announcement_in: schemas.AnnouncementCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN", "teacher"]))
):
    return service.create_announcement(db, announcement_in, current_user["id"])
