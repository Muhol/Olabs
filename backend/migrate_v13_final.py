import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    print("Final migration step: Adding exam_id to exam_results...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        # Add exam_id to exam_results
        cur.execute("ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE CASCADE;")
        
        # Optionally migrate data if possible, but since we just created exams table, it might be empty
        # or we might need to create initial exams for existing results.
        # For now, we just ensure the column exists.

        conn.commit()
        print("Migration step completed successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Migration step failed: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
