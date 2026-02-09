from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Table, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import datetime
from .database import Base

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
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True)
    stream_id = Column(UUID(as_uuid=True), ForeignKey("streams.id"), nullable=True)
    stream = Column(String, nullable=True) # Keep legacy for now or migrate
    is_cleared = Column(Boolean, default=False)
    cleared_at = Column(DateTime, nullable=True)
    
    student_class = relationship("Class", back_populates="students")
    assigned_stream = relationship("Stream", back_populates="students")
    borrows = relationship("BorrowRecord", back_populates="student")
    subjects = relationship("Subject", secondary="student_subjects", back_populates="assigned_students")

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
