from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from .. import database, schemas, auth
from ..services import books as service

router = APIRouter()

@router.get("/books")
def get_books(
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    return service.get_books(db, skip, limit, search)

@router.post("/books")
def create_book(
    book_in: schemas.BookCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["librarian", "admin", "SUPER_ADMIN"]))
):
    return service.create_book(db, book_in)

@router.patch("/books/{book_uuid}")
def update_book(
    book_uuid: str,
    book_in: schemas.BookUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["librarian", "admin", "SUPER_ADMIN"]))
):
    return service.update_book(db, book_uuid, book_in)

@router.delete("/books/{book_uuid}")
def delete_book(
    book_uuid: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN"]))
):
    return service.delete_book(db, book_uuid)
