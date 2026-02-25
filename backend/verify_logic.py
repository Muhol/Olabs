import sys
import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import models, schemas
from app.database import Base
from app.services import cbc as service

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_grading_simple.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_tests():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    try:
        print("Testing standard average calculation...")
        sid = uuid.uuid4()
        subid = uuid.uuid4()
        term = "Term 1"
        year = 2024
        
        # 1. First Exam: 40/50 (80%)
        e1 = models.ExamResult(
            id=uuid.uuid4(), student_id=sid, subject_id=subid, term=term, year=year,
            marks=40, max_score=50
        )
        # 2. Second Exam: 30/50 (60%)
        e2 = models.ExamResult(
            id=uuid.uuid4(), student_id=sid, subject_id=subid, term=term, year=year,
            marks=30, max_score=50
        )
        db.add_all([e1, e2])
        db.commit()
        
        summaries = service.calculate_subject_term_summaries(db, subid, term, year)
        assert len(summaries) == 1
        assert summaries[0].total_score == 70.0
        assert summaries[0].performance_level == "ME"
        print("Standard average: PASSED")

        print("Testing weighted average calculation...")
        db.query(models.ExamResult).delete()
        db.query(models.SubjectTermResult).delete()
        
        # Opener: 40/50 (80%), Weight 30% -> 24 points
        e1 = models.ExamResult(
            id=uuid.uuid4(), student_id=sid, subject_id=subid, term=term, year=year,
            marks=40, max_score=50, weight=30
        )
        # Final: 45/50 (90%), Weight 70% -> 63 points
        e2 = models.ExamResult(
            id=uuid.uuid4(), student_id=sid, subject_id=subid, term=term, year=year,
            marks=45, max_score=50, weight=70
        )
        db.add_all([e1, e2])
        db.commit()
        
        summaries = service.calculate_subject_term_summaries(db, subid, term, year)
        assert len(summaries) == 1
        assert summaries[0].total_score == 87.0
        assert summaries[0].performance_level == "EE"
        print("Weighted average: PASSED")
        
        print("All backend tests PASSED!")
        
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        if os.path.exists("./test_grading_simple.db"):
            os.remove("./test_grading_simple.db")

if __name__ == "__main__":
    run_tests()
