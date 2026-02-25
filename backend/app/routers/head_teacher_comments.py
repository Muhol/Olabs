from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(
    prefix="/head-teacher-comments",
    tags=["Head Teacher Comments"]
)

@router.get("/", response_model=List[schemas.HeadTeacherCommentTemplateResponse])
def get_head_teacher_comments(db: Session = Depends(get_db)):
    """
    Fetch all head teacher comment templates.
    Publicly accessible to authenticated users (so teachers can use them for calculation).
    """
    templates = db.query(models.HeadTeacherCommentTemplate).all()
    return templates

@router.put("/{level}", response_model=schemas.HeadTeacherCommentTemplateResponse)
def upsert_head_teacher_comment(
    level: str,
    comment_data: schemas.HeadTeacherCommentTemplateCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.require_role(["SUPER_ADMIN"]))
):
    """
    Create or update a comment template for a specific level (EE/ME/AE/BE).
    Restricted to super_admin.
    """
    valid_levels = ["EE", "ME", "AE", "BE"]
    if level not in valid_levels:
        raise HTTPException(status_code=400, detail="Invalid level. Must be EE, ME, AE, or BE.")
    
    if comment_data.level != level:
        raise HTTPException(status_code=400, detail="Path level and body level must match.")

    template = db.query(models.HeadTeacherCommentTemplate).filter(models.HeadTeacherCommentTemplate.level == level).first()
    
    if template:
        template.comment = comment_data.comment
    else:
        template = models.HeadTeacherCommentTemplate(
            level=level,
            comment=comment_data.comment
        )
        db.add(template)
        
    db.commit()
    db.refresh(template)
    
    return template
