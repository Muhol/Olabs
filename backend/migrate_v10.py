"""
Migration script to add day_of_week and type to timetable_slots table.
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
        print("Starting migration: Adding day_of_week and type to timetable_slots...")
        
        # 1. Add day_of_week
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='timetable_slots' AND column_name='day_of_week';
        """))
        if result.rowcount == 0:
            print("Adding column 'day_of_week'...")
            conn.execute(text("ALTER TABLE timetable_slots ADD COLUMN day_of_week INTEGER;"))
        else:
            print("Column 'day_of_week' already exists.")

        # 2. Add type
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='timetable_slots' AND column_name='type';
        """))
        if result.rowcount == 0:
            print("Adding column 'type'...")
            conn.execute(text("ALTER TABLE timetable_slots ADD COLUMN type VARCHAR;"))
        else:
            print("Column 'type' already exists.")

        conn.commit()
        print("✓ Columns added successfully")
        print("\nMigration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        raise
