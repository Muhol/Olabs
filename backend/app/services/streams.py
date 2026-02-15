from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
from ..services.logs import log_action
from typing import Optional

def get_streams(db: Session, class_id: Optional[str] = None):
    query = db.query(models.Stream)
    if class_id:
        query = query.filter(models.Stream.class_id == class_id)
    streams = query.all()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "class_id": str(s.class_id),
            "class_name": s.parent_class.name,
            "full_name": f"{s.parent_class.name} {s.name}"
        } for s in streams
    ]

def create_stream(db: Session, stream_in: schemas.StreamCreate, performer_email: str):
    db_stream = models.Stream(**stream_in.dict())
    db.add(db_stream)
    db.commit()
    db.refresh(db_stream)
    log_action(db, "info", "stream creation", performer_email, f"Created new stream: {db_stream.parent_class.name}{db_stream.name}", target_user=f"{db_stream.parent_class.name}{db_stream.name}")
    return db_stream

def update_stream(db: Session, stream_uuid: str, stream_in: schemas.StreamUpdate, performer_email: str):
    db_stream = db.query(models.Stream).filter(models.Stream.id == stream_uuid).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    update_data = stream_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_stream, key, value)
    
    db.commit()
    db.refresh(db_stream)
    log_action(db, "info", "stream update", performer_email, f"Updated stream: {db_stream.parent_class.name}{db_stream.name}", target_user=f"{db_stream.parent_class.name}{db_stream.name}")
    return db_stream

def delete_stream(db: Session, stream_uuid: str, performer_email: str):
    db_stream = db.query(models.Stream).filter(models.Stream.id == stream_uuid).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    # Check if stream is empty
    student_count = db.query(models.Student).filter(models.Student.stream_id == stream_uuid).count()
    if student_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete stream that has students assigned to it.")

    full_name = f"{db_stream.parent_class.name}{db_stream.name}"
    db.delete(db_stream)
    db.commit()
    log_action(db, "warning", "stream deletion", performer_email, f"Deleted stream: {full_name}", target_user=full_name)
    return {"message": "Stream deleted successfully"}
