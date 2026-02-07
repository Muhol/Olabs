from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
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

def create_class(db: Session, class_in: schemas.ClassCreate):
    existing = db.query(models.Class).filter(models.Class.name == class_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Class name already exists")
    
    db_class = models.Class(name=class_in.name)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class
