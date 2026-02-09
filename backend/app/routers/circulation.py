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
    search: Optional[str] = None,
    student_id: Optional[str] = None
):
    return service.get_borrow_history(db, skip, limit, search, student_id)

@router.post("/borrow")
def borrow_book(
    borrow_in: schemas.BorrowCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["librarian", "admin", "SUPER_ADMIN"]))
):
    return service.borrow_book(db, borrow_in.book_id, borrow_in.student_id, current_user["email"], borrow_in.book_number)

@router.post("/return/{transaction_uuid}")
def return_book(
    transaction_uuid: str,
    return_request: Optional[schemas.ReturnBookRequest] = None,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["librarian", "admin", "SUPER_ADMIN"]))
):
    book_number = return_request.book_number if return_request else None
    return service.return_book(db, transaction_uuid, current_user["email"], book_number)
