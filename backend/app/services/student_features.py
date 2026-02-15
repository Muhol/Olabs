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

# Announcements
def create_announcement(db: Session, announcement_in: schemas.AnnouncementCreate, performer_id: str):
    announcement = models.Announcement(
        id=uuid.uuid4(),
        **announcement_in.dict(),
        created_by_id=performer_id,
        created_at=datetime.datetime.utcnow()
    )
    db.add(announcement)
    db.commit()
    return announcement
