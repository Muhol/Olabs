import sys
import os
import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from uuid import UUID

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import models, schemas
from app.database import Base
from app.services import cbc as service

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_grading.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_calculate_subject_term_summaries_standard(db):
    # Setup: Student, Subject, and Exam Results
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
    
    # Run calculation
    summaries = service.calculate_subject_term_summaries(db, subid, term, year)
    
    assert len(summaries) == 1
    # Average of 80% and 60% is 70%
    assert summaries[0].total_score == 70.0
    assert summaries[0].performance_level == "ME" # 60-79 is ME

def test_calculate_subject_term_summaries_weighted(db):
    sid = uuid.uuid4()
    subid = uuid.uuid4()
    term = "Term 1"
    year = 2024
    
    # 1. Opener: 40/50 (80%), Weight 30% -> 24 points
    e1 = models.ExamResult(
        id=uuid.uuid4(), student_id=sid, subject_id=subid, term=term, year=year,
        marks=40, max_score=50, weight=30
    )
    # 2. Final: 45/50 (90%), Weight 70% -> 63 points
    e2 = models.ExamResult(
        id=uuid.uuid4(), student_id=sid, subject_id=subid, term=term, year=year,
        marks=45, max_score=50, weight=70
    )
    db.add_all([e1, e2])
    db.commit()
    
    # Run calculation
    summaries = service.calculate_subject_term_summaries(db, subid, term, year)
    
    assert len(summaries) == 1
    # Total = 24 + 63 = 87
    assert summaries[0].total_score == 87.0
    assert summaries[0].performance_level == "EE" # 80+ is EE

def test_performance_level_mapping(db):
    sid = uuid.uuid4()
    subid = uuid.uuid4()
    term = "Term 1"
    year = 2024
    
    # BE Case: 35%
    e_be = models.ExamResult(
        id=uuid.uuid4(), student_id=sid, subject_id=subid, term=term, year=year,
        marks=17.5, max_score=50
    )
    db.add(e_be)
    db.commit()
    
    summaries = service.calculate_subject_term_summaries(db, subid, term, year)
    assert summaries[0].performance_level == "BE"
    
    # Cleanup for next check
    db.query(models.ExamResult).delete()
    db.query(models.SubjectTermResult).delete()
    
    # AE Case: 45%
    e_ae = models.ExamResult(
        id=uuid.uuid4(), student_id=sid, subject_id=subid, term=term, year=year,
        marks=22.5, max_score=50
    )
    db.add(e_ae)
    db.commit()
    summaries = service.calculate_subject_term_summaries(db, subid, term, year)
    assert summaries[0].performance_level == "AE"
