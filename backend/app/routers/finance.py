from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database, auth, schemas
from ..services import finance as service

router = APIRouter()

@router.post("/bulk-charge")
def bulk_charge(
    charge_in: schemas.FeeStructureCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN", "finance"]))
):
    return service.bulk_charge(
        db, 
        str(charge_in.class_id), 
        charge_in.title, 
        charge_in.amount, 
        charge_in.term, 
        charge_in.year, 
        current_user["email"]
    )

@router.post("/payments")
def record_payment(
    payment_in: schemas.FeeRecordCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["admin", "SUPER_ADMIN", "finance"]))
):
    return service.record_payment(
        db, 
        str(payment_in.student_id), 
        payment_in.amount, 
        payment_in.description, 
        current_user["id"], 
        current_user["email"]
    )
