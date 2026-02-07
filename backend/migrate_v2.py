import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    print(f"Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        print("Adding target_user column to system_logs table...")
        cur.execute("ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS target_user VARCHAR;")
        conn.commit()
        print("Migration successful: added target_user to system_logs.")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
