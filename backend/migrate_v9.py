"""
Migration script to create attendance tracking tables and enforce constraints.
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
        print("Starting migration: Creating attendance and timetable slot tables...")
        
        # 1. Create timetable_slots table
        print("Creating timetable_slots table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS timetable_slots (
                id UUID PRIMARY KEY,
                stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                start_time VARCHAR NOT NULL,
                end_time VARCHAR NOT NULL
            );
        """))

        # 2. Create attendance_sessions table
        print("Creating attendance_sessions table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS attendance_sessions (
                id UUID PRIMARY KEY,
                subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                timetable_slot_id UUID REFERENCES timetable_slots(id) ON DELETE SET NULL,
                session_date DATE NOT NULL,
                teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
                status VARCHAR(20) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP
            );
        """))

        # 3. Create attendance_records table
        print("Creating attendance_records table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS attendance_records (
                id UUID PRIMARY KEY,
                attendance_session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
                student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                status VARCHAR(20) NOT NULL
            );
        """))

        # 4. Data Type Consistency: Ensure assignment_submissions.grade is FLOAT (or at least compatible)
        # Note: In Postgres, changing type from VARCHAR to FLOAT requires a cast.
        print("Ensuring assignment_submissions.grade consistency...")
        conn.execute(text("""
            DO $$ 
            BEGIN 
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='assignment_submissions' AND column_name='grade' AND data_type='character varying'
                ) THEN
                    ALTER TABLE assignment_submissions ALTER COLUMN grade TYPE FLOAT USING grade::double precision;
                END IF;
            END $$;
        """))
        
        conn.commit()
        print("✓ All tables created and constraints applied successfully")
        print("\nMigration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        raise
