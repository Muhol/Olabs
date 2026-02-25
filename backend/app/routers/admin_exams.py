from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, auth
from ..database import get_db
from ..services import admin_exams as service
from uuid import UUID

router = APIRouter(prefix="/admin/exams", tags=["Admin Exam Management"])

def check_super_admin(current_user: dict = Depends(auth.get_current_user)):
    if current_user.get("role") != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user

def check_staff_access(current_user: dict = Depends(auth.get_current_user)):
    role = current_user.get("role")
    if role not in ["SUPER_ADMIN", "admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied. Requires Staff access.")
    return current_user

@router.get("/", response_model=List[schemas.TermExamResponse])
def list_term_exams(
    db: Session = Depends(get_db),
    user: dict = Depends(check_staff_access)
):
    return service.get_term_exams(db)

@router.get("/current", response_model=schemas.TermExamResponse)
def get_current_term_exam(
    db: Session = Depends(get_db),
    user: dict = Depends(check_staff_access)
):
    result = service.get_current_term_exam(db)
    if not result:
        raise HTTPException(status_code=404, detail="No term exams found")
    return result

@router.post("/", response_model=schemas.TermExamResponse)
def create_term_exam(
    term_exam: schemas.TermExamCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(check_super_admin)
):
    return service.create_term_exam(db, term_exam)

@router.put("/batch", response_model=list[schemas.TermExamResponse])
def batch_update_term_exams(
    batch_data: schemas.TermExamBatchUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(check_super_admin)
):
    """Batch update edit_status of term exams by term and year"""
    result = service.batch_update_term_exams(db, batch_data)
    return result

@router.put("/{exam_id}", response_model=schemas.TermExamResponse)
def update_term_exam(
    exam_id: UUID,
    term_exam: schemas.TermExamCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(check_super_admin)
):
    result = service.update_term_exam(db, exam_id, term_exam)
    if not result:
        raise HTTPException(status_code=404, detail="Term exam not found")
    return result

@router.delete("/{exam_id}")
def delete_term_exam(
    exam_id: UUID,
    db: Session = Depends(get_db),
    admin: dict = Depends(check_super_admin)
):
    if not service.delete_term_exam(db, exam_id):
        raise HTTPException(status_code=404, detail="Term exam not found")
    return {"message": "Term exam deleted successfully"}
