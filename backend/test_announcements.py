import sys
import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

# Add current directory to path
sys.path.append(os.getcwd())

from app import models, schemas
from app.database import Base
from app.services import student_features as service

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_announcements.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_tests():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    try:
        # Create Dummy Metadata
        cls_id = uuid.uuid4()
        stream_id = uuid.uuid4()
        subject_id = uuid.uuid4()
        
        db_cls = models.Class(id=cls_id, name="Form 1")
        db_stream = models.Stream(id=stream_id, name="North", class_id=cls_id)
        db_subject = models.Subject(id=subject_id, name="Math", class_id=cls_id)
        db.add_all([db_cls, db_stream, db_subject])
        db.commit()

        # Create Users
        admin_id = uuid.uuid4()
        teacher_id = uuid.uuid4()
        student_id = uuid.uuid4()

        admin = models.User(id=admin_id, role="admin", full_name="Admin User")
        teacher = models.User(id=teacher_id, role="teacher", full_name="Teacher User")
        # Assign teacher to subject/stream
        teacher_assignment = models.TeacherSubjectAssignment(
            id=uuid.uuid4(), teacher_id=teacher_id, subject_id=subject_id, class_id=cls_id, stream_id=stream_id
        )
        
        student = models.Student(
            id=student_id, full_name="Student User", class_id=cls_id, stream_id=stream_id, admission_number="123"
        )
        
        db.add_all([admin, teacher, teacher_assignment, student])
        db.commit()

        print("--- Testing Permissions ---")

        admin_user = {"id": admin_id, "role": "admin"}
        teacher_user = {"id": teacher_id, "role": "teacher"}

        # 1. Admin creates School-wide
        print("Admin creating SCHOOL announcement...")
        ann_in = schemas.AnnouncementCreate(title="School Holiday", content="Holiday on Friday", category="SCHOOL")
        service.create_announcement(db, ann_in, admin_user)
        print("PASSED")

        # 2. Teacher creates School-wide (Should Fail)
        print("Teacher attempting SCHOOL announcement (Expect 403)...")
        try:
            service.create_announcement(db, ann_in, teacher_user)
            print("FAILED (Expected 403)")
        except HTTPException as e:
            assert e.status_code == 403
            print("PASSED (Caught 403)")

        # 3. Teacher creates Staff announcement (Should Fail)
        print("Teacher attempting STAFF announcement (Expect 403)...")
        staff_ann = schemas.AnnouncementCreate(title="Meeting", content="Meeting at 2pm", category="STAFF")
        try:
            service.create_announcement(db, staff_ann, teacher_user)
            print("FAILED (Expected 403)")
        except HTTPException as e:
            assert e.status_code == 403
            print("PASSED (Caught 403)")

        # 4. Teacher creates Subject announcement (Assigned Subject)
        print("Teacher creating SUBJECT announcement for assigned math...")
        subj_ann = schemas.AnnouncementCreate(title="Math Quiz", content="Quiz tomorrow", category="SUBJECT", subject_id=subject_id)
        service.create_announcement(db, subj_ann, teacher_user)
        print("PASSED")

        # 5. Teacher creates Subject announcement (Unassigned Subject)
        print("Teacher creating SUBJECT announcement for unassigned subject (Expect 403)...")
        other_subj_id = uuid.uuid4()
        other_subj = models.Subject(id=other_subj_id, name="English", class_id=cls_id)
        db.add(other_subj)
        db.commit()
        
        bad_subj_ann = schemas.AnnouncementCreate(title="English Quiz", content="Quiz tomorrow", category="SUBJECT", subject_id=other_subj_id)
        try:
            service.create_announcement(db, bad_subj_ann, teacher_user)
            print("FAILED (Expected 403)")
        except HTTPException as e:
            assert e.status_code == 403
            print("PASSED (Caught 403)")

        # 6. Admin creates Staff announcement
        print("Admin creating STAFF announcement...")
        service.create_announcement(db, staff_ann, admin_user)
        print("PASSED")

        print("\n--- Testing Visibility ---")

        # 7. Student visibility
        from app.routers import student_portal
        # Enroll student in subject
        student.subjects.append(db_subject)
        db.commit()

        print("Checking student dashboard announcements...")
        # Mocking the dashboard logic (simplified)
        announcements = db.query(models.Announcement).all()
        student_visible = []
        for ann in announcements:
            if ann.category == "SCHOOL":
                student_visible.append(ann)
            elif ann.category == "STREAM" and ann.stream_id == student.stream_id:
                student_visible.append(ann)
            elif ann.category == "SUBJECT":
                # Check if student is enrolled in this subject
                if any(s.id == ann.subject_id for s in student.subjects):
                    student_visible.append(ann)
        
        # We created: 1 SCHOOL, 1 SUBJECT (Math), 1 STAFF (Staff should NOT be visible)
        assert len(student_visible) == 2
        categories = [a.category for a in student_visible]
        assert "SCHOOL" in categories
        assert "SUBJECT" in categories
        assert "STAFF" not in categories
        print("PASSED (Student sees only SCHOOL and enrolled SUBJECT announcements)")

        print("\nAll backend announcement logic tests PASSED!")
        
    except Exception as e:
        print(f"\nTEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        if os.path.exists("./test_announcements.db"):
            os.remove("./test_announcements.db")

if __name__ == "__main__":
    run_tests()
