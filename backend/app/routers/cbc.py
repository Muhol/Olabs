from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, auth, models
from ..database import get_db
from ..services import cbc as service
from uuid import UUID

router = APIRouter(prefix="/cbc", tags=["CBC Grading"])

# Helper for Teacher/Admin access
def check_teacher_admin_access(current_user: dict = Depends(auth.get_current_user)):
    role = current_user.get("role")
    if role in ["teacher", "admin", "SUPER_ADMIN"]:
        return current_user
    raise HTTPException(status_code=403, detail="Access denied. Requires Teacher or Admin role.")

@router.get("/competencies", response_model=List[schemas.CompetencyResponse])
def list_competencies(db: Session = Depends(get_db)):
    return service.get_competencies(db)

@router.post("/competencies/with-rubrics", response_model=schemas.CompetencyResponse)
def create_competency_with_rubrics(
    competency: schemas.CompetencyWithRubricsCreate,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(check_teacher_admin_access)
):
    return service.create_competency_with_rubrics(db, competency)

@router.get("/subjects/{subject_id}/competencies", response_model=List[schemas.CompetencyResponse])
def get_subject_competencies(subject_id: str, db: Session = Depends(get_db)):
    competencies = service.get_subject_competencies(db, subject_id)
    if competencies is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return competencies

@router.post("/subjects/{subject_id}/competencies", response_model=List[schemas.CompetencyResponse])
def link_competencies(
    subject_id: str, 
    competency_ids: List[UUID], 
    db: Session = Depends(get_db),
    admin_user: dict = Depends(check_teacher_admin_access)
):
    result = service.link_competencies_to_subject(db, subject_id, competency_ids)
    if result is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return result

