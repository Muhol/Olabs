from sqlalchemy.orm import Session
from .. import models, schemas
from typing import List, Optional
import uuid

def create_assignment(db: Session, assignment: schemas.AssignmentCreate, file_data: Optional[dict] = None):
    """Creates a new assignment with optional file data"""
    db_assignment = models.Assignment(
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date,
        subject_id=assignment.subject_id,
        teacher_id=assignment.teacher_id,
        file_url=file_data.get("url") if file_data else None,
        file_public_id=file_data.get("public_id") if file_data else None,
        file_name=file_data.get("original_name") if file_data else None
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def get_assignments(db: Session, teacher_id: Optional[str] = None, subject_id: Optional[str] = None):
    """Lists assignments, optionally filtered by teacher or subject"""
    query = db.query(models.Assignment)
    if teacher_id:
        query = query.filter(models.Assignment.teacher_id == teacher_id)
    if subject_id:
        query = query.filter(models.Assignment.subject_id == subject_id)
    
    results = query.order_by(models.Assignment.created_at.desc()).all()
    
    # Enrich with names (though relationships should handle this, let's be explicit for the schema)
    for a in results:
        a.subject_name = a.subject.name if a.subject else "Unknown"
        a.teacher_name = a.teacher.full_name if a.teacher else "Unknown"
        
    return results

def get_assignment(db: Session, assignment_id: str):
    """Gets a single assignment by ID"""
    return db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()

def delete_assignment(db: Session, assignment_id: str):
    """Deletes an assignment"""
    db_assignment = get_assignment(db, assignment_id)
    if db_assignment:
        # Get public_id if we need to delete from cloudinary later (service will handle)
        public_id = db_assignment.file_public_id
        db.delete(db_assignment)
        db.commit()
        return public_id
    return None

def update_assignment(db: Session, assignment_id: str, update_data: schemas.AssignmentUpdate):
    """Updates an assignment's basic info"""
    db_assignment = get_assignment(db, assignment_id)
    if not db_assignment:
        return None
        
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(db_assignment, key, value)
        
    db.commit()
    db.refresh(db_assignment)
    return db_assignment
