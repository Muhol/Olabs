"""
Migration script to add book_number column to borrow_records table
"""

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback/Default for development if env not set
    DATABASE_URL = "postgresql://mohol:mohol@localhost/olabs_db"

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Starting migration: Adding book_number to borrow_records...")
        
        # Check if column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='borrow_records' AND column_name='book_number';
        """))
        
        if result.rowcount > 0:
            print("Column 'book_number' already exists. Skipping.")
            return

        print("Adding book_number column...")
        conn.execute(text("""
            ALTER TABLE borrow_records
            ADD COLUMN book_number VARCHAR;
        """))
        
        conn.commit()
        print("✓ Column added successfully")
        
        print("\nMigration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        raise
