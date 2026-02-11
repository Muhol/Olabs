from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import database, auth
from ..services import analytics as service

router = APIRouter()

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    return service.get_analytics(db, current_user)
