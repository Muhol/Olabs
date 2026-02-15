from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from .. import schemas, auth, models
from ..database import get_db

router = APIRouter(prefix="/timetable", tags=["timetable"])

def check_timetable_management_access(current_user: dict = Depends(auth.get_current_user)):
    """
    Restrict access to Super Admins or Admins with 'timetable_manager', 'timetabling', or 'all' subroles.
    """
    role = current_user.get("role")
    subroles = current_user.get("subroles", [])
    
    if role == "SUPER_ADMIN":
        return current_user
    
    if role == "admin" and any(r in subroles for r in ["timetable_manager", "timetabling", "all"]):
        return current_user
        
    raise HTTPException(
        status_code=403, 
        detail="Access denied. Requires Super Admin or Admin with Timetable permissions."
    )

@router.post("/bulk", response_model=List[schemas.TimetableSlotResponse])
def bulk_create_timetable_slots(
    payload: schemas.TimetableSlotBulkCreate,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(check_timetable_management_access)
):
    """
    Create multiple timetable slots at once.
    """
    new_slots = []
    for slot_data in payload.slots:
        new_slot = models.TimetableSlot(
            stream_id=slot_data.stream_id,
            subject_id=slot_data.subject_id,
            start_time=slot_data.start_time,
            end_time=slot_data.end_time,
            day_of_week=slot_data.day_of_week,
            type=slot_data.type
        )
        db.add(new_slot)
        new_slots.append(new_slot)
    
    db.commit()
    for slot in new_slots:
        db.refresh(slot)
    
    return new_slots

@router.get("/stream/{stream_id}", response_model=List[schemas.TimetableSlotResponse])
def get_timetable_by_stream(
    stream_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    """
    Fetch timetable slots for a specific stream with enriched data.
    """
    stream = db.query(models.Stream).filter(models.Stream.id == stream_id).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
        
    slots = db.query(models.TimetableSlot).filter(models.TimetableSlot.stream_id == stream_id).all()
    
    result = []
    for s in slots:
        teacher_name = None
        if s.subject_id:
            # Try to get teacher for this subject in the stream's class
            assignment = db.query(models.TeacherSubjectAssignment).filter(
                models.TeacherSubjectAssignment.subject_id == s.subject_id,
                models.TeacherSubjectAssignment.class_id == stream.class_id
            ).first()
            if assignment and assignment.teacher:
                teacher_name = assignment.teacher.full_name

        result.append(schemas.TimetableSlotResponse(
            id=s.id,
            stream_id=s.stream_id,
            subject_id=s.subject_id,
            subject_name=s.subject.name if s.subject else "Free",
            teacher_name=teacher_name or ("-" if s.type == 'lesson' else None),
            start_time=s.start_time,
            end_time=s.end_time,
            day_of_week=s.day_of_week,
            type=s.type
        ))
        
    return result

@router.get("/all", response_model=List[schemas.TimetableSlotResponse])
def get_all_timetables(
    db: Session = Depends(get_db),
    admin_user: dict = Depends(auth.get_current_user)
):
    """
    Fetch all timetable slots for admins.
    """
    if admin_user.get("role") not in ["admin", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
    return db.query(models.TimetableSlot).all()
@router.delete("/bulk")
def bulk_delete_timetable_slots(
    payload: schemas.TimetableSlotBulkDelete,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(check_timetable_management_access)
):
    """
    Delete multiple timetable slots based on provided filters.
    If multiple filters are provided, they are combined with AND.
    """
    query = db.query(models.TimetableSlot)
    
    if payload.ids:
        query = query.filter(models.TimetableSlot.id.in_(payload.ids))
    if payload.stream_id:
        query = query.filter(models.TimetableSlot.stream_id == payload.stream_id)
    if payload.day_of_week:
        query = query.filter(models.TimetableSlot.day_of_week == payload.day_of_week)
    if payload.start_time:
        query = query.filter(models.TimetableSlot.start_time == payload.start_time)
    if payload.end_time:
        query = query.filter(models.TimetableSlot.end_time == payload.end_time)
        
    deleted_count = query.delete(synchronize_session=False)
    db.commit()
    
    return {"status": "success", "message": f"Deleted {deleted_count} slots matching criteria."}

@router.delete("/{slot_id}")
def delete_timetable_slot(
    slot_id: UUID,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(check_timetable_management_access)
):
    """
    Delete a single timetable slot by ID.
    """
    slot = db.query(models.TimetableSlot).filter(models.TimetableSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Timetable slot not found")
        
    db.delete(slot)
    db.commit()
    return {"status": "success", "message": "Slot deleted successfully"}

@router.patch("/{slot_id}", response_model=schemas.TimetableSlotResponse)
def update_timetable_slot(
    slot_id: UUID,
    payload: schemas.TimetableSlotUpdate,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(check_timetable_management_access)
):
    """
    Update a single timetable slot.
    """
    slot = db.query(models.TimetableSlot).filter(models.TimetableSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Timetable slot not found")
        
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(slot, key, value)
        
    db.commit()
    db.refresh(slot)
    return slot
