from app.database import SessionLocal, engine
from app import models
import uuid
import datetime
import random

def seed():
    db = SessionLocal()
    
    # 1. Clear and Recreate Tables
    print("Recreating tables...")
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    
    # 2. Seed Classes
    print("Seeding Classes...")
    class_names = ['Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B', 'Form 4A', 'Form 4B']
    db_classes = []
    for name in class_names:
        c = models.Class(name=name)
        db.add(c)
        db.flush() 
        db_classes.append(c)
    
    # 3. Seed Users (Librarians/Admins only)
    print("Seeding Users (Librarians/Admins)...")
    librarian = models.User(
        full_name="Alice Librarian",
        email="librarian@librarystar.pro",
        role="librarian"
    )
    admin = models.User(
        full_name="Bob Admin",
        email="admin@librarystar.pro",
        role="admin"
    )
    db.add(librarian)
    db.add(admin)
    db.flush()

    # 4. Seed Books (at least 30)
    print("Seeding 30+ Books...")
    subjects = ["Geography", "Biology", "Chemistry", "Physics", "Mathematics", "English", "History", "Computer Science"]
    categories = ["Reference", "Textbook", "Literature", "Equipment"]
    
    db_books = []
    for i in range(1, 41): # 40 books for variety
        subj = random.choice(subjects)
        cat = "Equipment" if i > 35 else random.choice(categories)
        total = random.randint(2, 10)
        b = models.Book(
            book_id=f"{subj[:3].upper()}-{i:03d}",
            title=f"Advanced {subj} Vol {i}",
            author=f"Author {chr(65 + (i % 26))}",
            category=cat,
            subject=subj,
            isbn=f"978-{random.randint(1000000000, 9999999999)}",
            total_copies=total,
            borrowed_copies=0 # Initialized as 0, updated logic follows
        )
        db.add(b)
        db.flush()
        db_books.append(b)

    # 5. Seed Students (independent of Users)
    print("Seeding 46 Students...")
    db_students = []
    for i in range(1, 47): 
        target_class = random.choice(db_classes)
        s = models.Student(
            full_name=f"Student {i}",
            admission_number=f"ADM-{i:03d}",
            class_id=target_class.id
        )
        db.add(s)
        db.flush()
        db_students.append(s)

    # 6. Seed Borrow Records
    print("Linking Borrow Records...")
    # Borrow 20 items
    for i in range(20):
        student = random.choice(db_students)
        # Choose a book that still has copies available
        book = random.choice([b for b in db_books if b.total_copies > b.borrowed_copies])
        
        book.borrowed_copies += 1
        borrow = models.BorrowRecord(
            book_id=book.id,
            student_id=student.id,
            class_id=student.class_id,
            borrow_date=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 10)),
            due_date=datetime.datetime.utcnow() + datetime.timedelta(days=random.randint(1, 14)),
            status="borrowed"
        )
        db.add(borrow)

    # 7. Seed Missing Reports
    print("Linking Missing Reports...")
    for i in range(5):
        book = random.choice(db_books)
        report = models.MissingReport(
            book_id=book.id,
            reported_by_id=librarian.id,
            report_date=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 5)),
            resolution="outstanding",
            notes=f"Missing since inventory check {i+1}"
        )
        db.add(report)

    db.commit()
    db.close()
    print("Database re-seeded successfully with inventory-based availability!")

if __name__ == "__main__":
    seed()
