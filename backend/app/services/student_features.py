from sqlalchemy.orm import Session
from .. import models, schemas
import uuid
import datetime

# Attendance
def record_attendance(db: Session, student_id: str, status: str, subject_id: str = None, remarks: str = None):
    attendance = models.Attendance(
        id=uuid.uuid4(),
        student_id=student_id,
        subject_id=subject_id,
        status=status,
        remarks=remarks,
        date=datetime.datetime.utcnow()
    )
    db.add(attendance)
    db.commit()
    return attendance

# Timetable
def add_timetable_entry(db: Session, entry_in: schemas.TimetableEntryCreate):
    entry = models.TimetableEntry(
        id=uuid.uuid4(),
        **entry_in.dict()
    )
    db.add(entry)
    db.commit()
    return entry

from fastapi import HTTPException, status

# Announcements
def create_announcement(db: Session, announcement_in: schemas.AnnouncementCreate, user: dict):
    role = user["role"]
    user_id = user["id"]
    category = announcement_in.category

    # 1. Basic Permission Checks
    if category in ["SCHOOL", "STAFF"] and role not in ["admin", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only administrators can create {category} announcements."
        )

    # 2. Teacher-specific restrictions
    if role == "teacher":
        if category == "STREAM":
            if not announcement_in.stream_id:
                 raise HTTPException(status_code=400, detail="Stream ID is required for STREAM announcements.")
            # Check if teacher is assigned to this stream (either as class teacher or subject teacher)
            is_assigned = db.query(models.User).filter(
                models.User.id == user_id,
                models.User.assigned_stream_id == announcement_in.stream_id
            ).first() or db.query(models.TeacherSubjectAssignment).filter(
                models.TeacherSubjectAssignment.teacher_id == user_id,
                models.TeacherSubjectAssignment.stream_id == announcement_in.stream_id
            ).first()
            
            if not is_assigned:
                raise HTTPException(status_code=403, detail="You can only create announcements for your assigned streams.")

        elif category == "SUBJECT":
            if not announcement_in.subject_id:
                 raise HTTPException(status_code=400, detail="Subject ID is required for SUBJECT announcements.")
            # Check if teacher is assigned to this subject
            is_assigned = db.query(models.TeacherSubjectAssignment).filter(
                models.TeacherSubjectAssignment.teacher_id == user_id,
                models.TeacherSubjectAssignment.subject_id == announcement_in.subject_id
            ).first()
            if not is_assigned:
                raise HTTPException(status_code=403, detail="You can only create announcements for your assigned subjects.")

    # 3. Create the announcement
    announcement = models.Announcement(
        id=uuid.uuid4(),
        **announcement_in.dict(),
        created_by_id=user_id,
        created_at=datetime.datetime.utcnow()
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement

def get_announcements(db: Session, user: dict):
    role = user["role"]
    user_id = user["id"]

    query = db.query(models.Announcement)

    if role in ["admin", "SUPER_ADMIN"]:
        # Admins see everything
        return query.order_by(models.Announcement.created_at.desc()).all()
    
    # Teachers and others see SCHOOL, STAFF, and items related to their assignments
    from sqlalchemy import or_
    announcements = query.filter(
        or_(
            models.Announcement.category.in_(["SCHOOL", "STAFF"]),
            # Their own created ones
            models.Announcement.created_by_id == user_id,
            # Stream-specific if they are assigned
            (models.Announcement.category == "STREAM") & models.Announcement.stream_id.in_(
                db.query(models.Stream.id).filter(
                    or_(
                        models.User.id == user_id, # If they are assigned to this stream in User table
                        models.TeacherSubjectAssignment.teacher_id == user_id
                    )
                )
            ),
            # Subject-specific
            (models.Announcement.category == "SUBJECT") & models.Announcement.subject_id.in_(
                db.query(models.Subject.id).join(models.TeacherSubjectAssignment).filter(
                    models.TeacherSubjectAssignment.teacher_id == user_id
                )
            )
        )
    ).order_by(models.Announcement.created_at.desc()).all()
    
    return announcements

def delete_announcement(db: Session, announcement_id: str, user: dict):
    announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Permission check: Author or admin
    if str(announcement.created_by_id) != str(user["id"]) and user["role"] not in ["admin", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this announcement")
    
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}
