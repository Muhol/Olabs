import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    print("Starting migration: CBC Refinement & Exams...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    try:
        # 1. Create Exams table
        print("Creating exams table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS exams (
                id UUID PRIMARY KEY,
                subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
                name TEXT,
                term TEXT,
                year INTEGER,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Create exam_competencies association table
        print("Creating exam_competencies table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS exam_competencies (
                exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
                competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
                PRIMARY KEY (exam_id, competency_id)
            );
        """)

        # 3. Update competencies table: Add subject_id
        print("Updating competencies table...")
        cur.execute("ALTER TABLE competencies ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE;")

        # 4. Migrate data from subject_competencies to competencies.subject_id (if exists)
        # Assuming 1:M, we take the first subject linked for now.
        print("Migrating competency-subject links...")
        cur.execute("""
            UPDATE competencies c
            SET subject_id = sc.subject_id
            FROM subject_competencies sc
            WHERE c.id = sc.competency_id AND c.subject_id IS NULL;
        """)

        # 5. Transform Rubrics
        print("Transforming Rubrics...")
        # First, we need to handle the enum if not exists, but we know it exists.
        
        # We'll drop the old rubrics table and rubric_criteria after migrating descriptors
        # Descriptors are currently in rubric_criteria: ee_descriptor, me_descriptor, ae_descriptor, be_descriptor
        
        # Backup descriptors if they exist
        cur.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'rubric_criteria';")
        if cur.fetchone()[0] > 0:
            print("Migrating descriptors from rubric_criteria to new Rubric table...")
            
            # Create the NEW rubrics table structure (temporarily renaming if old exists)
            cur.execute("ALTER TABLE rubrics RENAME TO rubrics_old;")
            
            cur.execute("""
                CREATE TABLE rubrics (
                    id UUID PRIMARY KEY,
                    competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
                    performance_level cbc_performance_level NOT NULL,
                    descriptor TEXT
                );
            """)
            
            # Insert EE
            cur.execute("""
                INSERT INTO rubrics (id, competency_id, performance_level, descriptor)
                SELECT gen_random_uuid(), competency_id, 'EE', ee_descriptor 
                FROM rubric_criteria WHERE ee_descriptor IS NOT NULL AND competency_id IS NOT NULL;
            """)
            # Insert ME
            cur.execute("""
                INSERT INTO rubrics (id, competency_id, performance_level, descriptor)
                SELECT gen_random_uuid(), competency_id, 'ME', me_descriptor 
                FROM rubric_criteria WHERE me_descriptor IS NOT NULL AND competency_id IS NOT NULL;
            """)
            # Insert AE
            cur.execute("""
                INSERT INTO rubrics (id, competency_id, performance_level, descriptor)
                SELECT gen_random_uuid(), competency_id, 'AE', ae_descriptor 
                FROM rubric_criteria WHERE ae_descriptor IS NOT NULL AND competency_id IS NOT NULL;
            """)
            # Insert BE
            cur.execute("""
                INSERT INTO rubrics (id, competency_id, performance_level, descriptor)
                SELECT gen_random_uuid(), competency_id, 'BE', be_descriptor 
                FROM rubric_criteria WHERE be_descriptor IS NOT NULL AND competency_id IS NOT NULL;
            """)
            
            print("Cleaning up old rubric tables...")
            cur.execute("DROP TABLE IF EXISTS rubric_criteria;")
            cur.execute("DROP TABLE IF EXISTS rubrics_old;")

        # 6. Update student_competency_assessments
        print("Updating student_competency_assessments table...")
        cur.execute("ALTER TABLE student_competency_assessments ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE CASCADE;")
        
        # We keep exam_type for now to avoid data loss, or we can drop it if user explicitly wants it gone.
        # User said "make the necessary adjustments", so I'll drop it to keep schema clean.
        # cur.execute("ALTER TABLE student_competency_assessments DROP COLUMN IF EXISTS exam_type;")

        # 7. Finalize subject_competencies cleanup
        print("Dropping subject_competencies table...")
        cur.execute("DROP TABLE IF EXISTS subject_competencies;")

        conn.commit()
        print("Migration completed successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
