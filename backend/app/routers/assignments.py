from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, auth, database
from ..services import assignments as service
from ..services import cloudinary_service as cloudinary
import json
import datetime

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.post("/")
async def create_assignment(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    subject_id: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Creates an assignment with optional file upload to Cloudinary"""
    # Authorization: Only teachers can create assignments
    if current_user.get("role") not in ["teacher", "admin", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")

    # Handle file upload
    file_data = None
    if file:
        file_data = cloudinary.upload_file(file.file, filename=file.filename)
        if not file_data:
            raise HTTPException(status_code=500, detail="Failed to upload file to Cloudinary")
        # Add original name from upload file object if missing
        if not file_data.get("original_name"):
            file_data["original_name"] = file.filename

    # Prepare assignment data
    assignment_data = schemas.AssignmentCreate(
        title=title,
        description=description,
        due_date=datetime.datetime.fromisoformat(due_date) if due_date else None,
        subject_id=subject_id,
        teacher_id=current_user.get("id")
    )

    return service.create_assignment(db, assignment_data, file_data)

@router.get("/", response_model=List[schemas.AssignmentResponse])
def list_assignments(
    teacher_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Lists assignments. Teachers see their own, admins see all (unless filtered)."""
    return service.get_assignments(db, teacher_id=teacher_id, subject_id=subject_id)

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Deletes an assignment and its associated Cloudinary file"""
    assignment = service.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check ownership
    if current_user.get("role") != "SUPER_ADMIN" and str(assignment.teacher_id) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="You can only delete your own assignments")

    public_id = service.delete_assignment(db, assignment_id)
    if public_id:
        cloudinary.delete_file(public_id)
        
    return {"message": "Assignment deleted successfully"}

@router.patch("/{assignment_id}", response_model=schemas.AssignmentResponse)
def update_assignment(
    assignment_id: str,
    update_data: schemas.AssignmentUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Updates assignment text details"""
    assignment = service.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if current_user.get("role") != "SUPER_ADMIN" and str(assignment.teacher_id) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="You can only update your own assignments")
        
    return service.update_assignment(db, assignment_id, update_data)
