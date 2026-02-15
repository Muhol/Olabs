from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
from ..services.logs import log_action
import uuid
import datetime

def bulk_charge(db: Session, class_id: str, title: str, amount: float, term: str, year: int, performer_email: str):
    # Find all students in this class
    students = db.query(models.Student).filter(models.Student.class_id == class_id).all()
    
    # Create the fee structure record
    fee_structure = models.FeeStructure(
        id=uuid.uuid4(),
        class_id=class_id,
        title=title,
        amount=amount,
        term=term,
        year=year
    )
    db.add(fee_structure)
    
    # Create fee records for each student
    for student in students:
        fee_record = models.FeeRecord(
            id=uuid.uuid4(),
            student_id=student.id,
            amount=amount,
            type="charge",
            description=f"{title} ({term} {year})",
            date=datetime.datetime.utcnow()
        )
        db.add(fee_record)
    
    db.commit()
    log_action(db, "info", "bulk fee charge", performer_email, f"Charged {len(students)} students: {title}")
    return {"message": f"Successfully charged {len(students)} students."}

def record_payment(db: Session, student_id: str, amount: float, description: str, performer_id: str, performer_email: str):
    fee_record = models.FeeRecord(
        id=uuid.uuid4(),
        student_id=student_id,
        amount=amount,
        type="payment",
        description=description,
        recorded_by_id=performer_id,
        date=datetime.datetime.utcnow()
    )
    db.add(fee_record)
    db.commit()
    
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    log_action(db, "info", "fee payment", performer_email, f"Recorded payment of {amount} for {student.full_name if student else student_id}", target_user=student.admission_number if student else None)
    return fee_record
