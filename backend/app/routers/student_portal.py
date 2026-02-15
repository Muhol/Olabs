from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Float
from typing import List, Dict, Any
from .. import database, models, schemas
from .student_auth import get_current_student
import datetime

router = APIRouter()

@router.get("/dashboard")
def get_student_dashboard(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(database.get_db)
):
    # 1. Upcoming Assignments (due in next 7 days)
    now = datetime.datetime.utcnow()
    next_week = now + datetime.timedelta(days=7)
    upcoming_assignments = db.query(models.Assignment).join(models.Subject).filter(
        models.Subject.assigned_students.any(id=current_student.id),
        models.Assignment.due_date >= now,
        models.Assignment.due_date <= next_week
    ).all()

    # 2. Overdue Assignments (past due and not submitted)
    overdue_assignments = db.query(models.Assignment).join(models.Subject).outerjoin(
        models.AssignmentSubmission, 
        (models.AssignmentSubmission.assignment_id == models.Assignment.id) & 
        (models.AssignmentSubmission.student_id == current_student.id)
    ).filter(
        models.Subject.assigned_students.any(id=current_student.id),
        models.Assignment.due_date < now,
        models.AssignmentSubmission.id == None # Not submitted
    ).all()

    # 3. Attendance Percentage (New session-based tracking)
    total_attendance = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.student_id == current_student.id).count()
    present_attendance = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == current_student.id,
        models.AttendanceRecord.status.in_(["present", "late"])
    ).count()
    attendance_percentage = (present_attendance / total_attendance * 100) if total_attendance > 0 else 100.0

    # 4. Announcements
    announcements = db.query(models.Announcement).filter(
        (models.Announcement.subject_id == None) | # School-wide
        models.Announcement.subject_id.in_(
            db.query(models.Subject.id).filter(models.Subject.assigned_students.any(id=current_student.id))
        )
    ).order_by(models.Announcement.created_at.desc()).limit(5).all()

    # 5. Timetable preview
    # Get iso day (1-7), but our system uses 1-6 (Mon-Sat)
    today_iso = datetime.datetime.now().isoweekday()
    
    # Get all slots for student's stream
    all_slots = db.query(models.TimetableSlot).filter(
        models.TimetableSlot.stream_id == current_student.stream_id
    ).order_by(models.TimetableSlot.day_of_week, models.TimetableSlot.start_time).all()

    # Format slots for frontend (include subject name and teacher)
    formatted_slots = []
    for s in all_slots:
        teacher_name = None
        if s.subject_id:
            # Get teacher for this subject in student's class
            assignment = db.query(models.TeacherSubjectAssignment).filter(
                models.TeacherSubjectAssignment.subject_id == s.subject_id,
                models.TeacherSubjectAssignment.class_id == current_student.class_id
            ).first()
            if assignment and assignment.teacher:
                teacher_name = assignment.teacher.full_name

        formatted_slots.append({
            "id": str(s.id),
            "subject_name": s.subject.name if s.subject else "Free",
            "teacher_name": teacher_name or ("-" if s.type == 'lesson' else None),
            "start_time": s.start_time,
            "end_time": s.end_time,
            "day_of_week": s.day_of_week,
            "type": s.type
        })

    timetable_today = [s for s in formatted_slots if s["day_of_week"] == today_iso]
    timetable_weekly = formatted_slots

    # 6. Fee Balance
    total_charges = db.query(func.sum(models.FeeRecord.amount)).filter(
        models.FeeRecord.student_id == current_student.id,
        models.FeeRecord.type == "charge"
    ).scalar() or 0.0
    total_payments = db.query(func.sum(models.FeeRecord.amount)).filter(
        models.FeeRecord.student_id == current_student.id,
        models.FeeRecord.type == "payment"
    ).scalar() or 0.0
    fee_balance = total_charges - total_payments

    return {
        "upcoming_assignments": upcoming_assignments,
        "overdue_assignments": overdue_assignments,
        "attendance_percentage": attendance_percentage,
        "announcements": announcements,
        "timetable_today": timetable_today,
        "timetable_weekly": timetable_weekly,
        "fee_balance": fee_balance
    }

@router.get("/subjects", response_model=List[Dict[str, Any]])
def get_student_subjects(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(database.get_db)
):
    subjects = db.query(models.Subject).filter(
        models.Subject.assigned_students.any(id=current_student.id)
    ).all()
    
    result = []
    for subject in subjects:
        # Get primary teacher for this subject in student's class
        assignment = db.query(models.TeacherSubjectAssignment).filter(
            models.TeacherSubjectAssignment.subject_id == subject.id,
            models.TeacherSubjectAssignment.class_id == current_student.class_id
        ).first()
        
        teacher_name = assignment.teacher.full_name if assignment and assignment.teacher else "Not Assigned"
        
        result.append({
            "id": subject.id,
            "name": subject.name,
            "teacher_name": teacher_name
        })
    return result

@router.get("/subjects/{subject_id}")
def get_subject_details(
    subject_id: str,
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(database.get_db)
):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Check if student is enrolled
    if not any(s.id == current_student.id for s in subject.assigned_students):
        raise HTTPException(status_code=403, detail="Not enrolled in this subject")

    # performance analytics (assignment average)
    avg_marks = db.query(func.avg(cast(models.AssignmentSubmission.grade, Float))).filter(
        models.AssignmentSubmission.student_id == current_student.id,
        models.AssignmentSubmission.assignment_id.in_(
            db.query(models.Assignment.id).filter(models.Assignment.subject_id == subject_id)
        ),
        models.AssignmentSubmission.grade != None
    ).scalar()

    announcements = db.query(models.Announcement).filter(
        models.Announcement.subject_id == subject_id
    ).order_by(models.Announcement.created_at.desc()).all()

    materials = db.query(models.CourseMaterial).filter(
        models.CourseMaterial.subject_id == subject_id
    ).order_by(models.CourseMaterial.created_at.desc()).all()

    assignments = db.query(models.Assignment).outerjoin(
        models.AssignmentSubmission,
        (models.AssignmentSubmission.assignment_id == models.Assignment.id) &
        (models.AssignmentSubmission.student_id == current_student.id)
    ).filter(
        models.Assignment.subject_id == subject_id
    ).all()

    exam_results = db.query(models.ExamResult).filter(
        models.ExamResult.student_id == current_student.id,
        models.ExamResult.subject_id == subject_id
    ).all()

    return {
        "id": subject.id,
        "name": subject.name,
        "performance_avg": avg_marks or 0.0,
        "announcements": announcements,
        "materials": materials,
        "assignments": assignments,
        "exam_results": exam_results
    }

@router.get("/results")
def get_all_results(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(database.get_db)
):
    # Grouped by year then term
    raw_results = db.query(models.ExamResult).join(models.Subject).filter(
        models.ExamResult.student_id == current_student.id
    ).all()
    
    grouped = {}
    for res in raw_results:
        year = str(res.year)
        term = res.term
        if year not in grouped:
            grouped[year] = {}
        if term not in grouped[year]:
            grouped[year][term] = []
        
        grouped[year][term].append({
            "subject": res.subject.name,
            "type": res.exam_type,
            "marks": res.marks,
            "grade": res.grade,
            "remarks": res.remarks
        })
    return grouped

@router.get("/ledger")
def get_fee_ledger(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(database.get_db)
):
    records = db.query(models.FeeRecord).filter(
        models.FeeRecord.student_id == current_student.id
    ).order_by(models.FeeRecord.date.desc()).all()
    return records
