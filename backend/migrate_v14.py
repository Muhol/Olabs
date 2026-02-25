import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    print("Starting migration v14: Announcements Targeting Dispatches...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        # 1. Create Enum type if not exists
        print("Creating announcement_category enum...")
        cur.execute("""
            DO $$ BEGIN
                CREATE TYPE announcement_category AS ENUM ('SCHOOL', 'STREAM', 'SUBJECT', 'STAFF');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)

        # 2. Add columns to announcements table
        print("Adding columns to announcements table...")
        cur.execute("""
            ALTER TABLE announcements 
            ADD COLUMN IF NOT EXISTS category announcement_category DEFAULT 'SCHOOL',
            ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE;
        """)

        # 3. Update existing rows to have 'SCHOOL' category (redundant due to default but good for safety)
        cur.execute("UPDATE announcements SET category = 'SCHOOL' WHERE category IS NULL;")

        conn.commit()
        print("Migration v14 completed successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Migration v14 failed: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