@router.post("/assessments", response_model=schemas.StudentCompetencyAssessmentResponse)
def create_assessment(
    assessment: schemas.StudentCompetencyAssessmentCreate,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    return service.create_competency_assessment(db, assessment, teacher.get("id"))

@router.get("/assessments/student/{student_id}", response_model=List[schemas.StudentCompetencyAssessmentResponse])
def get_student_assessments(
    student_id: str,
    subject_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    # Authorization: Teachers/Admins or the Student themselves
    # For now, keeping it simple as per other routers
    return service.get_student_assessments(db, student_id, subject_id)

@router.get("/assessments/subject/{subject_id}", response_model=List[schemas.StudentCompetencyAssessmentResponse])
def get_subject_assessments(
    subject_id: str,
    term: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    if term is None or year is None:
        from ..services import admin_exams
        current = admin_exams.get_current_term_exam(db)
        if current:
            term = term or current.term
            year = year or current.year

    return service.get_subject_assessments(db, subject_id, term, year)

@router.post("/rubrics/bulk", response_model=List[schemas.RubricResponse])
def bulk_create_rubrics(
    rubrics: List[schemas.RubricCreate],
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    return service.bulk_create_rubrics(db, rubrics)

@router.get("/rubrics/subject/{subject_id}", response_model=List[schemas.RubricResponse])
def get_subject_rubrics(subject_id: str, db: Session = Depends(get_db)):
    return service.get_subject_rubrics(db, subject_id)

@router.get("/rubrics/{rubric_id}", response_model=schemas.RubricResponse)
def get_rubric(rubric_id: str, db: Session = Depends(get_db)):
    rubric = service.get_rubric(db, rubric_id)
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    return rubric

@router.post("/summaries", response_model=schemas.SubjectTermResultResponse)
def create_summary(
    summary: schemas.SubjectTermResultCreate,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    return service.create_or_update_subject_term_result(db, summary)

@router.get("/summaries/student/{student_id}", response_model=List[schemas.SubjectTermResultResponse])
def get_student_summaries(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    return service.get_student_term_summaries(db, student_id)

@router.get("/summaries/subject/{subject_id}", response_model=List[schemas.SubjectTermResultResponse])
def list_subject_summaries(
    subject_id: str,
    term: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    if term is None or year is None:
        from ..services import admin_exams
        current = admin_exams.get_current_term_exam(db)
        if current:
            term = term or current.term
            year = year or current.year
    
    return service.get_subject_term_results(db, subject_id, term, year)

@router.post("/subjects/{subject_id}/recalculate-summaries", response_model=List[schemas.SubjectTermResultResponse])
def recalculate_subject_summaries(
    subject_id: UUID,
    term: str,
    year: int,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    """Automates SubjectTermResult generation by averaging exam marks."""
    return service.calculate_subject_term_summaries(db, subject_id, term, year)

# Exam Result Endpoints
@router.post("/exams/results", response_model=schemas.ExamResultResponse)
def create_exam_result(
    result: schemas.ExamResultCreate,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    return service.create_exam_result(db, result)

@router.post("/exams/results/bulk", response_model=List[schemas.ExamResultResponse])
def bulk_create_exam_results(
    bulk_data: schemas.BulkExamResultCreate,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    return service.bulk_upsert_exam_results(db, bulk_data, teacher_id=teacher.get("id"))

@router.get("/exams/results", response_model=List[schemas.ExamResultResponse])
def list_exam_results(
    student_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    term: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(auth.get_current_user)
):
    if term is None or year is None:
        from ..services import admin_exams
        current = admin_exams.get_current_term_exam(db)
        if current:
            term = term or current.term
            year = year or current.year
            
    return service.get_exam_results(db, student_id=student_id, subject_id=subject_id, term=term, year=year)

# Exam Management
@router.post("/exams", response_model=schemas.ExamResponse)
def create_exam(
    exam: schemas.ExamCreate,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    return service.create_exam(db, exam)

@router.get("/exams/subject/{subject_id}", response_model=List[schemas.ExamResponse])
def get_subject_exams(
    subject_id: str,
    term: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    if term is None or year is None:
        from ..services import admin_exams
        current = admin_exams.get_current_term_exam(db)
        if current:
            term = term or current.term
            year = year or current.year
            
    return service.get_subject_exams(db, subject_id, term, year)

@router.delete("/exams/{exam_id}")
def delete_exam(
    exam_id: UUID,
    db: Session = Depends(get_db),
    admin_user: dict = Depends(check_teacher_admin_access)
):
    if not service.delete_exam(db, exam_id):
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"status": "success", "message": "Exam deleted successfully"}

@router.put("/exams/{exam_id}/competencies", response_model=schemas.ExamResponse)
def update_exam_competencies(
    exam_id: UUID,
    data: schemas.ExamCompetencyUpdate,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    exam = service.update_exam_competencies(db, exam_id, data.competency_ids)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam
@router.get("/class-score-sheet", response_model=schemas.ClassScoreSheetResponse)
def get_class_score_sheet(
    term: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    if term is None or year is None:
        from ..services import admin_exams
        current = admin_exams.get_current_term_exam(db)
        if current:
            term = term or current.term
            year = year or current.year
            
    class_id = teacher.get("assigned_class_id")
    stream_id = teacher.get("assigned_stream_id")

    if not class_id:
        raise HTTPException(status_code=400, detail="Teacher is not assigned to any class.")

    # Fetch students
    student_query = db.query(models.Student).filter(models.Student.class_id == class_id)
    if stream_id:
        student_query = student_query.filter(models.Student.stream_id == stream_id)
    students = student_query.all()

    # Fetch subjects
    subject_query = db.query(models.Subject).filter(models.Subject.class_id == class_id)
    if stream_id:
        subject_query = subject_query.filter(
            (models.Subject.stream_id == stream_id) | (models.Subject.stream_id == None)
        )
    subjects = subject_query.all()

    # Fetch results
    student_ids = [s.id for s in students]
    subject_ids = [sub.id for sub in subjects]
    
    results_query = db.query(models.SubjectTermResult).filter(
        models.SubjectTermResult.student_id.in_(student_ids),
        models.SubjectTermResult.subject_id.in_(subject_ids)
    )
    if term:
        results_query = results_query.filter(models.SubjectTermResult.term == term)
    if year:
        results_query = results_query.filter(models.SubjectTermResult.year == year)
    
    existing_results = results_query.all()
    
    # Map results for quick lookup: (student_id, subject_id) -> performance_level
    results_map = { (r.student_id, r.subject_id): r.performance_level for r in existing_results }

    # Format response
    response_students = []
    for s in students:
        student_results = {}
        for sub in subjects:
            student_results[str(sub.id)] = results_map.get((s.id, sub.id))
        
        response_students.append(schemas.StudentScoreSummary(
            id=s.id,
            full_name=s.full_name,
            admission_number=s.admission_number,
            results=student_results
        ))

    response_subjects = [schemas.SubjectInfo(id=sub.id, name=sub.name) for sub in subjects]

    return schemas.ClassScoreSheetResponse(
        students=response_students,
        subjects=response_subjects,
        term=term,
        year=year
    )

@router.get("/term-reports/{student_id}", response_model=schemas.FullReportCardResponse)
def get_student_report_card(
    student_id: UUID,
    term: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    if term is None or year is None:
        from ..services import admin_exams
        current = admin_exams.get_current_term_exam(db)
        if current:
            term = term or current.term
            year = year or current.year
    # 1. Fetch student with class/stream
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Resolve class teacher name: find user with assigned_class_id == student's class
    class_teacher_name = "N/A"
    if student.class_id:
        class_teacher = db.query(models.User).filter(
            models.User.assigned_class_id == student.class_id
        ).first()
        if class_teacher:
            class_teacher_name = class_teacher.full_name

    # 2. Fetch Term Report with eagerly loaded entries
    term_report = db.query(models.TermReport).filter(
        models.TermReport.student_id == student_id,
        models.TermReport.term == term,
        models.TermReport.year == year
    ).first()

    # 3. Fetch Subject Results with subject names
    subject_results = db.query(models.SubjectTermResult, models.Subject.name).join(
        models.Subject, models.Subject.id == models.SubjectTermResult.subject_id
    ).filter(
        models.SubjectTermResult.student_id == student_id,
        models.SubjectTermResult.term == term,
        models.SubjectTermResult.year == year
    ).all()

    subjects_data = [
        {
            "id": str(r.SubjectTermResult.id),
            "subject_id": str(r.SubjectTermResult.subject_id),
            "subject_name": r.name,
            "performance_level": r.SubjectTermResult.performance_level,
            "remarks": r.SubjectTermResult.remarks
        }
        for r in subject_results
    ]

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
        "term_report": term_report
    }


@router.post("/term-reports", response_model=schemas.TermReportResponse)
def upsert_term_report(
    report_data: schemas.TermReportCreate,
    db: Session = Depends(get_db),
    teacher: dict = Depends(check_teacher_admin_access)
):
    # Upsert the header (attendance + comments)
    report = db.query(models.TermReport).filter(
        models.TermReport.student_id == report_data.student_id,
        models.TermReport.term == report_data.term,
        models.TermReport.year == report_data.year
    ).first()

    if report:
        report.total_days = report_data.total_days
        report.present_days = report_data.present_days
        report.teacher_comment = report_data.teacher_comment
        report.head_teacher_comment = report_data.head_teacher_comment
    else:
        report = models.TermReport(
            student_id=report_data.student_id,
            term=report_data.term,
            year=report_data.year,
            total_days=report_data.total_days,
            present_days=report_data.present_days,
            teacher_comment=report_data.teacher_comment,
            head_teacher_comment=report_data.head_teacher_comment,
        )
        db.add(report)
        db.flush()  # get id before adding entries

    # Rebuild entries (delete + re-insert for simplicity)
    if report_data.entries:
        db.query(models.TermReportEntry).filter(
            models.TermReportEntry.report_id == report.id
        ).delete()
        for entry_data in report_data.entries:
            entry = models.TermReportEntry(
                report_id=report.id,
                item_id=entry_data.item_id,
                level=entry_data.level
            )
            db.add(entry)

    db.commit()
    db.refresh(report)
    return report
