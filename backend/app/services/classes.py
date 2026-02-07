from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
from ..services.logs import log_action
from typing import Optional

def get_classes(db: Session):
    classes = db.query(models.Class).all()
    result = []
    for cls in classes:
        # Get total students in class
        total_students = db.query(models.Student).filter(models.Student.class_id == cls.id).count()
        
        # Get structured streams
        streams = []
        for s in cls.streams:
            count = db.query(models.Student).filter(models.Student.stream_id == s.id).count()
            streams.append({
                "id": str(s.id),
                "name": s.name,
                "count": count,
                "full_name": f"{cls.name}{s.name}" # eg Form 1A
            })
            
        result.append({
            "id": str(cls.id),
            "name": cls.name,
            "student_count": total_students,
            "streams": streams
        })
    return result

def create_class(db: Session, class_in: schemas.ClassCreate, performer_email: str):
    existing = db.query(models.Class).filter(models.Class.name == class_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Class name already exists")
    
    db_class = models.Class(name=class_in.name)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    log_action(db, "info", "class creation", performer_email, f"Created new class: {db_class.name}", target_user=db_class.name)
    return db_class

def delete_class(db: Session, class_uuid: str, performer_email: str):
    db_class = db.query(models.Class).filter(models.Class.id == class_uuid).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check for students
    student_count = db.query(models.Student).filter(models.Student.class_id == class_uuid).count()
    if student_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete class that has students assigned to it.")
    
    # Check for streams
    stream_count = db.query(models.Stream).filter(models.Stream.class_id == class_uuid).count()
    if stream_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete class that has streams associated with it. Delete streams first.")
    
    cls_name = db_class.name
    db.delete(db_class)
    db.commit()
    log_action(db, "warning", "class deletion", performer_email, f"Deleted class: {cls_name}", target_user=cls_name)
    return {"message": "Class deleted successfully"}
