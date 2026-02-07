from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from .. import database, schemas, auth
from ..services import circulation as service

router = APIRouter()

@router.get("/history")
def get_borrow_history(
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    return service.get_borrow_history(db, skip, limit, search)

@router.post("/borrow")
def borrow_book(
    book_id: str,
    student_id: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["librarian", "admin", "SUPER_ADMIN"]))
):
    return service.borrow_book(db, book_id, student_id)

@router.post("/return/{transaction_uuid}")
def return_book(
    transaction_uuid: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["librarian", "admin", "SUPER_ADMIN"]))
):
    return service.return_book(db, transaction_uuid)
