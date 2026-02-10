from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, auth
from ..database import get_db
from ..services import subjects as service

router = APIRouter(prefix="/subjects", tags=["subjects"])

def check_subject_management_access(current_user: dict = Depends(auth.get_current_user)):
    """
    Restrict access to Super Admins or Admins with 'timetable_manager' or 'all' subroles.
    """
    role = current_user.get("role")
    subroles = current_user.get("subroles", [])
    
    if role == "SUPER_ADMIN":
        return current_user
    
    if role == "admin" and ("timetable_manager" in subroles or "all" in subroles):
        return current_user
        
    raise HTTPException(
        status_code=403, 
        detail="Access denied. Requires Super Admin or Admin with Timetable permissions."
    )

@router.get("/", response_model=schemas.PaginatedSubjectResponse)
def list_subjects(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    available_for_teacher: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: dict = Depends(auth.get_current_user)
):
    return service.get_subjects(db, skip=skip, limit=limit, search=search, available_for_teacher_id=available_for_teacher)

@router.get("/by-class-stream")
def get_subjects_by_class_stream(
    class_id: str,
    stream_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Get subjects for a specific class and optionally stream.
    Returns subjects matching the stream OR class-wide subjects (no stream).
    """
    return service.get_subjects_by_class_and_stream(db, class_id, stream_id)


@router.post("/", response_model=schemas.SubjectResponse)
def create_subject(
    subject: schemas.SubjectCreate, 
    db: Session = Depends(get_db), 
    admin_user: dict = Depends(check_subject_management_access)
):
    try:
        return service.create_subject(db, subject)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.patch("/{subject_id}")
def update_subject(
    subject_id: str, 
    subject_update: schemas.SubjectUpdate, 
    db: Session = Depends(get_db), 
    admin_user: dict = Depends(check_subject_management_access)
):
    try:
        result = service.update_subject(db, subject_id, subject_update)
        if not result:
            raise HTTPException(status_code=404, detail="Subject not found")
        return result
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.delete("/{subject_id}")
def delete_subject(
    subject_id: str, 
    db: Session = Depends(get_db), 
    admin_user: dict = Depends(check_subject_management_access)
):
    if not service.delete_subject(db, subject_id):
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted"}

@router.post("/assign/student/{student_id}")
def assign_to_student(
    student_id: str, 
    assignment: schemas.SubjectAssign, 
    db: Session = Depends(get_db), 
    admin_user: dict = Depends(check_subject_management_access)
):
    result = service.assign_subjects_to_student(db, student_id, assignment.subject_ids)
    if not result:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Subjects assigned to student"}

@router.post("/assign/teacher/{user_id}")
def assign_to_teacher(
    user_id: str, 
    assignment: schemas.SubjectAssign, 
    db: Session = Depends(get_db), 
    admin_user: dict = Depends(check_subject_management_access)
):
    result = service.assign_subjects_to_teacher(db, user_id, assignment.subject_ids)
    if not result:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Subjects assigned to teacher"}

# New endpoints for class-based assignments
@router.post("/assign/teacher/{teacher_id}/with-classes")
def assign_to_teacher_with_classes(
    teacher_id: str,
    batch: schemas.TeacherSubjectAssignmentBatch,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(check_subject_management_access)
):
    """Assign subjects to a teacher with specific class/stream context"""
    result = service.assign_subjects_to_teacher_with_classes(db, teacher_id, batch.assignments)
    if result is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Subjects assigned successfully", "assignments": result}

@router.get("/teacher/{teacher_id}/assignments")
def get_teacher_assignments(
    teacher_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Get all subject assignments for a teacher with class/stream details"""
    return service.get_teacher_subject_assignments(db, teacher_id)

@router.post("/{subject_id}/enroll")
def enroll_students(
    subject_id: str,
    enrollment: schemas.SubjectEnrollmentRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Enroll multiple students in a specific subject. Accessible to admins and teachers."""
    # check_subject_management_access is too strict, we allow teachers here
    role = current_user.get("role")
    subroles = current_user.get("subroles", [])
    
    is_admin = role == "SUPER_ADMIN" or (role == "admin" and ("timetable_manager" in subroles or "all" in subroles))
    is_teacher = role == "teacher" or (role == "admin" and "teacher" in subroles)
    
    if not (is_admin or is_teacher):
        raise HTTPException(status_code=403, detail="Access denied.")
        
    result = service.enroll_students_in_subject(db, subject_id, enrollment.student_ids)
    if not result:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Students enrolled successfully"}

@router.get("/{subject_id}/enrolled-ids")
def get_enrolled_student_ids(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """Get IDs of all students enrolled in a specific subject. Accessible to admins and teachers."""
    role = current_user.get("role")
    subroles = current_user.get("subroles", [])
    
    is_admin = role == "SUPER_ADMIN" or (role == "admin" and ("timetable_manager" in subroles or "all" in subroles))
    is_teacher = role == "teacher" or (role == "admin" and "teacher" in subroles)
    
    if not (is_admin or is_teacher):
        raise HTTPException(status_code=403, detail="Access denied.")
        
    return service.get_enrolled_student_ids(db, subject_id)
