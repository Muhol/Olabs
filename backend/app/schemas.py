from pydantic import BaseModel
from typing import Optional, List, Any
import uuid
import datetime

# --- Pydantic Schemas ---

class BookCreate(BaseModel):
    book_id: str
    title: str
    author: str
    category: str
    subject: str
    isbn: Optional[str] = None
    total_copies: int = 1

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    subject: Optional[str] = None
    isbn: Optional[str] = None
    total_copies: Optional[int] = None

class StudentCreate(BaseModel):
    full_name: str
    admission_number: str
    class_id: Optional[str] = None
    stream_id: Optional[str] = None
    stream: Optional[str] = None

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    admission_number: Optional[str] = None
    class_id: Optional[str] = None
    stream_id: Optional[str] = None
    stream: Optional[str] = None

class ClassCreate(BaseModel):
    name: str

class StreamCreate(BaseModel):
    name: str
    class_id: str

class StreamUpdate(BaseModel):
    name: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: str
    class_id: Optional[str] = None
    stream_id: Optional[str] = None
    subroles: Optional[List[str]] = None

class ConfigUpdate(BaseModel):
    allow_public_signup: Optional[bool] = None



class SystemLogbase(BaseModel):
    level: str
    action: str
    user_email: str
    details: str

class BorrowCreate(BaseModel):
    book_id: str
    student_id: str

from uuid import UUID

class SubjectBase(BaseModel):
    name: str
    is_compulsory: bool = True
    class_id: UUID
    stream_id: Optional[UUID] = None

class SubjectCreate(SubjectBase):
    teacher_id: Optional[UUID] = None

class SubjectResponse(SubjectBase):
    id: UUID
    class_name: Optional[str] = None
    stream_name: Optional[str] = None
    student_count: int
    assigned_teacher_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    is_compulsory: Optional[bool] = None
    class_id: Optional[UUID] = None
    stream_id: Optional[UUID] = None

class SubjectAssign(BaseModel):
    subject_ids: List[str]

class SubjectEnrollmentRequest(BaseModel):
    student_ids: List[str]

# New schemas for teacher-subject-class assignments
class TeacherSubjectAssignmentCreate(BaseModel):
    subject_id: str
    class_id: str
    stream_id: Optional[str] = None

class TeacherSubjectAssignmentBatch(BaseModel):
    assignments: List[TeacherSubjectAssignmentCreate]

class TeacherSubjectAssignmentResponse(BaseModel):
    id: str
    subject_id: str
    subject_name: str
    class_id: str
    class_name: str
    stream_id: Optional[str] = None
    stream_name: Optional[str] = None
    is_compulsory: bool
    student_count: int
    
    class Config:
        from_attributes = True
# Assignment schemas
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime.datetime] = None

class AssignmentCreate(AssignmentBase):
    subject_id: UUID
    teacher_id: UUID

class AssignmentResponse(AssignmentBase):
    id: UUID
    subject_id: UUID
    subject_name: Optional[str] = None
    teacher_id: UUID
    teacher_name: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime.datetime] = None
