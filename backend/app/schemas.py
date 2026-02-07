from pydantic import BaseModel
from typing import Optional, List

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
