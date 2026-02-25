"""
Migration script to add missing columns to exam_results table.
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
        print("Starting migration: Adding missing columns to exam_results table...")
        
        # Define columns to add
        columns = [
            ("max_score", "FLOAT"),
            ("weight", "FLOAT"),
            ("grade", "VARCHAR"),
            ("performance_level", "cbc_level_enum"),
            ("competency_score", "FLOAT"),
            ("remarks", "TEXT")
        ]
        
        for col_name, col_type in columns:
            print(f"Checking column {col_name}...")
            # Check if column exists
            check_query = text(f"""
                SELECT count(*) FROM information_schema.columns 
                WHERE table_name='exam_results' AND column_name='{col_name}';
            """)
            result = conn.execute(check_query).scalar()
            
            if result == 0:
                print(f"Adding column {col_name} ({col_type})...")
                alter_query = text(f"ALTER TABLE exam_results ADD COLUMN {col_name} {col_type};")
                conn.execute(alter_query)
                print(f"✓ Column {col_name} added.")
            else:
                print(f"Column {col_name} already exists.")

        conn.commit()
        print("\nMigration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        raise
