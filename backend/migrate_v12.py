"""
Migration script to add rubric level descriptors and exam type tracking:
1. Add ee_descriptor, me_descriptor, ae_descriptor, be_descriptor to rubric_criteria.
2. Add exam_type to student_competency_assessments.
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
        print("Starting migration: Structured CBC Rubrics...")
        
        # 1. Update rubric_criteria
        print("Updating rubric_criteria table...")
        cols_to_add = [
            ("ee_descriptor", "TEXT"),
            ("me_descriptor", "TEXT"),
            ("ae_descriptor", "TEXT"),
            ("be_descriptor", "TEXT")
        ]
        
        for col, col_type in cols_to_add:
            print(f"Checking if column {col} exists in rubric_criteria...")
            result = conn.execute(text(f"""
                SELECT count(*) FROM information_schema.columns 
                WHERE table_name='rubric_criteria' AND column_name='{col}';
            """)).scalar()
            
            if result == 0:
                print(f"Adding column {col}...")
                conn.execute(text(f"ALTER TABLE rubric_criteria ADD COLUMN {col} {col_type};"))
                print(f"✓ Column {col} added.")
            else:
                print(f"Column {col} already exists.")

        # 2. Update student_competency_assessments
        print("\nUpdating student_competency_assessments table...")
        print("Checking if column exam_type exists in student_competency_assessments...")
        result = conn.execute(text("""
            SELECT count(*) FROM information_schema.columns 
            WHERE table_name='student_competency_assessments' AND column_name='exam_type';
        """)).scalar()
        
        if result == 0:
            print("Adding column exam_type...")
            conn.execute(text("ALTER TABLE student_competency_assessments ADD COLUMN exam_type VARCHAR;"))
            print("✓ Column exam_type added.")
        else:
            print("Column exam_type already exists.")

        conn.commit()
        print("\nMigration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        raise
