from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
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
    role = Column(String)  # librarian | admin | SUPER_ADMIN
    # Note: Students are managed in the separate Student table and do not have authenticated 'User' accounts.
    # BorrowRecord now points to Student, but if a librarian borrows (rare), we keep it simple for now.
    # Actually, the user says borrows are linked to "relevant users", and students are not part of the users table.
    # So borrows MUST point to Students.

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String)
    admission_number = Column(String, unique=True, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True)
    stream_id = Column(UUID(as_uuid=True), ForeignKey("streams.id"), nullable=True)
    stream = Column(String, nullable=True) # Keep legacy for now or migrate
    
    student_class = relationship("Class", back_populates="students")
    assigned_stream = relationship("Stream", back_populates="students")
    borrows = relationship("BorrowRecord", back_populates="student")

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
    __tablename__ = "global_configs"

    id = Column(Integer, primary_key=True, index=True)
    allow_public_signup = Column(Boolean, default=True)
    require_whitelist = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class WhitelistedEmail(Base):
    __tablename__ = "whitelisted_emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
