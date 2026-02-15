"""
Migration script to add new columns to students table and create new tables for the student module
"""

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://mohol:mohol@localhost/olabs_db"

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Starting migration: Updating students table and creating new tables...")
        
        # 1. Add columns to students table
        print("Adding columns to students table...")
        columns_to_add = [
            ("password", "VARCHAR"),
            ("activated", "BOOLEAN DEFAULT FALSE"),
            ("profile_photo", "VARCHAR")
        ]
        
        for col_name, col_type in columns_to_add:
            result = conn.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='students' AND column_name='{col_name}';
            """))
            if result.rowcount == 0:
                print(f"Adding column '{col_name}'...")
                conn.execute(text(f"ALTER TABLE students ADD COLUMN {col_name} {col_type};"))
            else:
                print(f"Column '{col_name}' already exists. Skipping.")

        # 2. Create new tables
        print("Creating new tables...")
        
        tables = [
            """
            CREATE TABLE IF NOT EXISTS attendance (
                id UUID PRIMARY KEY,
                student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR,
                remarks TEXT
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS timetable_entries (
                id UUID PRIMARY KEY,
                class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
                subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                day_of_week VARCHAR,
                start_time VARCHAR,
                end_time VARCHAR,
                room VARCHAR
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS announcements (
                id UUID PRIMARY KEY,
                title VARCHAR,
                content TEXT,
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS assignment_submissions (
                id UUID PRIMARY KEY,
                assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
                student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                file_url VARCHAR,
                status VARCHAR,
                grade VARCHAR,
                feedback TEXT
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS exam_results (
                id UUID PRIMARY KEY,
                student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                term VARCHAR,
                year INTEGER,
                exam_type VARCHAR,
                marks FLOAT,
                grade VARCHAR,
                remarks TEXT
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS fee_records (
                id UUID PRIMARY KEY,
                student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                amount FLOAT,
                type VARCHAR,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description VARCHAR,
                recorded_by_id UUID REFERENCES users(id) ON DELETE CASCADE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS fee_structures (
                id UUID PRIMARY KEY,
                class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                title VARCHAR,
                amount FLOAT,
                term VARCHAR,
                year INTEGER
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS course_materials (
                id UUID PRIMARY KEY,
                subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                title VARCHAR,
                description TEXT,
                file_url VARCHAR,
                file_type VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        ]
        
        for table_sql in tables:
            conn.execute(text(table_sql))
        
        conn.commit()
        print("✓ All tables created/updated successfully")
        print("\nMigration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        raise
