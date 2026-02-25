import os
import psycopg2
from dotenv import load_dotenv
from app.models import Base
from app.database import engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_tables():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    """)
    tables = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    return set(tables)

def get_model_tables():
    return set(Base.metadata.tables.keys())

def identify_redundant_tables():
    db_tables = get_db_tables()
    model_tables = get_model_tables()
    
    # Also ignore alembic_version if it exists
    redundant = db_tables - model_tables - {'alembic_version'}
    
    print(f"Current DB Tables: {db_tables}")
    print(f"Tables defined in Models: {model_tables}")
    print(f"\nIdentified Redundant Tables: {redundant}")
    return list(redundant)

if __name__ == "__main__":
    identify_redundant_tables()
