from sqlalchemy.orm import Session
from .. import models
import datetime

def get_analytics(db: Session):
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
        count = db.query(models.Book).filter(models.Book.category == cat[0]).count()
        cat_dist.append({"name": cat[0], "value": count})

    return {
        "stats": {
            "total_books": total_books,
            "total_students": total_students,
            "active_borrows": active_borrows,
            "overdue_count": overdue_count
        },
        "category_distribution": cat_dist
    }
