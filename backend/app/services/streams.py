from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
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
            "full_name": f"{s.parent_class.name}{s.name}"
        } for s in streams
    ]

def create_stream(db: Session, stream_in: schemas.StreamCreate):
    db_stream = models.Stream(**stream_in.dict())
    db.add(db_stream)
    db.commit()
    db.refresh(db_stream)
    return db_stream

def update_stream(db: Session, stream_uuid: str, stream_in: schemas.StreamUpdate):
    db_stream = db.query(models.Stream).filter(models.Stream.id == stream_uuid).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    update_data = stream_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_stream, key, value)
    
    db.commit()
    db.refresh(db_stream)
    return db_stream

def delete_stream(db: Session, stream_uuid: str):
    db_stream = db.query(models.Stream).filter(models.Stream.id == stream_uuid).first()
    if not db_stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    db.delete(db_stream)
    db.commit()
    return {"message": "Stream deleted successfully"}
