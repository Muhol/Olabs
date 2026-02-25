import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

REDUNDANT_TABLES = ['student_subject_summaries', 'global_configs', 'whitelisted_emails']

def drop_redundant_tables():
    print(f"Connecting to database to drop: {REDUNDANT_TABLES}")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        for table in REDUNDANT_TABLES:
            print(f"Dropping table {table} if exists...")
            cur.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
        
        conn.commit()
        print("Cleanup successful.")
    except Exception as e:
        conn.rollback()
        print(f"Cleanup failed: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    drop_redundant_tables()
