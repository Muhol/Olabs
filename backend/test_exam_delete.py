import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import models, schemas, database
from app.services import cbc
from sqlalchemy.orm import Session
import uuid

def test_exam_delete_flow():
    db = next(database.get_db())
    
    # 1. Get a subject
    subject = db.query(models.Subject).first()
    if not subject:
        print("Error: Need a subject to test.")
        return
    subject_id = subject.id
    print(f"Testing with Subject: {subject.name} ({subject_id})")

    # 2. Create an exam
    exam_data = schemas.ExamCreate(
        name=f"Delete Test {uuid.uuid4().hex[:4]}",
        subject_id=subject_id,
        term="Term 1",
        year=2026,
        competency_ids=[]
    )
    
    print(f"Creating exam: {exam_data.name}")
    db_exam = cbc.create_exam(db, exam_data)
    exam_id = db_exam.id
    print(f"Exam created with ID: {exam_id}")
    
    # 3. Verify it exists
    exists = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    assert exists is not None
    print("Verified exam exists in DB.")

    # 4. Delete the exam
    print(f"Deleting exam: {exam_id}")
    success = cbc.delete_exam(db, exam_id)
    assert success is True
    print("Delete service returned True.")

    # 5. Verify it's gone
    missing = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    assert missing is None
    print("Verified exam no longer exists in DB.")

    print("\nSUCCESS: Exam deletion flow verification completed.")

if __name__ == "__main__":
    test_exam_delete_flow()
