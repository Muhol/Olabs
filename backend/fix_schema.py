import sys
import os

# Add the current directory to sys.path to import app modules
sys.path.append(os.getcwd())

from sqlalchemy import text
from app.database import engine, SessionLocal
from app import models

def fix_schema():
    print("Starting schema fix...")
    
    # 1. Create all tables (this will create 'term_exams' if it doesn't exist)
    models.Base.metadata.create_all(bind=engine)
    print("Ensured all tables are created.")

    # 2. Add 'term_exam_id' to 'exams' table if it's missing
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='exams' AND column_name='term_exam_id'"))
            if not result.fetchone():
                print("Adding 'term_exam_id' column to 'exams' table...")
                conn.execute(text("ALTER TABLE exams ADD COLUMN term_exam_id UUID REFERENCES term_exams(id) ON DELETE SET NULL"))
                conn.commit()
                print("Column 'term_exam_id' added successfully.")
            else:
                print("Column 'term_exam_id' already exists in 'exams' table.")
        except Exception as e:
            print(f"Error updating 'exams' table: {e}")

    print("Schema fix completed.")

if __name__ == "__main__":
    fix_schema()
