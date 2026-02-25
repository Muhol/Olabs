"""
Migration script to refactor grading schema:
1. Create subject_term_results table.
2. Drop summary columns from exam_results.
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
        print("Starting migration: Refactoring grading schema...")
        
        # 1. Create subject_term_results table
        print("Creating subject_term_results table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS subject_term_results (
                id UUID PRIMARY KEY,
                student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                term VARCHAR NOT NULL,
                year INTEGER NOT NULL,
                total_score FLOAT,
                grade VARCHAR,
                performance_level cbc_level_enum,
                competency_score FLOAT,
                remarks TEXT,
                UNIQUE(student_id, subject_id, term, year)
            );
        """))

        # 2. Drop columns from exam_results
        print("Dropping summary columns from exam_results...")
        cols_to_drop = ["grade", "performance_level", "competency_score", "remarks"]
        for col in cols_to_drop:
            print(f"Checking if column {col} exists in exam_results...")
            result = conn.execute(text(f"""
                SELECT count(*) FROM information_schema.columns 
                WHERE table_name='exam_results' AND column_name='{col}';
            """)).scalar()
            
            if result > 0:
                print(f"Dropping column {col}...")
                conn.execute(text(f"ALTER TABLE exam_results DROP COLUMN {col};"))
                print(f"✓ Column {col} dropped.")
            else:
                print(f"Column {col} does not exist.")

        conn.commit()
        print("\nMigration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        raise
