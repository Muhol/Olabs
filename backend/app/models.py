from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Date, Time, ForeignKey, Text, Table, UniqueConstraint, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import datetime
from .database import Base

cbc_level_enum = Enum(
    "EE",  # Exceeding Expectation
    "ME",  # Meeting Expectation
    "AE",  # Approaching Expectation
    "BE",  # Below Expectation
    name="cbc_performance_level"
)

class Class(Base):
    __tablename__ = "classes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True)

    students = relationship("Student", back_populates="student_class")
    streams = relationship("Stream", back_populates="parent_class")
    borrows = relationship("BorrowRecord", back_populates="associated_class")

# Association tables for Subject many-to-many relationships
student_subjects = Table(
    "student_subjects",
    Base.metadata,
    Column("student_id", UUID(as_uuid=True), ForeignKey("students.id"), primary_key=True),
    Column("subject_id", UUID(as_uuid=True), ForeignKey("subjects.id"), primary_key=True),
)

teacher_subjects = Table(
    "teacher_subjects",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column("subject_id", UUID(as_uuid=True), ForeignKey("subjects.id"), primary_key=True),
)

subject_competencies = Table(
    "subject_competencies",
    Base.metadata,
    Column("subject_id", UUID(as_uuid=True), ForeignKey("subjects.id"), primary_key=True),
    Column("competency_id", UUID(as_uuid=True), ForeignKey("competencies.id"), primary_key=True),
)

class Competency(Base):
    __tablename__ = "competencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)  # e.g Critical Thinking
    description = Column(Text, nullable=True)

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True) # Mathematics, English, etc.
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False)
    stream_id = Column(UUID(as_uuid=True), ForeignKey("streams.id"), nullable=True) # Nullable for class-wide subjects
    is_compulsory = Column(Boolean, default=True)

    # Relationships
    assigned_class = relationship("Class")
    assigned_stream = relationship("Stream")
    assigned_students = relationship("Student", secondary=student_subjects, back_populates="subjects")
    assigned_teachers = relationship("User", secondary=teacher_subjects, back_populates="assigned_subjects")
    teacher_assignments = relationship("TeacherSubjectAssignment", back_populates="subject", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan")
    attendance_sessions = relationship("AttendanceSession", back_populates="subject", cascade="all, delete-orphan")
    competencies = relationship("Competency", secondary=subject_competencies)

    @property
    def student_count(self):
        return len(self.assigned_students)

    __table_args__ = (
        UniqueConstraint('name', 'class_id', 'stream_id', name='unique_subject_class_stream'),
    )

class TeacherSubjectAssignment(Base):
    """Tracks which teacher teaches which subject in which class/stream"""
    __tablename__ = "teacher_subject_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    stream_id = Column(UUID(as_uuid=True), ForeignKey("streams.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    teacher = relationship("User", back_populates="subject_assignments")
    subject = relationship("Subject", back_populates="teacher_assignments")
    assigned_class = relationship("Class")
    assigned_stream = relationship("Stream")

    # Unique constraint to prevent duplicate assignments
    __table_args__ = (
        UniqueConstraint('teacher_id', 'subject_id', 'class_id', 'stream_id', name='unique_teacher_subject_class_stream'),
    )

class Stream(Base):
    __tablename__ = "streams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True) # e.g. "A", "B", "Gold", "North"
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"))

    parent_class = relationship("Class", back_populates="streams")
    students = relationship("Student", back_populates="assigned_stream")
    borrows = relationship("BorrowRecord", back_populates="associated_stream")

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String)  # librarian | admin | SUPER_ADMIN | teacher
    
    assigned_class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True)
    assigned_stream_id = Column(UUID(as_uuid=True), ForeignKey("streams.id"), nullable=True)

    assigned_class = relationship("Class")
    assigned_stream = relationship("Stream")
    subroles = relationship("UserSubrole", back_populates="user", cascade="all, delete-orphan")
    assigned_subjects = relationship("Subject", secondary="teacher_subjects", back_populates="assigned_teachers")
    subject_assignments = relationship("TeacherSubjectAssignment", back_populates="teacher", cascade="all, delete-orphan")
    created_assignments = relationship("Assignment", back_populates="teacher", cascade="all, delete-orphan")

