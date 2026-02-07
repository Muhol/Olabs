from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
from typing import Optional

def get_books(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    query = db.query(models.Book)
    if search:
        search_f = f"%{search}%"
        query = query.filter(
            (models.Book.title.ilike(search_f)) |
            (models.Book.author.ilike(search_f)) |
            (models.Book.book_id.ilike(search_f)) |
            (models.Book.category.ilike(search_f)) |
            (models.Book.subject.ilike(search_f))
        )
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    # Explicit serialization to avoid recursive relationship loops
    serialized_items = [
        {
            "id": str(b.id),
            "book_id": b.book_id,
            "title": b.title,
            "author": b.author,
            "category": b.category,
            "subject": b.subject,
            "isbn": b.isbn,
            "total_copies": b.total_copies,
            "borrowed_copies": b.borrowed_copies,
            "available": b.available
        } for b in items
    ]
    return {"total": total, "items": serialized_items}

def create_book(db: Session, book_in: schemas.BookCreate):
    existing = db.query(models.Book).filter(models.Book.book_id == book_in.book_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Book ID already exists")
    
    db_book = models.Book(**book_in.dict())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

def update_book(db: Session, book_uuid: str, book_in: schemas.BookUpdate):
    db_book = db.query(models.Book).filter(models.Book.id == book_uuid).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    update_data = book_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_book, key, value)
    
    db.commit()
    db.refresh(db_book)
    return db_book

def delete_book(db: Session, book_uuid: str):
    db_book = db.query(models.Book).filter(models.Book.id == book_uuid).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    db.delete(db_book)
    db.commit()
    return {"message": "Book deleted successfully"}
