from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/report-items", tags=["Report Items"])


def check_admin_access(current_user: dict = Depends(get_current_user)):
    allowed = {"admin", "SUPER_ADMIN"}
    if current_user.get("role") not in allowed:
        raise HTTPException(status_code=403, detail="Admins only")
    return current_user


@router.get("/", response_model=List[schemas.ReportItemResponse])
def list_report_items(
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all report items (competencies or values). Optionally filter by type."""
    q = db.query(models.ReportItem)
    if type:
        q = q.filter(models.ReportItem.type == type)
    return q.order_by(models.ReportItem.type, models.ReportItem.order, models.ReportItem.name).all()


@router.post("/", response_model=schemas.ReportItemResponse)
def create_report_item(
    data: schemas.ReportItemCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(check_admin_access)
):
    existing = db.query(models.ReportItem).filter(models.ReportItem.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="A report item with this name already exists.")
    item = models.ReportItem(**data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=schemas.ReportItemResponse)
def update_report_item(
    item_id: UUID,
    data: schemas.ReportItemCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(check_admin_access)
):
    item = db.query(models.ReportItem).filter(models.ReportItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Report item not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_report_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    admin: dict = Depends(check_admin_access)
):
    item = db.query(models.ReportItem).filter(models.ReportItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Report item not found")
    db.delete(item)
    db.commit()
    return {"detail": "Deleted successfully"}
