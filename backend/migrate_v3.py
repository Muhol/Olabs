import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Adding assigned_class_id and assigned_stream_id to users table...")
        # Add columns if they don't exist
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_class_id UUID;")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_stream_id UUID;")
        
        # Add Foreign Key constraints
        try:
            cur.execute("ALTER TABLE users ADD CONSTRAINT fk_assigned_class FOREIGN KEY (assigned_class_id) REFERENCES classes(id);")
        except Exception as e:
            print(f"Constraint fk_assigned_class might already exist: {e}")
            conn.rollback()
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()

        try:
            cur.execute("ALTER TABLE users ADD CONSTRAINT fk_assigned_stream FOREIGN KEY (assigned_stream_id) REFERENCES streams(id);")
        except Exception as e:
            print(f"Constraint fk_assigned_stream might already exist: {e}")
            conn.rollback()
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()

        conn.commit()
        print("Migration successful: added teacher assignment columns to users.")
    except Exception as e:
        print(f"Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate()
