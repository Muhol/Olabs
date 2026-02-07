import uuid
import datetime
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

def seed_data():
    db = SessionLocal()
    try:
        print("Clearing existing data (Students, Streams, Classes, BorrowRecords)...")
        db.query(models.BorrowRecord).delete()
        db.query(models.Student).delete()
        db.query(models.Stream).delete()
        db.query(models.Class).delete()
        db.query(models.Book).delete()
        db.commit()

        # 1. Create Classes
        class_names = ["Form 1", "Form 2", "Form 3", "Form 4"]
        classes = []
        for name in class_names:
            cls = models.Class(id=uuid.uuid4(), name=name)
            db.add(cls)
            classes.append(cls)
        db.commit()
        print(f"Created {len(classes)} classes.")

        # 2. Create Streams for each Class
        stream_labels = ["A", "B"]
        streams = []
        for cls in classes:
            for label in stream_labels:
                stream = models.Stream(id=uuid.uuid4(), name=label, class_id=cls.id)
                db.add(stream)
                streams.append(stream)
        db.commit()
        print(f"Created {len(streams)} streams.")

        # 3. Create Students for each Stream
        first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Hannah", "Isaac", "Julia", "Kevin", "Laura", "Michael", "Nina", "Oscar", "Paula", "Quincy", "Rachel"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
        
        adm_prefix = 24000
        students = []
        for stream in streams:
            for i in range(15):
                adm_prefix += 1
                full_name = f"{random.choice(first_names)} {random.choice(last_names)}"
                student = models.Student(
                    id=uuid.uuid4(),
                    full_name=full_name,
                    admission_number=f"ADM/{adm_prefix}",
                    class_id=stream.class_id,
                    stream_id=stream.id,
                    stream=stream.name # Legacy field compatibility
                )
                db.add(student)
                students.append(student)
        db.commit()
        print(f"Created {len(students)} students.")

        # 4. Create some Books
        books_data = [
            ("The Great Gatsby", "F. Scott Fitzgerald", "Fiction", "English"),
            ("1984", "George Orwell", "Dystopian", "Politics"),
            ("To Kill a Mockingbird", "Harper Lee", "Fiction", "Civil Rights"),
            ("The Catcher in the Rye", "J.D. Salinger", "Fiction", "Literature"),
            ("A Brief History of Time", "Stephen Hawking", "Science", "Physics"),
            ("Python Crash Course", "Eric Matthes", "Programming", "Computer Science"),
            ("Biology: A Global Approach", "Campbell", "Science", "Biology"),
            ("Advanced Calculus", "Gerald Folland", "Mathematics", "Calculus"),
            ("The Art of War", "Sun Tzu", "Strategy", "History"),
            ("Sapiens", "Yuval Noah Harari", "Non-Fiction", "History")
        ]
        
        books = []
        for title, author, category, subject in books_data:
            book = models.Book(
                id=uuid.uuid4(),
                book_id=str(random.randint(1000, 9999)),
                title=title,
                author=author,
                category=category,
                subject=subject,
                total_copies=random.randint(5, 10),
                borrowed_copies=0
            )
            db.add(book)
            books.append(book)
        db.commit()
        print(f"Created {len(books)} books.")

        # 5. Create some Borrow Records (Active)
        for i in range(20):
            student = random.choice(students)
            book = random.choice(books)
            # Ensure book isn't over-borrowed
            if book.borrowed_copies < book.total_copies:
                borrow_date = datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 10))
                due_date = borrow_date + datetime.timedelta(days=14)
                
                record = models.BorrowRecord(
                    id=uuid.uuid4(),
                    book_id=book.id,
                    student_id=student.id,
                    class_id=student.class_id,
                    stream_id=student.stream_id,
                    borrow_date=borrow_date,
                    due_date=due_date,
                    status="borrowed"
                )
                book.borrowed_copies += 1
                db.add(record)
        
        # 6. Create some Borrow Records (Returned)
        for i in range(15):
            student = random.choice(students)
            book = random.choice(books)
            borrow_date = datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(20, 30))
            due_date = borrow_date + datetime.timedelta(days=14)
            return_date = borrow_date + datetime.timedelta(days=random.randint(5, 12))
            
            record = models.BorrowRecord(
                id=uuid.uuid4(),
                book_id=book.id,
                student_id=student.id,
                class_id=student.class_id,
                stream_id=student.stream_id,
                borrow_date=borrow_date,
                due_date=due_date,
                return_date=return_date,
                status="returned"
            )
            db.add(record)
            
        db.commit()
        print("Initial borrow records and return history generated.")

        print("\nDatabase repopulation successful!")
        print(f"Final Count: {len(classes)} Classes, {len(streams)} Streams, {len(students)} Students, {len(books)} Books.")

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
