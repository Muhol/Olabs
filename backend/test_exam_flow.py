import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import models, schemas, database
from app.services import cbc
from sqlalchemy.orm import Session
import uuid

def test_exam_flow():
    db = next(database.get_db())
    
    # 1. Get a subject
    subject = db.query(models.Subject).first()
    if not subject:
        print("Error: Need a subject to test.")
        return
    subject_id = subject.id
    print(f"Testing with Subject: {subject.name} ({subject_id})")

    # 2. Create a new competency with rubrics
    comp_data = schemas.CompetencyWithRubricsCreate(
        name=f"Critical Thinking {uuid.uuid4().hex[:4]}",
        description="Ability to analyze facts",
        subject_id=subject_id,
        rubrics=[
            schemas.RubricBase(performance_level="EE", descriptor="Exceeds expectations in analysis"),
            schemas.RubricBase(performance_level="ME", descriptor="Meets expectations in analysis"),
            schemas.RubricBase(performance_level="AE", descriptor="Approaching expectations in analysis"),
            schemas.RubricBase(performance_level="BE", descriptor="Below expectations in analysis")
        ]
    )
    
    print(f"Creating competency: {comp_data.name}")
    db_comp = cbc.create_competency_with_rubrics(db, comp_data)
    print(f"Competency created with ID: {db_comp.id}")
    assert len(db_comp.rubrics) == 4
    
    # 3. Create an exam linking this competency
    exam_data = schemas.ExamCreate(
        name=f"Integrated Test {uuid.uuid4().hex[:4]}",
        subject_id=subject_id,
        term="Term 1",
        year=2026,
        competency_ids=[db_comp.id]
    )
    
    print(f"Creating exam: {exam_data.name}")
    db_exam = cbc.create_exam(db, exam_data)
    print(f"Exam created with ID: {db_exam.id}")
    
    # 4. Verify linking
    fetched_exam = db.query(models.Exam).filter(models.Exam.id == db_exam.id).first()
    print(f"Fetched exam '{fetched_exam.name}' has {len(fetched_exam.competencies)} competencies.")
    assert len(fetched_exam.competencies) == 1
    assert fetched_exam.competencies[0].id == db_comp.id

    # 5. Verify rubrics are present on the linked competency
    linked_comp = fetched_exam.competencies[0]
    print(f"Linked competency '{linked_comp.name}' has {len(linked_comp.rubrics)} rubrics.")
    assert len(linked_comp.rubrics) == 4
    for r in linked_comp.rubrics:
        print(f" - {r.performance_level}: {r.descriptor}")

    print("\nSUCCESS: Exam flow verification completed.")

if __name__ == "__main__":
    test_exam_flow()
