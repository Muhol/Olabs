from pydantic import BaseModel
from typing import Optional, List, Any
from uuid import UUID
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
    class_id: Optional[UUID] = None
    stream_id: Optional[UUID] = None
    stream: Optional[str] = None

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    admission_number: Optional[str] = None
    class_id: Optional[UUID] = None
    stream_id: Optional[UUID] = None
    stream: Optional[str] = None
    activated: Optional[bool] = None
    profile_photo: Optional[str] = None

class StudentResponse(BaseModel):
    id: UUID
    full_name: str
    admission_number: str
    activated: bool
    profile_photo: Optional[str] = None
    class_id: Optional[UUID] = None
    stream_id: Optional[UUID] = None
    is_cleared: bool
    
    class Config:
        from_attributes = True

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
    book_number: Optional[str] = None

class ReturnBookRequest(BaseModel):
    book_number: Optional[str] = None



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

class PaginatedSubjectResponse(BaseModel):
    total: int
    items: List[SubjectResponse]

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

# Timetable Slot schemas
class TimetableSlotBase(BaseModel):
    stream_id: UUID # Non-nullable as per user request
    subject_id: Optional[UUID] = None
    start_time: str
    end_time: str
    day_of_week: int # 1-6
    type: str # lesson, break

class TimetableSlotCreate(TimetableSlotBase):
    pass

class TimetableSlotBulkCreate(BaseModel):
    slots: List[TimetableSlotCreate]

class TimetableSlotBulkDelete(BaseModel):
    ids: Optional[List[UUID]] = None
    stream_id: Optional[UUID] = None
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class TimetableSlotResponse(TimetableSlotBase):
    id: UUID
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None
    class Config:
        from_attributes = True

class TimetableSlotUpdate(BaseModel):
    subject_id: Optional[UUID] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    day_of_week: Optional[int] = None
    type: Optional[str] = None

# New Attendance Session schemas
class AttendanceSessionBase(BaseModel):
    subject_id: UUID
    timetable_slot_id: Optional[UUID] = None
    session_date: datetime.date = datetime.date.today()
    status: str = "open"

class AttendanceSessionCreate(AttendanceSessionBase):
    teacher_id: Optional[UUID] = None

class AttendanceSessionResponse(AttendanceSessionBase):
    id: UUID
    teacher_id: Optional[UUID] = None
    created_at: datetime.datetime
    submitted_at: Optional[datetime.datetime] = None
    class Config:
        from_attributes = True

# New Attendance Record schemas
class AttendanceRecordBase(BaseModel):
    attendance_session_id: UUID
    student_id: UUID
    status: str

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecordResponse(AttendanceRecordBase):
    id: UUID
    class Config:
        from_attributes = True

# Attendance schemas (Legacy - kept for compatibility)
class AttendanceBase(BaseModel):
    student_id: UUID
    subject_id: Optional[UUID] = None
    status: str
    remarks: Optional[str] = None
    date: datetime.datetime = datetime.datetime.utcnow()

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: UUID
    class Config:
        from_attributes = True

# Timetable schemas
class TimetableEntryBase(BaseModel):
    class_id: UUID
    stream_id: Optional[UUID] = None
    subject_id: UUID
    day_of_week: str
    start_time: str
    end_time: str
    room: Optional[str] = None

class TimetableEntryCreate(TimetableEntryBase):
    pass

class TimetableEntryResponse(TimetableEntryBase):
    id: UUID
    subject_name: Optional[str] = None
    class Config:
        from_attributes = True

# Announcement schemas
class AnnouncementBase(BaseModel):
    title: str
    content: str
    subject_id: Optional[UUID] = None

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: UUID
    created_at: datetime.datetime
    created_by_id: UUID
    author_name: Optional[str] = None
    class Config:
        from_attributes = True

# Assignment Submission schemas
class AssignmentSubmissionBase(BaseModel):
    assignment_id: UUID
    student_id: UUID
    file_url: Optional[str] = None

class AssignmentSubmissionCreate(AssignmentSubmissionBase):
    pass

class AssignmentSubmissionUpdate(BaseModel):
    status: Optional[str] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None

class AssignmentSubmissionResponse(AssignmentSubmissionBase):
    id: UUID
    submitted_at: datetime.datetime
    status: str
    grade: Optional[float] = None
    feedback: Optional[str] = None
    class Config:
        from_attributes = True

# Exam Result schemas
class ExamResultBase(BaseModel):
    student_id: UUID
    subject_id: UUID
    term: str
    year: int
    exam_type: str
    marks: float
    grade: Optional[str] = None
    remarks: Optional[str] = None

class ExamResultCreate(ExamResultBase):
    pass

class ExamResultResponse(ExamResultBase):
    id: UUID
    subject_name: Optional[str] = None
    class Config:
        from_attributes = True

# Fee schemas
class FeeRecordBase(BaseModel):
    student_id: UUID
    amount: float
    type: str
    description: str

class FeeRecordCreate(FeeRecordBase):
    pass

class FeeRecordResponse(FeeRecordBase):
    id: UUID
    date: datetime.datetime
    recorded_by_id: Optional[UUID] = None
    class Config:
        from_attributes = True

class FeeStructureBase(BaseModel):
    class_id: UUID
    title: str
    amount: float
    term: str
    year: int

class FeeStructureCreate(FeeStructureBase):
    pass

class FeeStructureResponse(FeeStructureBase):
    id: UUID
    class Config:
        from_attributes = True

# Course Material schemas
class CourseMaterialBase(BaseModel):
    subject_id: UUID
    title: str
    description: Optional[str] = None
    file_url: str
    file_type: str

class CourseMaterialCreate(CourseMaterialBase):
    pass

class CourseMaterialResponse(CourseMaterialBase):
    id: UUID
    created_at: datetime.datetime
    class Config:
        from_attributes = True
