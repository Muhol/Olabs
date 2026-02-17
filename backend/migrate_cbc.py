"""
Migration script for CBC Grading System.
Adds CBC Performance Level Enum, Competency tables, Rubric tables, and updates existing tables.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import UUID
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://mohol:mohol@localhost/olabs_db"

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Starting migration: CBC Grading System...")

        # 1. Create CBC Performance Level Enum
        print("Creating cbc_performance_level enum...")
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cbc_performance_level') THEN
                    CREATE TYPE cbc_performance_level AS ENUM ('EE', 'ME', 'AE', 'BE');
                END IF;
            END$$;
        """))

        # 2. Create Competency table
        print("Creating competencies table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS competencies (
                id UUID PRIMARY KEY,
                name VARCHAR NOT NULL,
                description TEXT
            );
            CREATE INDEX IF NOT EXISTS ix_competencies_name ON competencies (name);
        """))

        # 3. Create subject_competencies association table
        print("Creating subject_competencies table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS subject_competencies (
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
                PRIMARY KEY (subject_id, competency_id)
            );
        """))

        # 4. Create StudentCompetencyAssessment table
        print("Creating student_competency_assessments table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS student_competency_assessments (
                id UUID PRIMARY KEY,
                student_id UUID REFERENCES students(id) ON DELETE CASCADE,
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
                term VARCHAR,
                year INTEGER,
                performance_level cbc_performance_level NOT NULL,
                remarks TEXT,
                assessed_by UUID REFERENCES users(id),
                assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))

        # 5. Create Rubric tables
        print("Creating rubrics and rubric_criteria tables...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS rubrics (
                id UUID PRIMARY KEY,
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                title VARCHAR NOT NULL
            );
            CREATE TABLE IF NOT EXISTS rubric_criteria (
                id UUID PRIMARY KEY,
                rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
                competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
                description TEXT
            );
        """))

        # 6. Create StudentSubjectSummary table
        print("Creating student_subject_summaries table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS student_subject_summaries (
                id UUID PRIMARY KEY,
                student_id UUID REFERENCES students(id) ON DELETE CASCADE,
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                term VARCHAR,
                year INTEGER,
                overall_performance cbc_performance_level,
                teacher_comment TEXT
            );
        """))

        # 7. Modify assignment_submissions
        print("Modifying assignment_submissions...")
        columns = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='assignment_submissions'")).fetchall()
        column_names = [c[0] for c in columns]
        
        if 'performance_level' not in column_names:
            conn.execute(text("ALTER TABLE assignment_submissions ADD COLUMN performance_level cbc_performance_level;"))
        if 'rubric_feedback' not in column_names:
            conn.execute(text("ALTER TABLE assignment_submissions ADD COLUMN rubric_feedback TEXT;"))

        # 8. Modify exam_results
        print("Modifying exam_results...")
        columns = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='exam_results'")).fetchall()
        column_names = [c[0] for c in columns]

        if 'performance_level' not in column_names:
            conn.execute(text("ALTER TABLE exam_results ADD COLUMN performance_level cbc_performance_level;"))
        if 'competency_score' not in column_names:
            conn.execute(text("ALTER TABLE exam_results ADD COLUMN competency_score FLOAT;"))

        conn.commit()
        print("✓ CBC Migration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        raise
