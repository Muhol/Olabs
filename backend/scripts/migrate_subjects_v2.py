from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import random

# Load env from parent directory (backend)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./sql_app.db"

engine = create_engine(DATABASE_URL)

def migrate():
    print("Starting migration...")
    with engine.connect() as conn:
        conn.begin()
        
        # 1. Add Columns (Idempotent check difficult in raw SQL cross-db, trying explicit add)
        try:
            conn.execute(text("ALTER TABLE subjects ADD COLUMN class_id UUID"))
            print("Added class_id column.")
        except Exception as e:
            print(f"class_id column exists or error: {e}")

        try:
            conn.execute(text("ALTER TABLE subjects ADD COLUMN stream_id UUID"))
            print("Added stream_id column.")
        except Exception as e:
            print(f"stream_id column exists or error: {e}")

        # 2. Get Streams
        result = conn.execute(text("SELECT id, class_id FROM streams"))
        streams = result.fetchall()
        
        if not streams:
            print("No streams found. Cannot assign subjects.")
            return

        # 3. Get Subjects
        result = conn.execute(text("SELECT id FROM subjects"))
        subjects = result.fetchall()
        
        print(f"Found {len(subjects)} subjects to update.")

        # 4. Update Subjects
        for subj in subjects:
            random_stream = random.choice(streams)
            # Use query with params to be safe
            conn.execute(
                text("UPDATE subjects SET class_id = :class_id, stream_id = :stream_id WHERE id = :id"),
                {"class_id": random_stream[1], "stream_id": random_stream[0], "id": subj[0]}
            )
        
        # 5. Add Constraints (Postgres specific syntax usually, simpler to just set Nullable=False if possible)
        # We won't strictly enforce Not Null at DB level yet to strictly avoid locking issues if something fails, 
        # but the logic enforces it.
        
        # 6. Drop unique constraint on name if it exists
        try:
            # Try to drop the unique constraint on 'name'. Name might vary.
            # Usually 'subjects_name_key' or similar in Postgres.
            conn.execute(text("ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_name_key"))
            conn.execute(text("DROP INDEX IF EXISTS ix_subjects_name")) 
            print("Dropped unique constraint on name.")
        except Exception as e:
            print(f"Could not drop constraint: {e}")

        # 7. Create new composite unique index
        try:
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_subjects_name_class_stream ON subjects (name, class_id, stream_id)"))
            print("Created new unique index.")
        except Exception as e:
            print(f"Could not create index: {e}")

        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
