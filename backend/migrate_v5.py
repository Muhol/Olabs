import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import uuid

def migrate():
    # Database connection parameters
    db_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/dbname")
    
    # Connect to the database
    conn = psycopg2.connect(db_url)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    try:
        print("Creating subjects table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id UUID PRIMARY KEY,
                name VARCHAR UNIQUE NOT NULL,
                is_compulsory BOOLEAN DEFAULT TRUE
            );
            CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
        """)

        print("Creating student_subjects association table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS student_subjects (
                student_id UUID REFERENCES students(id) ON DELETE CASCADE,
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                PRIMARY KEY (student_id, subject_id)
            );
        """)

        print("Creating teacher_subjects association table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS teacher_subjects (
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, subject_id)
            );
        """)
        
        print("Migration v5 (Subjects) completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
