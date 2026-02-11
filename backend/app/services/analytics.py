from sqlalchemy.orm import Session
from .. import models
import datetime

def get_analytics(db: Session, current_user: dict):
    role = current_user.get("role")
    user_id = current_user.get("id")

    if role == "teacher":
        from sqlalchemy import func
        # Teacher specific stats
        teacher_user = db.query(models.User).filter(models.User.id == user_id).first()
        
        # 1. Total unique subjects assigned to this teacher via assignments table
        total_subjects = db.query(func.count(func.distinct(models.TeacherSubjectAssignment.subject_id))).filter(
            models.TeacherSubjectAssignment.teacher_id == user_id
        ).scalar() or 0

        # 2. Total unique students enrolled in subjects taught by this teacher
        subject_students = db.query(models.Student).filter(
            models.Student.subjects.any(
                models.Subject.teacher_assignments.any(models.TeacherSubjectAssignment.teacher_id == user_id)
            )
        ).count()

        # 3. Students in the teacher's assigned class (if they are a class teacher)
        class_students = 0
        if teacher_user and teacher_user.assigned_class_id:
            class_query = db.query(models.Student).filter(models.Student.class_id == teacher_user.assigned_class_id)
            if teacher_user.assigned_stream_id:
                class_query = class_query.filter(models.Student.stream_id == teacher_user.assigned_stream_id)
            class_students = class_query.count()

        # 4. Total assignments created by this teacher
        total_assignments = db.query(models.Assignment).filter(
            models.Assignment.teacher_id == user_id
        ).count()

        # 5. Active assignments (due in the future)
        active_assignments = db.query(models.Assignment).filter(
            models.Assignment.teacher_id == user_id,
            models.Assignment.due_date >= datetime.datetime.utcnow()
        ).count()

        # 6. Recent assignments
        recent_assignments_query = db.query(models.Assignment).filter(
            models.Assignment.teacher_id == user_id
        ).order_by(models.Assignment.created_at.desc()).limit(5).all()

        recent_assignments = [
            {
                "id": str(a.id),
                "title": a.title,
                "subject": a.subject.name,
                "class": a.subject.assigned_class.name,
                "due_date": a.due_date.isoformat() if a.due_date else None,
                "created_at": a.created_at.isoformat()
            } for a in recent_assignments_query
        ]

        return {
            "role": "teacher",
            "stats": {
                "total_subjects": total_subjects,
                "total_students": subject_students,
                "class_students": class_students,
                "total_assignments": total_assignments,
                "active_assignments": active_assignments
            },
            "recent_assignments": recent_assignments
        }

    # Default for Librarian, Admin, Super Admin
    total_books = db.query(models.Book).count()
    total_students = db.query(models.Student).count()
    active_borrows = db.query(models.BorrowRecord).filter(models.BorrowRecord.status == "borrowed").count()
    overdue_count = db.query(models.BorrowRecord).filter(
        models.BorrowRecord.status == "borrowed",
        models.BorrowRecord.due_date < datetime.datetime.utcnow()
    ).count()

    # Category distribution
    categories = db.query(models.Book.category).distinct().all()
    cat_dist = []
    for cat in categories:
        if cat[0]:
            count = db.query(models.Book).filter(models.Book.category == cat[0]).count()
            cat_dist.append({"name": cat[0], "value": count})

    # Enhanced stats for Admin/Super Admin
    total_staff = 0
    total_teachers = 0
    total_librarians = 0
    top_books = []
    trends = []
    sys_stats = {}

    if role in ["admin", "SUPER_ADMIN"]:
        total_teachers = db.query(models.User).filter(models.User.role == "teacher").count()
        total_librarians = db.query(models.User).filter(models.User.role == "librarian").count()
        total_staff = db.query(models.User).filter(
            models.User.role.is_not(None),
            models.User.role != "none"
        ).count()

        # Top borrowed books
        from sqlalchemy import func
        top_books_query = db.query(
            models.Book.title, 
            func.count(models.BorrowRecord.id).label('borrow_count')
        ).join(models.BorrowRecord).group_by(models.Book.id).order_by(func.count(models.BorrowRecord.id).desc()).limit(5).all()
        top_books = [{"title": b[0], "count": b[1]} for b in top_books_query]

        # Borrowing trends (Last 7 days)
        for i in range(6, -1, -1):
            target_date = datetime.datetime.utcnow().date() - datetime.timedelta(days=i)
            count = db.query(models.BorrowRecord).filter(
                func.date(models.BorrowRecord.borrow_date) == target_date
            ).count()
            trends.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "count": count
            })

        sys_stats = {
            "total_assignments": db.query(models.Assignment).count(),
            "total_subjects": db.query(models.Subject).count()
        }

        # Extra stats for SUPER_ADMIN only
        if role == "SUPER_ADMIN":
            pending_registrations = db.query(models.User).filter(models.User.role == "none").count()
            
            # Security logs in last 24h
            critical_logs_count = db.query(models.SystemLog).filter(
                models.SystemLog.level.in_(["critical", "error"]),
                models.SystemLog.timestamp >= datetime.datetime.utcnow() - datetime.timedelta(hours=24)
            ).count()

            # Recent security events (formatted for frontend)
            security_events = db.query(models.SystemLog).filter(
                models.SystemLog.level.in_(["critical", "warning", "error"])
            ).order_by(models.SystemLog.timestamp.desc()).limit(5).all()
            
            recent_security_events = [
                {
                    "id": str(log.id),
                    "action": log.action,
                    "level": log.level,
                    "timestamp": log.timestamp.isoformat(),
                    "email": log.user_email
                } for log in security_events
            ]

            config = db.query(models.GlobalConfig).first()
            system_config = {
                "allow_public_signup": config.allow_public_signup if config else True
            }

            return {
                "role": role,
                "stats": {
                    "total_books": total_books,
                    "total_students": total_students,
                    "active_borrows": active_borrows,
                    "overdue_count": overdue_count,
                    "total_staff": total_staff,
                    "total_teachers": total_teachers,
                    "total_librarians": total_librarians,
                    "pending_registrations": pending_registrations,
                    "critical_logs_count": critical_logs_count,
                    **sys_stats
                },
                "category_distribution": cat_dist,
                "top_books": top_books,
                "trends": trends,
                "recent_security_events": recent_security_events,
                "system_config": system_config
            }

    return {
        "role": role,
        "stats": {
            "total_books": total_books,
            "total_students": total_students,
            "active_borrows": active_borrows,
            "overdue_count": overdue_count,
            "total_staff": total_staff,
            "total_teachers": total_teachers,
            "total_librarians": total_librarians,
            **sys_stats
        },
        "category_distribution": cat_dist,
        "top_books": top_books,
        "trends": trends
    }
