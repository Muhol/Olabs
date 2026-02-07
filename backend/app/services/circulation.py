from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
import datetime
from typing import Optional

def get_borrow_history(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    query = db.query(models.BorrowRecord)
    if search:
        search_f = f"%{search}%"
        query = query.join(models.Book).join(models.Student).filter(
            (models.Book.title.ilike(search_f)) |
            (models.Student.full_name.ilike(search_f)) |
            (models.Student.admission_number.ilike(search_f))
        )
    
    total = query.count()
    records = query.order_by(models.BorrowRecord.borrow_date.desc()).offset(skip).limit(limit).all()
    items = [
        {
            "id": str(r.id),
            "book": r.book.title if r.book else "Unknown Asset",
            "student": r.student.full_name if r.student else "Unknown Personnel",
            "class_id": str(r.class_id) if r.class_id else None,
            "stream_id": str(r.stream_id) if r.stream_id else None,
            "class": f"{r.associated_class.name}{r.associated_stream.name}" if r.associated_class and r.associated_stream else (r.associated_class.name if r.associated_class else "N/A"),
            "borrow_date": r.borrow_date,
            "due_date": r.due_date,
            "return_date": r.return_date,
            "status": r.status
        } for r in records
    ]
    return {"total": total, "items": items}

def borrow_book(db: Session, book_id: str, student_id: str):
    # Verify book existence and availability
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Archival asset not found")
    
    if book.borrowed_copies >= book.total_copies:
        raise HTTPException(status_code=400, detail="Resource capacity exhausted (Out of Stock)")
    
    # Verify student existence
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Personnel vector not detected")
    
    try:
        # Create borrow record
        new_record = models.BorrowRecord(
            book_id=book.id,
            student_id=student.id,
            class_id=student.class_id,
            stream_id=student.stream_id,
            borrow_date=datetime.datetime.utcnow(),
            due_date=datetime.datetime.utcnow() + datetime.timedelta(days=14),
            status="borrowed"
        )
        # Update book availability
        book.borrowed_copies += 1
        
        db.add(new_record)
        db.commit()
        return {"message": "Circulation protocol executed successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failure: {str(e)}")

def return_book(db: Session, transaction_uuid: str):
    record = db.query(models.BorrowRecord).filter(models.BorrowRecord.id == transaction_uuid).first()
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if record.status == "returned":
        raise HTTPException(status_code=400, detail="Book already returned")
    
    try:
        record.status = "returned"
        record.return_date = datetime.datetime.utcnow()
        
        # Update book availability
        book = db.query(models.Book).filter(models.Book.id == record.book_id).first()
        if book:
            book.borrowed_copies = max(0, book.borrowed_copies - 1)
        
        db.commit()
        return {"message": "Book returned successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Return failed: {str(e)}")
