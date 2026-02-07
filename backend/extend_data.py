import uuid
import datetime
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

def extend_data():
    db = SessionLocal()
    try:
        print("Commencing Institutional Expansion...")

        # 1. Fetch Class IDs
        form2 = db.query(models.Class).filter(models.Class.name == "Form 2").first()
        form4 = db.query(models.Class).filter(models.Class.name == "Form 4").first()

        if not form2 or not form4:
            print("Error: Target classes (Form 2/4) not found. Run repopulate_data.py first.")
            return

        # 2. Add Form 2 Stream D (10 students)
        stream_2d = models.Stream(id=uuid.uuid4(), name="D", class_id=form2.id)
        db.add(stream_2d)
        db.commit() # Commit to get stream object ready
        print(f"Initialized Stream {form2.name} Sector D.")

        # 3. Add Form 4 Stream C (8 students)
        stream_4c = models.Stream(id=uuid.uuid4(), name="C", class_id=form4.id)
        db.add(stream_4c)
        db.commit()
        print(f"Initialized Stream {form4.name} Sector C.")

        # Names for students
        first_names = ["Marcus", "Elena", "Xavier", "Sophia", "Liam", "Olivia", "Noah", "Emily", "Lucas", "Ava", "Mason", "Isabella", "Ethan", "Mia", "Aiden", "Charlotte", "James", "Amelia", "Benjamin", "Evelyn"]
        last_names = ["Vance", "Kovacs", "Steele", "Lynch", "Sterling", "Cross", "Vaughn", "Frost", "Reid", "Hayes", "Palmer", "Banks", "Greene", "Nash", "Sloan", "Blair", "Rhodes", "Hart", "Wolfe", "Drake"]

        # Enroll Form 2D
        for i in range(10):
            full_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            adm_num = f"ADM/EXT/{random.randint(1000, 9999)}"
            student = models.Student(
                id=uuid.uuid4(),
                full_name=full_name,
                admission_number=adm_num,
                class_id=form2.id,
                stream_id=stream_2d.id,
                stream=stream_2d.name
            )
            db.add(student)
        
        # Enroll Form 4C
        for i in range(8):
            full_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            adm_num = f"ADM/EXT/{random.randint(1000, 9999)}"
            student = models.Student(
                id=uuid.uuid4(),
                full_name=full_name,
                admission_number=adm_num,
                class_id=form4.id,
                stream_id=stream_4c.id,
                stream=stream_4c.name
            )
            db.add(student)

        print(f"Enrolled 18 new personnel across {form2.name}D and {form4.name}C.")

        # 4. Add 10 more books
        extra_books = [
            ("The Hobbit", "J.R.R. Tolkien", "Fantasy", "Literature"),
            ("Foundation", "Isaac Asimov", "Sci-Fi", "Literature"),
            ("Brave New World", "Aldous Huxley", "Dystopian", "Politics"),
            ("Cosmos", "Carl Sagan", "Science", "Astronomy"),
            ("Clean Code", "Robert C. Martin", "Programming", "Computer Science"),
            ("Pride and Prejudice", "Jane Austen", "Fiction", "Literature"),
            ("The Alchemist", "Paulo Coelho", "Fiction", "Philosophy"),
            ("Think and Grow Rich", "Napoleon Hill", "Self-Help", "Finance"),
            ("The Lean Startup", "Eric Ries", "Business", "Entrepreneurship"),
            ("Guns, Germs, and Steel", "Jared Diamond", "Non-Fiction", "History")
        ]

        for title, author, category, subject in extra_books:
            book = models.Book(
                id=uuid.uuid4(),
                book_id=str(random.randint(2000, 8999)),
                title=title,
                author=author,
                category=category,
                subject=subject,
                total_copies=random.randint(3, 8),
                borrowed_copies=0
            )
            db.add(book)
        
        db.commit()
        print("Injected 10 new archival assets into the matrix.")
        print("\nExpansion sequence complete.")

    except Exception as e:
        db.rollback()
        print(f"Expansion failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    extend_data()
