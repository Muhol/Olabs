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
        
        print("Creating user_subroles table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_subroles (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                subrole_name VARCHAR NOT NULL
            );
        """)
        
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_subroles_user_id ON user_subroles(user_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_user_subroles_name ON user_subroles(subrole_name);")
        
        conn.commit()
        print("Migration successful: created user_subroles table.")
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