class UserSubrole(Base):
    __tablename__ = "user_subroles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    subrole_name = Column(String, index=True) # timetable, finance, teacher, all, etc.

    user = relationship("User", back_populates="subroles")

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String)
    admission_number = Column(String, unique=True, index=True)
    password = Column(String, nullable=True) # Hashed password for student login
    activated = Column(Boolean, default=False)
    profile_photo = Column(String, nullable=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True)
    stream_id = Column(UUID(as_uuid=True), ForeignKey("streams.id"), nullable=True)
    stream = Column(String, nullable=True) # Keep legacy for now or migrate
    is_cleared = Column(Boolean, default=False)
    cleared_at = Column(DateTime, nullable=True)
    
    student_class = relationship("Class", back_populates="students")
    assigned_stream = relationship("Stream", back_populates="students")
    borrows = relationship("BorrowRecord", back_populates="student")
    subjects = relationship("Subject", secondary="student_subjects", back_populates="assigned_students")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")
    attendance = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("AssignmentSubmission", back_populates="student", cascade="all, delete-orphan")
    exam_results = relationship("ExamResult", back_populates="student", cascade="all, delete-orphan")
    fee_records = relationship("FeeRecord", back_populates="student", cascade="all, delete-orphan")
    competency_assessments = relationship("StudentCompetencyAssessment", back_populates="student", cascade="all, delete-orphan")
    subject_summaries = relationship("StudentSubjectSummary", back_populates="student", cascade="all, delete-orphan")

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stream_id = Column(UUID(as_uuid=True), ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    start_time = Column(String) # e.g. "08:00"
    end_time = Column(String)   # e.g. "09:00"
    day_of_week = Column(Integer) # 1-6 (Mon-Sat)
    type = Column(String) # lesson, break

    stream = relationship("Stream")
    subject = relationship("Subject")

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    timetable_slot_id = Column(UUID(as_uuid=True), ForeignKey("timetable_slots.id", ondelete="SET NULL"), nullable=True)
    session_date = Column(Date, default=datetime.date.today)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="open") # open, submitted, locked
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)

    subject = relationship("Subject", back_populates="attendance_sessions")
    timetable_slot = relationship("TimetableSlot")
    teacher = relationship("User")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attendance_session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(String) # present, absent, late, excused, sick, suspended

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True) # Null for general attendance
    date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String) # Present, Absent, Late
    remarks = Column(Text, nullable=True)

    student = relationship("Student", back_populates="attendance")
    subject = relationship("Subject")

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    stream_id = Column(UUID(as_uuid=True), ForeignKey("streams.id", ondelete="CASCADE"), nullable=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String) # Monday, Tuesday, etc.
    start_time = Column(String) # e.g. "08:00"
    end_time = Column(String) # e.g. "09:00"
    room = Column(String, nullable=True)

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String)
    content = Column(Text)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    subject = relationship("Subject")
    author = relationship("User")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    file_url = Column(String, nullable=True)
    status = Column(String) # pending, submitted, late, graded
    grade = Column(Float, nullable=True)
    performance_level = Column(cbc_level_enum, nullable=True)
    feedback = Column(Text, nullable=True)
    rubric_feedback = Column(Text, nullable=True)

    assignment = relationship("Assignment")
    student = relationship("Student", back_populates="submissions")

class ExamResult(Base):
    __tablename__ = "exam_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    term = Column(String) # e.g. "Term 1"
    year = Column(Integer) # e.g. 2024
    exam_type = Column(String) # e.g. "Mid-term", "Final"
    marks = Column(Float)
    grade = Column(String, nullable=True)
    performance_level = Column(cbc_level_enum, nullable=True)
    competency_score = Column(Float, nullable=True)  # optional weighted computation
    remarks = Column(Text, nullable=True)

    student = relationship("Student", back_populates="exam_results")
    subject = relationship("Subject")

