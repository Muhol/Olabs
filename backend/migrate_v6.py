"""
Migration script to add teacher_subject_assignments table
This replaces the simple teacher_subjects association with detailed class/stream tracking
"""

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Starting migration: Adding teacher_subject_assignments table...")
        
        # 1. Create the new table
        print("Creating teacher_subject_assignments table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_teacher_subject_class_stream UNIQUE (teacher_id, subject_id, class_id, stream_id)
            )
        """))
        conn.commit()
        print("✓ Table created successfully")
        
        # 2. Migrate existing data from teacher_subjects
        print("\nMigrating existing teacher-subject assignments...")
        result = conn.execute(text("""
            INSERT INTO teacher_subject_assignments (teacher_id, subject_id, class_id, stream_id)
            SELECT 
                ts.user_id as teacher_id,
                ts.subject_id,
                u.assigned_class_id as class_id,
                u.assigned_stream_id as stream_id
            FROM teacher_subjects ts
            JOIN users u ON ts.user_id = u.id
            WHERE u.assigned_class_id IS NOT NULL
            ON CONFLICT (teacher_id, subject_id, class_id, stream_id) DO NOTHING
        """))
        conn.commit()
        migrated_count = result.rowcount
        print(f"✓ Migrated {migrated_count} assignments")
        
        # 3. Check for assignments that couldn't be migrated (teachers without assigned class)
        orphaned = conn.execute(text("""
            SELECT COUNT(*) as count
            FROM teacher_subjects ts
            JOIN users u ON ts.user_id = u.id
            WHERE u.assigned_class_id IS NULL
        """))
        orphaned_count = orphaned.scalar()
        if orphaned_count > 0:
            print(f"⚠ Warning: {orphaned_count} assignments could not be migrated (teachers without assigned class)")
        
        print("\n✓ Migration completed successfully!")
        print("\nNote: The old teacher_subjects table is still present.")
        print("You can drop it manually after verifying the migration: DROP TABLE teacher_subjects;")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        raise
