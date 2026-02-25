from sqlalchemy.orm import Session
from .. import models, schemas
from uuid import UUID
import uuid

def get_term_exams(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.TermExam).order_by(
        models.TermExam.year.desc(), 
        models.TermExam.term.desc()
    ).offset(skip).limit(limit).all()

def get_term_exam(db: Session, term_exam_id: UUID):
    return db.query(models.TermExam).filter(models.TermExam.id == term_exam_id).first()

def create_term_exam(db: Session, term_exam_data: schemas.TermExamCreate):
    db_term_exam = models.TermExam(**term_exam_data.model_dump())
    db.add(db_term_exam)
    db.commit()
    db.refresh(db_term_exam)
    return db_term_exam

def update_term_exam(db: Session, term_exam_id: UUID, term_exam_data: schemas.TermExamCreate):
    db_term_exam = get_term_exam(db, term_exam_id)
    if not db_term_exam:
        return None
    for key, value in term_exam_data.model_dump().items():
        setattr(db_term_exam, key, value)
    db.commit()
    db.refresh(db_term_exam)
    return db_term_exam

def batch_update_term_exams(db: Session, batch_data: schemas.TermExamBatchUpdate):
    exams = db.query(models.TermExam).filter(
        models.TermExam.term == batch_data.term,
        models.TermExam.year == batch_data.year
    ).all()
    for exam in exams:
        exam.edit_status = batch_data.edit_status
    db.commit()
    return exams

def delete_term_exam(db: Session, term_exam_id: UUID):
    db_term_exam = get_term_exam(db, term_exam_id)
    if not db_term_exam:
        return False
    db.delete(db_term_exam)
    db.commit()
    return True

def get_current_term_exam(db: Session):
    # Try to find latest "current" term
    current = db.query(models.TermExam).filter(
        models.TermExam.edit_status == "current"
    ).order_by(models.TermExam.year.desc(), models.TermExam.term.desc()).first()
    
    if current:
        return current
        
    # Fallback to latest overall if none are current
    return db.query(models.TermExam).order_by(
        models.TermExam.year.desc(), 
        models.TermExam.term.desc()
    ).first()
