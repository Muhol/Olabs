from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Any
from jose import JWTError, jwt
import bcrypt
from .. import database, models, schemas
import os

router = APIRouter()

# Password helper functions using direct bcrypt implementation
# passlib has compatibility issues with bcrypt 4.0+ and Python 3.13
def verify_password(plain_password: str, hashed_password: str):
    try:
        if not hashed_password:
            return False
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        print(f"[AUTH ERROR] Password verification failed: {e}")
        return False

def get_password_hash(password: str):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# JWT Configuration
SECRET_KEY = os.getenv("STUDENT_JWT_SECRET", "supersecretstudentkey") # Use a different secret than Clerk if needed
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/student/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_student(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        student_id: str = payload.get("sub")
        if student_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise credentials_exception
    if not student.activated:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not activated. Please complete onboarding."
        )
    return student

@router.post("/onboard/verify")
def verify_onboarding(admission_number: str, db: Session = Depends(database.get_db)):
    """Step 1 of onboarding: Verify admission number and activation status"""
    student = db.query(models.Student).filter(models.Student.admission_number == admission_number).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with this admission number.")
    
    if student.activated:
        raise HTTPException(status_code=400, detail="Account already activated. Please login instead.")
    
    return {"message": "Verification successful", "full_name": student.full_name}

@router.post("/onboard/activate")
def activate_account(
    admission_number: str, 
    new_password: str, 
    db: Session = Depends(database.get_db)
):
    """Step 2 of onboarding: Set password and activate account"""
    student = db.query(models.Student).filter(models.Student.admission_number == admission_number).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    
    if student.activated:
        raise HTTPException(status_code=400, detail="Account already activated.")
    
    student.password = get_password_hash(new_password)
    student.activated = True
    db.commit()
    
    # Create token for immediate login
    access_token = create_access_token(data={"sub": str(student.id), "role": "student"})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(database.get_db)
):
    student = db.query(models.Student).filter(models.Student.admission_number == form_data.username).first()
    if not student:
        raise HTTPException(status_code=400, detail="Incorrect admission number or password")
    
    if not student.activated:
        raise HTTPException(status_code=403, detail="Account not activated. Please onboard first.")
    
    if not verify_password(form_data.password, student.password):
        raise HTTPException(status_code=400, detail="Incorrect admission number or password")
    
    access_token = create_access_token(data={"sub": str(student.id), "role": "student"})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_student: models.Student = Depends(get_current_student)):
    return {
        "id": str(current_student.id),
        "full_name": current_student.full_name,
        "admission_number": current_student.admission_number,
        "class_id": str(current_student.class_id) if current_student.class_id else None,
        "stream_id": str(current_student.stream_id) if current_student.stream_id else None,
        "profile_photo": current_student.profile_photo
    }
