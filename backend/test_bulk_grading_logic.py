import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import models, schemas, database
from app.services import cbc
from sqlalchemy.orm import Session
from uuid import UUID
import uuid

def test_bulk_grading():
    db = next(database.get_db())
    
    # 1. Get a student and a subject
    student = db.query(models.Student).first()
    subject = db.query(models.Subject).first()
    
    if not student or not subject:
        print("Error: Need at least one student and one subject to test.")
        return

    student_id = student.id
    subject_id = subject.id
    
    print(f"Testing with Student: {student.full_name} ({student_id})")
    print(f"Testing with Subject: {subject.name} ({subject_id})")
    
    # 2. Prepare bulk data
    term = "Term 1"
    year = 2026
    
    bulk_data = schemas.BulkExamResultCreate(
        results=[
            schemas.ExamResultCreate(
                student_id=student_id,
                subject_id=subject_id,
                term=term,
                year=year,
                exam_type="Mid-term",
                marks=85.5,
                remarks="Good progress"
            ),
            schemas.ExamResultCreate(
                student_id=student_id,
                subject_id=subject_id,
                term=term,
                year=year,
                exam_type="Final",
                marks=90.0,
                remarks="Excellent"
            )
        ]
    )
    
    # 3. Call bulk_upsert_exam_results
    print("Performing bulk upsert...")
    results = cbc.bulk_upsert_exam_results(db, bulk_data)
    
    print(f"Upserted {len(results)} results.")
    for r in results:
        print(f" - {r.exam_type}: {r.marks}")

    # 4. Verify fetch with filters
    print("Verifying fetch with filters...")
    fetched = cbc.get_exam_results(db, student_id=str(student_id), subject_id=str(subject_id), term=term, year=year)
    print(f"Fetched {len(fetched)} results for {term} {year}.")
    
    assert len(fetched) >= 2
    
    # 5. Test update via bulk
    print("Testing update via bulk...")
    bulk_update_data = schemas.BulkExamResultCreate(
        results=[
            schemas.ExamResultCreate(
                student_id=student_id,
                subject_id=subject_id,
                term=term,
                year=year,
                exam_type="Mid-term",
                marks=88.8,
                remarks="Updated marks"
            )
        ]
    )
    cbc.bulk_upsert_exam_results(db, bulk_update_data)
    
    # Verify update
    updated = cbc.get_exam_results(db, student_id=str(student_id), subject_id=str(subject_id), term=term, year=year)
    mid_term = next(r for r in updated if r.exam_type == "Mid-term")
    print(f"Updated Mid-term marks: {mid_term.marks}")
    assert mid_term.marks == 88.8
    
    print("\nSUCCESS: Bulk grading logic verified.")

if __name__ == "__main__":
    test_bulk_grading()
