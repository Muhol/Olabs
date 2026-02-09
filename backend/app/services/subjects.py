from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from .. import models, schemas
import uuid

from sqlalchemy.exc import IntegrityError

from sqlalchemy import and_, or_, not_

def get_subjects(db: Session, available_for_teacher_id: str = None):
    query = db.query(models.Subject)
    
    if available_for_teacher_id:
        query = query.filter(
            or_(
                not_(models.Subject.teacher_assignments.any()),
                models.Subject.teacher_assignments.any(models.TeacherSubjectAssignment.teacher_id == available_for_teacher_id)
            )
        )
        
    subjects = query.all()
    res = []
    for subj in subjects:
        res.append({
            "id": str(subj.id),
            "name": subj.name,
            "is_compulsory": subj.is_compulsory,
            "class_id": str(subj.class_id),
            "class_name": subj.assigned_class.name if subj.assigned_class else None,
            "stream_id": str(subj.stream_id) if subj.stream_id else None,
            "stream_name": subj.assigned_stream.name if subj.assigned_stream else None,
            "student_count": subj.student_count,
            "assigned_teacher_id": str(subj.teacher_assignments[0].teacher_id) if subj.teacher_assignments else None
        })
    return res

def create_subject(db: Session, subject: schemas.SubjectCreate):
    db_subject = models.Subject(
        id=uuid.uuid4(),
        name=subject.name,
        is_compulsory=subject.is_compulsory,
        class_id=subject.class_id,
        stream_id=subject.stream_id
    )
    try:
        db.add(db_subject)
        
        # Auto-enroll students if compulsory
        if db_subject.is_compulsory:
            query = db.query(models.Student).filter(models.Student.class_id == db_subject.class_id)
            if db_subject.stream_id:
                query = query.filter(models.Student.stream_id == db_subject.stream_id)
            
            all_students = query.all()
            db_subject.assigned_students = all_students
            
        db.commit()
        db.refresh(db_subject)

        # Handle teacher assignment if provided
        if subject.teacher_id:
            db_assignment = models.TeacherSubjectAssignment(
                id=uuid.uuid4(),
                teacher_id=subject.teacher_id,
                subject_id=db_subject.id,
                class_id=db_subject.class_id,
                stream_id=db_subject.stream_id
            )
            db.add(db_assignment)
            db.commit()

        return db_subject
    except IntegrityError:
        db.rollback()
        raise ValueError("Subject with this name already exists in this class/stream")

def update_subject(db: Session, subject_id: str, subject_update: schemas.SubjectUpdate):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not db_subject:
        return None
    
    update_data = subject_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subject, key, value)
    
    try:
        db.commit()
        db.refresh(db_subject)
        return db_subject
    except IntegrityError:
        db.rollback()
        raise ValueError("Subject with this name already exists in this class/stream")

def delete_subject(db: Session, subject_id: str):
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if db_subject:
        db.delete(db_subject)
        db.commit()
        return True
    return False

def assign_subjects_to_student(db: Session, student_id: str, subject_ids: List[str]):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        return None
    
    # Get subjects
    subjects = db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
    student.subjects = subjects
    db.commit()
    return student

def assign_subjects_to_teacher(db: Session, user_id: str, subject_ids: List[str]):
    teacher = db.query(models.User).filter(and_(models.User.id == user_id, models.User.role.in_(["teacher", "admin", "SUPER_ADMIN"]))).first()
    if not teacher:
        return None
    
    # Get subjects
    subjects = db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
    teacher.assigned_subjects = subjects
    db.commit()
    return teacher

def assign_subjects_to_teacher_with_classes(db: Session, teacher_id: str, assignments: List[schemas.TeacherSubjectAssignmentCreate]):
    """
    Assign subjects to a teacher with specific class/stream context.
    Replaces all existing assignments for this teacher.
    """
    teacher = db.query(models.User).filter(
        and_(
            models.User.id == teacher_id,
            models.User.role.in_(["teacher", "admin", "SUPER_ADMIN"])
        )
    ).first()
    
    if not teacher:
        return None
    
    # Delete existing assignments
    db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == teacher_id
    ).delete()
    
    # Create new assignments
    for assignment in assignments:
        # Verify subject, class, and stream exist
        subject = db.query(models.Subject).filter(models.Subject.id == assignment.subject_id).first()
        class_obj = db.query(models.Class).filter(models.Class.id == assignment.class_id).first()
        
        if not subject or not class_obj:
            continue
        
        if assignment.stream_id:
            stream = db.query(models.Stream).filter(models.Stream.id == assignment.stream_id).first()
            if not stream:
                continue
        
        db_assignment = models.TeacherSubjectAssignment(
            teacher_id=teacher_id,
            subject_id=assignment.subject_id,
            class_id=assignment.class_id,
            stream_id=assignment.stream_id
        )
        db.add(db_assignment)
    
    db.commit()
    return get_teacher_subject_assignments(db, teacher_id)

def get_teacher_subject_assignments(db: Session, teacher_id: str):
    """Get all subject assignments for a teacher with class/stream details"""
    assignments = db.query(models.TeacherSubjectAssignment).filter(
        models.TeacherSubjectAssignment.teacher_id == teacher_id
    ).all()
    
    res = []
    for a in assignments:
        query = db.query(models.Student).filter(
            and_(
                models.Student.class_id == a.class_id,
                models.Student.subjects.any(models.Subject.id == a.subject_id)
            )
        )
        if a.stream_id:
            query = query.filter(models.Student.stream_id == a.stream_id)
        student_count = query.count()
            
        res.append({
            "id": str(a.id),
            "subject_id": str(a.subject_id),
            "subject_name": a.subject.name,
            "class_id": str(a.class_id),
            "class_name": a.assigned_class.name,
            "stream_id": str(a.stream_id) if a.stream_id else None,
            "stream_name": a.assigned_stream.name if a.assigned_stream else None,
            "is_compulsory": a.subject.is_compulsory,
            "student_count": student_count
        })
    return res

def enroll_students_in_subject(db: Session, subject_id: str, student_ids: List[str]):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        return None
    
    # Get students
    students = db.query(models.Student).filter(models.Student.id.in_(student_ids)).all()
    subject.assigned_students = students
    db.commit()
    db.refresh(subject)
    return subject

def get_enrolled_student_ids(db: Session, subject_id: str):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        return []
    return [str(s.id) for s in subject.assigned_students]
