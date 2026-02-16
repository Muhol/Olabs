from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
from ..services.logs import log_action
from typing import Optional

def get_students(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None, class_id: Optional[str] = None, stream_id: Optional[str] = None, subject_id: Optional[str] = None):
    query = db.query(models.Student)
    
    if class_id:
        query = query.filter(models.Student.class_id == class_id)
    if stream_id:
        query = query.filter(models.Student.stream_id == stream_id)
    if subject_id:
        query = query.join(models.Student.subjects).filter(models.Subject.id == subject_id)

    if search:
        search_f = f"%{search}%"
        query = query.filter(
            (models.Student.full_name.ilike(search_f)) |
            (models.Student.admission_number.ilike(search_f))
        )
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    # Explicit serialization to avoid recursive relationship loops
    serialized_items = [
        {
            "id": str(s.id),
            "full_name": s.full_name,
            "admission_number": s.admission_number,
            "class_id": str(s.class_id) if s.class_id else None,
            "stream_id": str(s.stream_id) if s.stream_id else None,
            "stream": s.assigned_stream.name if s.assigned_stream else s.stream, # Fallback to legacy string
            "class_name": s.student_class.name if s.student_class else "N/A",
            "full_class": f"{s.student_class.name}{s.assigned_stream.name}" if s.student_class and s.assigned_stream else "N/A",
            "is_cleared": s.is_cleared,
            "cleared_at": s.cleared_at,
            "subjects": [{"id": str(sb.id), "name": sb.name} for sb in s.subjects]
        } for s in items
    ]
    return {"total": total, "items": serialized_items}

def clear_student(db: Session, student_uuid: str, performer_email: str):
    db_student = db.query(models.Student).filter(models.Student.id == student_uuid).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if they have any unreturned books
    outstanding = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.student_id == student_uuid,
        models.BorrowRecord.status == "borrowed"
    ).first()
    
    if outstanding:
        raise HTTPException(status_code=400, detail="Student has outstanding books. Return all books before clearance.")
    
    import datetime
    db_student.is_cleared = True
    db_student.cleared_at = datetime.datetime.utcnow()
    db.commit()
    log_action(db, "info", "student clearance", performer_email, f"Cleared student: {db_student.full_name}", target_user=db_student.admission_number)
    return {"message": "Student cleared successfully"}

def create_student(db: Session, student_in: schemas.StudentCreate):
    existing = db.query(models.Student).filter(models.Student.admission_number == student_in.admission_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admission number already exists")
    
    student_data = student_in.dict()
    if student_in.stream_id:
        stream = db.query(models.Stream).filter(models.Stream.id == student_in.stream_id).first()
        if stream:
            student_data["stream"] = stream.name

    db_student = models.Student(**student_data)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_uuid: str, student_in: schemas.StudentUpdate):
    db_student = db.query(models.Student).filter(models.Student.id == student_uuid).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_in.dict(exclude_unset=True)
    if student_in.stream_id:
        stream = db.query(models.Stream).filter(models.Stream.id == student_in.stream_id).first()
        if stream:
            update_data["stream"] = stream.name
            
    for key, value in update_data.items():
        setattr(db_student, key, value)
    
    db.commit()
    db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_uuid: str, performer_email: str):
    db_student = db.query(models.Student).filter(models.Student.id == student_uuid).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    std_name = db_student.full_name
    admin_num = db_student.admission_number
    db.delete(db_student)
    db.commit()
    log_action(db, "warning", "student deletion", performer_email, f"Deleted student: {std_name}", target_user=admin_num)
    return {"message": "Student deleted successfully"}

def reset_student_account(db: Session, student_uuid: str, performer_email: str):
    db_student = db.query(models.Student).filter(models.Student.id == student_uuid).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db_student.activated = False
    db_student.password = None
    db.commit()
    log_action(db, "info", "student account reset", performer_email, f"Reset account for student: {db_student.full_name}", target_user=db_student.admission_number)
    return {"message": "Student account reset successfully. They can now onboard again."}

def promote_students(db: Session, performer_email: str):
    import datetime
    active_students = db.query(models.Student).filter(models.Student.is_cleared == False).all()
    classes = db.query(models.Class).all()
    class_map = {c.name.lower(): c for c in classes}
    
    promoted = 0
    graduated = 0
    errors = 0
    
    for s in active_students:
        if not s.student_class:
            errors += 1
            continue
            
        current_name = s.student_class.name
        # Simple logical promotion: Form X -> Form X+1
        if current_name.startswith("Form "):
            try:
                num = int(current_name.split(" ")[1])
                next_form_name = f"Form {num + 1}"
                
                if next_form_name.lower() in class_map:
                    # Move to next class
                    next_class = class_map[next_form_name.lower()]
                    s.class_id = next_class.id
                    
                    # Try to find matching stream in new class
                    if s.assigned_stream:
                        stream_name = s.assigned_stream.name
                        next_stream = db.query(models.Stream).filter(
                            models.Stream.class_id == next_class.id,
                            models.Stream.name == stream_name
                        ).first()
                        if next_stream:
                            s.stream_id = next_stream.id
                            s.stream = next_stream.name
                        else:
                            s.stream_id = None # Stream doesn't exist in next class
                    
                    promoted += 1
                else:
                    # No next form found, assume Form 4 -> Graduated
                    if num == 4:
                        s.is_cleared = True
                        s.cleared_at = datetime.datetime.utcnow()
                        graduated += 1
                    else:
                        errors += 1
            except (ValueError, IndexError):
                errors += 1
        else:
            # For other naming conventions, we might need manual mapping or skip
            errors += 1
            
    db.commit()
    log_action(db, "info", "bulk promotion", performer_email, f"Promoted: {promoted}, Graduated: {graduated}, Errors: {errors}")
    return {
        "message": "Promotion process completed",
        "promoted": promoted,
        "graduated": graduated,
        "skipped_or_error": errors
    }

def get_student_attendance(db: Session, student_uuid: str):
    db_student = db.query(models.Student).filter(models.Student.id == student_uuid).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    total = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == student_uuid).count()
    present = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student_uuid,
        models.AttendanceRecord.status.in_(["present", "late"])
    ).count()
    absent = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student_uuid,
        models.AttendanceRecord.status == "absent"
    ).count()
    
    # Calculate percentage
    percentage = (present / total * 100) if total > 0 else 100.0
    
    # Get latest records
    recent_records = db.query(models.AttendanceRecord).join(models.AttendanceSession).filter(
        models.AttendanceRecord.student_id == student_uuid
    ).order_by(models.AttendanceSession.session_date.desc()).limit(10).all()
    
    serialized_records = [
        {
            "id": str(r.id),
            "date": r.session.session_date.isoformat(),
            "status": r.status,
            "subject_name": r.session.subject.name if r.session.subject else "N/A"
        } for r in recent_records
    ]
    
    return {
        "total": total,
        "present": present,
        "absent": absent,
        "percentage": round(percentage, 1),
        "recent_records": serialized_records
    }