class FeeRecord(Base):
    __tablename__ = "fee_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float)
    type = Column(String) # payment, charge
    date = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(String)
    recorded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    student = relationship("Student", back_populates="fee_records")
    recorded_by = relationship("User")

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    title = Column(String)
    amount = Column(Float)
    term = Column(String)
    year = Column(Integer)

class CourseMaterial(Base):
    __tablename__ = "course_materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String)
    description = Column(Text, nullable=True)
    file_url = Column(String)
    file_type = Column(String) # pdf, slide, video
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subject = relationship("Subject")

class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(String, unique=True, index=True)
    title = Column(String, index=True)
    author = Column(String)
    category = Column(String)
    subject = Column(String)
    isbn = Column(String, nullable=True)
    total_copies = Column(Integer, default=1)
    borrowed_copies = Column(Integer, default=0)

    @property
    def available(self):
        return self.total_copies > self.borrowed_copies

    borrows = relationship("BorrowRecord", back_populates="book")
    missing_reports = relationship("MissingReport", back_populates="book")

class BorrowRecord(Base):
    __tablename__ = "borrow_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"))
    stream_id = Column(UUID(as_uuid=True), ForeignKey("streams.id"), nullable=True)
    borrow_date = Column(DateTime, default=datetime.datetime.utcnow)
    due_date = Column(DateTime)
    return_date = Column(DateTime, nullable=True)
    status = Column(String)  # borrowed | returned | overdue | missing
    book_number = Column(String, nullable=True) # Unique identifier for the specific copy (e.g. Barcode)

    book = relationship("Book", back_populates="borrows")
    student = relationship("Student", back_populates="borrows")
    associated_class = relationship("Class", back_populates="borrows")
    associated_stream = relationship("Stream", back_populates="borrows")

class MissingReport(Base):
    __tablename__ = "missing_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"))
    reported_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    report_date = Column(DateTime, default=datetime.datetime.utcnow)
    resolution = Column(String, default="outstanding")  # found | replaced | outstanding
    notes = Column(Text, nullable=True)

    book = relationship("Book", back_populates="missing_reports")

class GlobalConfig(Base):
    __tablename__ = "global_config"

    id = Column(Integer, primary_key=True)
    allow_public_signup = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)



class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    level = Column(String) # info | warning | error | critical
    action = Column(String)
    user_email = Column(String)
    target_user = Column(String, nullable=True)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Assignment(Base):
    """Stores curriculum assignments (homework, tasks) for subjects"""
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    file_public_id = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    subject = relationship("Subject", back_populates="assignments")
    teacher = relationship("User", back_populates="created_assignments")

class StudentCompetencyAssessment(Base):
    __tablename__ = "student_competency_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"))
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"))
    competency_id = Column(UUID(as_uuid=True), ForeignKey("competencies.id", ondelete="CASCADE"))

    term = Column(String)
    year = Column(Integer)

    performance_level = Column(cbc_level_enum, nullable=False)
    remarks = Column(Text, nullable=True)

    assessed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assessed_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="competency_assessments")
    subject = relationship("Subject")
    competency = relationship("Competency")
    assessor = relationship("User")

class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"))
    title = Column(String)

    subject = relationship("Subject")
    criteria = relationship("RubricCriteria", back_populates="rubric", cascade="all, delete-orphan")

class RubricCriteria(Base):
    __tablename__ = "rubric_criteria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rubric_id = Column(UUID(as_uuid=True), ForeignKey("rubrics.id"))
    competency_id = Column(UUID(as_uuid=True), ForeignKey("competencies.id"))
    description = Column(Text)

    rubric = relationship("Rubric", back_populates="criteria")
    competency = relationship("Competency")

class StudentSubjectSummary(Base):
    __tablename__ = "student_subject_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"))

    term = Column(String)
    year = Column(Integer)

    overall_performance = Column(cbc_level_enum)
    teacher_comment = Column(Text)

    student = relationship("Student", back_populates="subject_summaries")
    subject = relationship("Subject")
