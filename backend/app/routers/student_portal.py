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
    from sqlalchemy import or_
    announcements = db.query(models.Announcement).filter(
        or_(
            models.Announcement.category == "SCHOOL",
            (models.Announcement.category == "STREAM") & (models.Announcement.stream_id == current_student.stream_id),
            (models.Announcement.category == "SUBJECT") & models.Announcement.subject_id.in_(
                db.query(models.Subject.id).filter(models.Subject.assigned_students.any(id=current_student.id))
            )
        )
    ).order_by(models.Announcement.created_at.desc()).limit(5).all()
    
    # Populate names for response
    for ann in announcements:
        ann.author_name = ann.author.full_name if ann.author else "Unknown"
        ann.class_name = ann.assigned_class.name if ann.assigned_class else None
        ann.stream_name = ann.assigned_stream.name if ann.assigned_stream else None
        ann.subject_name = ann.subject.name if ann.subject else None
        
        # Friendly target name
        if ann.category == "SCHOOL":
            ann.target_name = "Whole School"
        elif ann.category == "STREAM" and ann.assigned_stream:
            class_obj = ann.assigned_class or ann.assigned_stream.parent_class
            class_name = class_obj.name if class_obj else ""
            ann.target_name = f"{class_name}. {ann.assigned_stream.name}".strip(". ")
        elif ann.category == "SUBJECT" and ann.subject:
            class_name = ann.assigned_class.name if ann.assigned_class else (ann.subject.assigned_class.name if ann.subject.assigned_class else "")
            stream_name = ann.assigned_stream.name if ann.assigned_stream else (ann.subject.assigned_stream.name if ann.subject.assigned_stream else "")
            
            target = f"{ann.subject.name}"
            context = f"{class_name}. {stream_name}".strip(". ")
            if context:
                target += f" ({context})"
            ann.target_name = target
        elif ann.category == "STAFF":
            ann.target_name = "Staff Only"

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
        models.Announcement.subject_id == subject_id,
        models.Announcement.category == "SUBJECT"
    ).order_by(models.Announcement.created_at.desc()).all()
    
    # Populate names for response
    for ann in announcements:
        ann.author_name = ann.author.full_name if ann.author else "Unknown"
        ann.class_name = ann.assigned_class.name if ann.assigned_class else None
        ann.stream_name = ann.assigned_stream.name if ann.assigned_stream else None
        ann.subject_name = ann.subject.name if ann.subject else None
        
        # Friendly target name
        if ann.category == "SUBJECT" and ann.subject:
            class_name = ann.assigned_class.name if ann.assigned_class else (ann.subject.assigned_class.name if ann.subject.assigned_class else "")
            stream_name = ann.assigned_stream.name if ann.assigned_stream else (ann.subject.assigned_stream.name if ann.subject.assigned_stream else "")
            
            target = f"{ann.subject.name}"
            context = f"{class_name}. {stream_name}".strip(". ")
            if context:
                target += f" ({context})"
            ann.target_name = target
        else:
            ann.target_name = "Subject Target"

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
    # Fetch all data
    exam_results = db.query(models.ExamResult).join(models.Subject).filter(
        models.ExamResult.student_id == current_student.id
    ).all()
    
    term_summaries = db.query(models.SubjectTermResult).join(models.Subject).filter(
        models.SubjectTermResult.student_id == current_student.id
    ).all()
    
    grouped = {}
    
    # 1. Initialize structure and collect unique exams per term
    for res in exam_results:
        year = str(res.year)
        term = res.term
        if year not in grouped:
            grouped[year] = {}
        if term not in grouped[year]:
            grouped[year][term] = {
                "exams": set(),
                "subjects": {}
            }
        
        exam_name = res.exam.name if res.exam else "Assessment"
        grouped[year][term]["exams"].add(exam_name)
        
        sub_id = str(res.subject_id)
        if sub_id not in grouped[year][term]["subjects"]:
            grouped[year][term]["subjects"][sub_id] = {
                "name": res.subject.name,
                "scores": {},
                "grade": "N/A"
            }
        
        grouped[year][term]["subjects"][sub_id]["scores"][exam_name] = res.marks

    # 2. Add term summaries (calculated grade levels)
    for summ in term_summaries:
        year = str(summ.year)
        term = summ.term
        if year not in grouped: continue
        if term not in grouped[year]: continue
        
        sub_id = str(summ.subject_id)
        if sub_id in grouped[year][term]["subjects"]:
            grouped[year][term]["subjects"][sub_id]["grade"] = summ.performance_level or "N/A"
            grouped[year][term]["subjects"][sub_id]["average"] = summ.total_score

    # 3. Finalize structure: Convert sets to sorted lists and subjects to lists
    final_output = {}
    for year, terms in grouped.items():
        final_output[year] = {}
        for term, data in terms.items():
            # Sort exams (try to keep common ones like Opener, Mid-term, Final in order)
            exam_order = ["Opener", "Mid-term", "Final"]
            sorted_exams = sorted(list(data["exams"]), key=lambda x: exam_order.index(x) if x in exam_order else 99)
            
            final_output[year][term] = {
                "exams": sorted_exams,
                "subjects": sorted(list(data["subjects"].values()), key=lambda x: x["name"])
            }

    return final_output

