from sqlalchemy.orm import Session
from .. import models, schemas
from uuid import UUID
import uuid
import datetime
from typing import List, Optional

def get_competencies(db: Session):
    return db.query(models.Competency).all()

def get_subject_competencies(db: Session, subject_id: str):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        return None
    return subject.competencies

def link_competencies_to_subject(db: Session, subject_id: str, competency_ids: List[UUID]):
    competencies = db.query(models.Competency).filter(models.Competency.id.in_(competency_ids)).all()
    for comp in competencies:
        comp.subject_id = subject_id
    db.commit()
    return competencies

def create_competency_with_rubrics(db: Session, comp_data: schemas.CompetencyWithRubricsCreate):
    db_comp = models.Competency(
        name=comp_data.name,
        description=comp_data.description,
        subject_id=comp_data.subject_id
    )
    db.add(db_comp)
    db.flush() # Get ID

    for rubric in comp_data.rubrics:
        db_rubric = models.Rubric(
            competency_id=db_comp.id,
            performance_level=rubric.performance_level,
            descriptor=rubric.descriptor
        )
        db.add(db_rubric)
    
    db.commit()
    db.refresh(db_comp)
    return db_comp

def create_competency_assessment(db: Session, assessment_data: schemas.StudentCompetencyAssessmentCreate, assessor_id: UUID):
    db_assessment = models.StudentCompetencyAssessment(
        **assessment_data.model_dump(),
        assessed_by=assessor_id
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    return db_assessment

def get_student_assessments(db: Session, student_id: str, subject_id: Optional[str] = None):
    query = db.query(models.StudentCompetencyAssessment).filter(models.StudentCompetencyAssessment.student_id == student_id)
    if subject_id:
        query = query.filter(models.StudentCompetencyAssessment.subject_id == subject_id)
    
    assessments = query.all()
    # Add competency name for convenience
    for a in assessments:
        a.competency_name = a.competency.name if a.competency else "Unknown"
    return assessments

def get_subject_assessments(db: Session, subject_id: str, term: Optional[str] = None, year: Optional[int] = None):
    query = db.query(models.StudentCompetencyAssessment).filter(models.StudentCompetencyAssessment.subject_id == subject_id)
    if term:
        query = query.filter(models.StudentCompetencyAssessment.term == term)
    if year:
        query = query.filter(models.StudentCompetencyAssessment.year == year)
    
    assessments = query.all()
    for a in assessments:
        a.competency_name = a.competency.name if a.competency else "Unknown"
    return assessments

def bulk_create_rubrics(db: Session, rubrics_data: List[schemas.RubricCreate]):
    created = []
    for rubric_data in rubrics_data:
        # Check if already exists for this competency/level to avoid duplicates if re-saving
        existing = db.query(models.Rubric).filter(
            models.Rubric.competency_id == rubric_data.competency_id,
            models.Rubric.performance_level == rubric_data.performance_level
        ).first()
        
        if existing:
            existing.descriptor = rubric_data.descriptor
            created.append(existing)
        else:
            db_rubric = models.Rubric(
                competency_id=rubric_data.competency_id,
                performance_level=rubric_data.performance_level,
                descriptor=rubric_data.descriptor
            )
            db.add(db_rubric)
            created.append(db_rubric)
    
    db.commit()
    return created

def get_subject_rubrics(db: Session, subject_id: str):
    return db.query(models.Rubric).join(models.Competency).filter(models.Competency.subject_id == subject_id).all()

def get_rubric(db: Session, rubric_id: str):
    return db.query(models.Rubric).filter(models.Rubric.id == rubric_id).first()

def create_or_update_subject_term_result(db: Session, summary_data: schemas.SubjectTermResultCreate):
    existing = db.query(models.SubjectTermResult).filter(
        models.SubjectTermResult.student_id == summary_data.student_id,
        models.SubjectTermResult.subject_id == summary_data.subject_id,
        models.SubjectTermResult.term == summary_data.term,
        models.SubjectTermResult.year == summary_data.year
    ).first()
    
    if existing:
        for key, value in summary_data.model_dump().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_summary = models.SubjectTermResult(**summary_data.model_dump())
        db.add(db_summary)
        db.commit()
        db.refresh(db_summary)
        return db_summary

def get_student_term_summaries(db: Session, student_id: str):
    return db.query(models.SubjectTermResult).filter(models.SubjectTermResult.student_id == student_id).all()

def get_subject_term_results(db: Session, subject_id: str, term: str, year: int):
    return db.query(models.SubjectTermResult).filter(
        models.SubjectTermResult.subject_id == subject_id,
        models.SubjectTermResult.term == term,
        models.SubjectTermResult.year == year
    ).all()

# Exam Result Logic
def create_exam_result(db: Session, result_data: schemas.ExamResultCreate):
    db_result = models.ExamResult(**result_data.model_dump())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def bulk_upsert_exam_results(db: Session, bulk_data: schemas.BulkExamResultCreate, teacher_id: Optional[UUID] = None):
    results = []
    # 1. Exam Results
    for result_data in bulk_data.results:
        # Check if already exists for student/exam
        existing = db.query(models.ExamResult).filter(
            models.ExamResult.student_id == result_data.student_id,
            models.ExamResult.exam_id == result_data.exam_id,
            models.ExamResult.subject_id == result_data.subject_id,
            models.ExamResult.term == result_data.term,
            models.ExamResult.year == result_data.year
        ).first()

        if existing:
            # Update existing
            for key, value in result_data.model_dump().items():
                setattr(existing, key, value)
            results.append(existing)
        else:
            # Create new
            db_result = models.ExamResult(**result_data.model_dump())
            db.add(db_result)
            results.append(db_result)

    # 2. Term Summaries
    summaries = []
    if bulk_data.summaries:
        for summary_data in bulk_data.summaries:
            existing_s = db.query(models.SubjectTermResult).filter(
                models.SubjectTermResult.student_id == summary_data.student_id,
                models.SubjectTermResult.subject_id == summary_data.subject_id,
                models.SubjectTermResult.term == summary_data.term,
                models.SubjectTermResult.year == summary_data.year
            ).first()

            if existing_s:
                for key, value in summary_data.model_dump().items():
                    setattr(existing_s, key, value)
                summaries.append(existing_s)
            else:
                db_s = models.SubjectTermResult(**summary_data.model_dump())
                db.add(db_s)
                summaries.append(db_s)

    # 3. Competency Assessments
    if bulk_data.assessments:
        for assess_data in bulk_data.assessments:
            existing_a = db.query(models.StudentCompetencyAssessment).filter(
                models.StudentCompetencyAssessment.student_id == assess_data.student_id,
                models.StudentCompetencyAssessment.subject_id == assess_data.subject_id,
                models.StudentCompetencyAssessment.competency_id == assess_data.competency_id,
                models.StudentCompetencyAssessment.term == assess_data.term,
                models.StudentCompetencyAssessment.year == assess_data.year,
                models.StudentCompetencyAssessment.exam_id == assess_data.exam_id
            ).first()

            if existing_a:
                for key, value in assess_data.model_dump().items():
                    setattr(existing_a, key, value)
                if teacher_id:
                    existing_a.assessed_by = teacher_id
            else:
                db_a = models.StudentCompetencyAssessment(**assess_data.model_dump())
                if teacher_id:
                    db_a.assessed_by = teacher_id
                db.add(db_a)

    db.commit()
    return results

def get_exam_results(db: Session, student_id: Optional[str] = None, subject_id: Optional[str] = None, term: Optional[str] = None, year: Optional[int] = None):
    query = db.query(models.ExamResult)
    if student_id:
        query = query.filter(models.ExamResult.student_id == student_id)
    if subject_id:
        query = query.filter(models.ExamResult.subject_id == subject_id)
    if term:
        query = query.filter(models.ExamResult.term == term)
    if year:
        query = query.filter(models.ExamResult.year == year)
    return query.all()

# Exam Management
def create_exam(db: Session, exam_data: schemas.ExamCreate):
    db_exam = models.Exam(
        subject_id=exam_data.subject_id,
        name=exam_data.name,
        term=exam_data.term,
        year=exam_data.year,
        term_exam_id=exam_data.term_exam_id
    )
    if exam_data.competency_ids:
        competencies = db.query(models.Competency).filter(models.Competency.id.in_(exam_data.competency_ids)).all()
        db_exam.competencies = competencies
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam

def get_subject_exams(db: Session, subject_id: str, term: Optional[str] = None, year: Optional[int] = None):
    query = db.query(models.Exam).filter(models.Exam.subject_id == subject_id)
    if term:
        query = query.filter(models.Exam.term == term)
    if year:
        query = query.filter(models.Exam.year == year)
    return query.all()

def delete_exam(db: Session, exam_id: UUID):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if db_exam:
        # Cascades handle assessments and results if defined in models, 
        # but let's be explicit if needed or just rely on SQLAlchemy cascades.
        # Based on models.py, Exam has assessments with cascade="all, delete-orphan"
        # and exam_results is also linked to exam_id.
        db.delete(db_exam)
        db.commit()
        return True
    return False

def update_exam_competencies(db: Session, exam_id: UUID, competency_ids: List[UUID]):
    db_exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not db_exam:
        return None
    
    competencies = db.query(models.Competency).filter(models.Competency.id.in_(competency_ids)).all()
    db_exam.competencies = competencies
    db.commit()
    db.refresh(db_exam)
    return db_exam

def calculate_subject_term_summaries(db: Session, subject_id: UUID, term: str, year: int):
    """
    Automates SubjectTermResult generation by averaging exam marks for each student.
    Handles weighted averages if weights are defined in ExamResults.
    """
    # 1. Fetch all unique student IDs who have exam results for this subject/term/year
    student_ids = db.query(models.ExamResult.student_id).filter(
        models.ExamResult.subject_id == subject_id,
        models.ExamResult.term == term,
        models.ExamResult.year == year
    ).distinct().all()
    
    student_ids = [s[0] for s in student_ids]
    
    summaries = []
    for student_id in student_ids:
        results = db.query(models.ExamResult).filter(
            models.ExamResult.student_id == student_id,
            models.ExamResult.subject_id == subject_id,
            models.ExamResult.term == term,
            models.ExamResult.year == year
        ).all()
        
        if not results:
            continue
            
        total_weighted_score = 0
        total_weight = 0
        standard_sum = 0
        count = 0
        
        has_weights = any(r.weight is not None for r in results)
        
        if has_weights:
            for r in results:
                w = r.weight if r.weight is not None else 0
                # If weight is defined, we assume 'marks' is already normalized 
                # or we use (marks/max_score)*weight. 
                # Standard practice: if weight is 30%, mark is 25/50 -> (25/50)*30%
                if r.max_score and r.max_score > 0:
                    total_weighted_score += (r.marks / r.max_score) * w
                else:
                    total_weighted_score += r.marks # fallback
                total_weight += w
            
            # If weights sum to something > 0, we can use it. 
            # If total_weight is e.g. 100, average is just total_weighted_score.
            # If it's less, we might want to normalize to 100.
            final_score = total_weighted_score
        else:
            # Standard average
            for r in results:
                if r.max_score and r.max_score > 0:
                    standard_sum += (r.marks / r.max_score) * 100
                else:
                    standard_sum += r.marks
                count += 1
            final_score = standard_sum / count if count > 0 else 0
            
        final_score = round(final_score, 1)
        
        # Map to performance level (CBC Standards)
        level = "BE"
        if final_score >= 80: level = "EE"
        elif final_score >= 60: level = "ME"
        elif final_score >= 40: level = "AE"
        
        # Upsert summary
        summary_data = schemas.SubjectTermResultCreate(
            student_id=student_id,
            subject_id=subject_id,
            term=term,
            year=year,
            total_score=final_score,
            performance_level=level
        )
        summary = create_or_update_subject_term_result(db, summary_data)
        summaries.append(summary)
        
    return summaries
