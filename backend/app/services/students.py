from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
from typing import Optional

def get_students(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None, class_id: Optional[str] = None, stream_id: Optional[str] = None):
    query = db.query(models.Student)
    
    if class_id:
        query = query.filter(models.Student.class_id == class_id)
    if stream_id:
        query = query.filter(models.Student.stream_id == stream_id)

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
            "full_class": f"{s.student_class.name}{s.assigned_stream.name}" if s.student_class and s.assigned_stream else "N/A"
        } for s in items
    ]
    return {"total": total, "items": serialized_items}

def create_student(db: Session, student_in: schemas.StudentCreate):
    existing = db.query(models.Student).filter(models.Student.admission_number == student_in.admission_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Admission number already exists")
    
    db_student = models.Student(**student_in.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_uuid: str, student_in: schemas.StudentUpdate):
    db_student = db.query(models.Student).filter(models.Student.id == student_uuid).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_student, key, value)
    
    db.commit()
    db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_uuid: str):
    db_student = db.query(models.Student).filter(models.Student.id == student_uuid).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(db_student)
    db.commit()
    return {"message": "Student deleted successfully"}
