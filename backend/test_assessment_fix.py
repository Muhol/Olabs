import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import models, schemas, database
from app.services import cbc
from sqlalchemy.orm import Session
import uuid

def test_assessment_fix():
    db = next(database.get_db())
    
    # 1. Setup
    subject = db.query(models.Subject).first()
    student = db.query(models.Student).first()
    comp = db.query(models.Competency).first()
    exam = db.query(models.Exam).first()
    teacher = db.query(models.User).filter(models.User.role == 'teacher').first()

    if not all([subject, student, comp, exam, teacher]):
        print("Error: Missing test data in DB.")
        return

    print(f"Testing with Student: {student.full_name}, Comp: {comp.name}")

    # 2. Test Bulk Upsert with Assessments
    bulk_data = schemas.BulkExamResultCreate(
        results=[],
        summaries=[],
        assessments=[
            schemas.StudentCompetencyAssessmentCreate(
                student_id=student.id,
                subject_id=subject.id,
                competency_id=comp.id,
                exam_id=exam.id,
                term=exam.term,
                year=exam.year,
                performance_level="ME",
                remarks="Auto-test update"
            )
        ]
    )
    
    print("Performing bulk upsert with teacher_id...")
    cbc.bulk_upsert_exam_results(db, bulk_data, teacher_id=teacher.id)

    # 3. Verify assessed_by is set
    a = db.query(models.StudentCompetencyAssessment).filter(
        models.StudentCompetencyAssessment.student_id == student.id,
        models.StudentCompetencyAssessment.competency_id == comp.id,
        models.StudentCompetencyAssessment.exam_id == exam.id
    ).first()

    assert a is not None
    assert a.assessed_by == teacher.id
    print(f"Verified: Assessed by set to {a.assessed_by}")

    # 4. Verify validation (optional assessed_by in response)
    resp = schemas.StudentCompetencyAssessmentResponse.model_validate(a)
    assert resp.assessed_by == teacher.id
    print("Verified: Schema validation success.")

    print("\nSUCCESS: Bulk assessment fix verification completed.")

if __name__ == "__main__":
    test_assessment_fix()
