from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
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
    return service.create_announcement(db, announcement_in, current_user)

@router.get("/announcements", response_model=List[schemas.AnnouncementResponse])
def list_announcements(
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN", "teacher", "librarian"]))
):
    announcements = service.get_announcements(db, current_user)
    
    # Populate names for response
    for ann in announcements:
        ann.author_name = ann.author.full_name if ann.author else "Unknown"
        ann.class_name = ann.assigned_class.name if ann.assigned_class else None
        ann.stream_name = ann.assigned_stream.name if ann.assigned_stream else None
        ann.subject_name = ann.subject.name if ann.subject else None
        
        # Friendly target name
        if ann.category == "SCHOOL":
            ann.target_name = "Whole School"
        elif ann.category == "STREAM" and ann.assigned_stream:
            class_obj = ann.assigned_class or ann.assigned_stream.parent_class
            class_name = class_obj.name if class_obj else ""
            ann.target_name = f"{class_name}. {ann.assigned_stream.name}".strip(". ")
        elif ann.category == "SUBJECT" and ann.subject:
            class_name = ann.assigned_class.name if ann.assigned_class else (ann.subject.assigned_class.name if ann.subject.assigned_class else "")
            stream_name = ann.assigned_stream.name if ann.assigned_stream else (ann.subject.assigned_stream.name if ann.subject.assigned_stream else "")
            
            target = f"{ann.subject.name}"
            context = f"{class_name}. {stream_name}".strip(". ")
            if context:
                target += f" ({context})"
            ann.target_name = target
        elif ann.category == "STAFF":
            ann.target_name = "Staff Only"
        
    return announcements

@router.delete("/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN", "teacher"]))
):
    return service.delete_announcement(db, announcement_id, current_user)