@router.get("/ledger")
def get_fee_ledger(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(database.get_db)
):
    records = db.query(models.FeeRecord).filter(
        models.FeeRecord.student_id == current_student.id
    ).order_by(models.FeeRecord.date.desc()).all()
    return records

@router.get("/report-card")
def get_student_report_card(
    term: str,
    year: int,
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(database.get_db)
):
    """Return full CBC report card data for the logged-in student."""
    student = current_student

    # Resolve class teacher
    class_teacher_name = "N/A"
    if student.class_id:
        class_teacher = db.query(models.User).filter(
            models.User.assigned_class_id == student.class_id
        ).first()
        if class_teacher:
            class_teacher_name = class_teacher.full_name

    # Fetch TermReport
    from sqlalchemy.orm import joinedload
    term_report = db.query(models.TermReport).options(
        joinedload(models.TermReport.entries).joinedload(models.TermReportEntry.item)
    ).filter(
        models.TermReport.student_id == student.id,
        models.TermReport.term == term,
        models.TermReport.year == year
    ).first()

    # Fetch Subject Results
    subject_results = db.query(models.SubjectTermResult, models.Subject.name).join(
        models.Subject, models.Subject.id == models.SubjectTermResult.subject_id
    ).filter(
        models.SubjectTermResult.student_id == student.id,
        models.SubjectTermResult.term == term,
        models.SubjectTermResult.year == year
    ).all()

    subjects_data = [
        {
            "subject_name": r.name,
            "performance_level": r.SubjectTermResult.performance_level,
            "total_score": r.SubjectTermResult.total_score,
            "remarks": r.SubjectTermResult.remarks
        }
        for r in subject_results
    ]

    # Build the term report dict if exists
    term_report_data = None
    if term_report:
        entries_data = [
            {
                "item_id": str(e.item_id),
                "level": e.level,
                "item": {"name": e.item.name, "type": e.item.type} if e.item else None
            }
            for e in term_report.entries
        ]
        term_report_data = {
            "total_days": term_report.total_days,
            "present_days": term_report.present_days,
            "teacher_comment": term_report.teacher_comment,
            "head_teacher_comment": term_report.head_teacher_comment,
            "entries": entries_data
        }

    # Head teacher comment templates
    from .. import models as m
    htc_templates = {}
    templates = db.query(m.HeadTeacherCommentTemplate).all()
    for t in templates:
        htc_templates[t.level] = t.comment

    return {
        "student": {
            "full_name": student.full_name,
            "admission_number": student.admission_number,
            "grade": student.student_class.name if student.student_class else "N/A",
            "stream": student.assigned_stream.name if student.assigned_stream else "N/A",
            "class_teacher": class_teacher_name,
        },
        "term": term,
        "year": year,
        "subjects": subjects_data,
        "term_report": term_report_data,
        "htc_templates": htc_templates,
    }

@router.get("/report-card/available-terms")
def get_available_terms(
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(database.get_db)
):
    """Return a list of {term, year} combinations for which a term report exists."""
    reports = db.query(
        models.TermReport.term,
        models.TermReport.year
    ).filter(
        models.TermReport.student_id == current_student.id
    ).distinct().order_by(models.TermReport.year.desc(), models.TermReport.term.desc()).all()

    return [{"term": r.term, "year": r.year} for r in reports]

