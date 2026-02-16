from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import datetime

from .. import models, schemas, database, auth

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

@router.post("/submit", response_model=schemas.AttendanceSessionResponse)
def submit_attendance(
    data: schemas.AttendanceBulkSubmit,
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Validate that timetable_slot_id is provided
    if not data.timetable_slot_id:
        raise HTTPException(
            status_code=400,
            detail="Timetable slot ID is required for attendance submission"
        )
    
    # Check if session exists for this subject, date, AND timetable slot
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.subject_id == data.subject_id,
        models.AttendanceSession.session_date == data.date,
        models.AttendanceSession.timetable_slot_id == data.timetable_slot_id
    ).first()

    if not session:
        # Create new session
        session = models.AttendanceSession(
            subject_id=data.subject_id,
            timetable_slot_id=data.timetable_slot_id,
            session_date=data.date,
            teacher_id=UUID(current_user['id']),
            status="submitted",
            submitted_at=datetime.datetime.utcnow()
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    else:
        # Update existing session details
        session.teacher_id = UUID(current_user['id']) # Update teacher if changed
        session.status = "submitted"
        session.submitted_at = datetime.datetime.utcnow()
        db.commit()

    # Process records
    for item in data.students:
        # Check if record exists
        record = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.attendance_session_id == session.id,
            models.AttendanceRecord.student_id == item.student_id
        ).first()

        if record:
            record.status = item.status
        else:
            record = models.AttendanceRecord(
                attendance_session_id=session.id,
                student_id=item.student_id,
                status=item.status
            )
            db.add(record)
    
    db.commit()
    db.refresh(session)
    return session

@router.get("/session/{subject_id}/{date}", response_model=schemas.AttendanceSessionResponse)
def get_attendance_session(
    subject_id: UUID,
    date: datetime.date,
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.subject_id == subject_id,
        models.AttendanceSession.session_date == date
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")
    
    return session

@router.get("/records/{session_id}", response_model=List[schemas.AttendanceRecordResponse])
def get_session_records(
    session_id: UUID,
    current_user: dict = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    records = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.attendance_session_id == session_id
    ).all()
    return records
