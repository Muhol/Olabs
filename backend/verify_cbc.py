"""
Verification script for CBC Grading System.
Checks if the new models can be imported and if the database columns exist.
"""
import sys
import os

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

try:
    from app import models, database
    from sqlalchemy import inspect
    
    print("--- CBC Verification ---")
    
    # 1. Check if models are available
    print("Checking models...")
    models_to_check = [
        models.Competency,
        models.StudentCompetencyAssessment,
        models.Rubric,
        models.RubricCriteria,
        models.StudentSubjectSummary
    ]
    for model in models_to_check:
        print(f"✓ {model.__name__} model is defined.")

    # 2. Check database columns
    engine = database.engine
    inspector = inspect(engine)
    
    tables = inspector.get_table_names()
    print(f"\nExisting tables: {', '.join(tables)}")
    
    # Verify columns in modified tables
    print("\nChecking modified tables...")
    
    exam_results_cols = [c['name'] for c in inspector.get_columns('exam_results')]
    if 'performance_level' in exam_results_cols and 'competency_score' in exam_results_cols:
        print("✓ exam_results has performance_level and competency_score")
    else:
        print(f"✗ exam_results missing columns. Found: {exam_results_cols}")

    assignment_submissions_cols = [c['name'] for c in inspector.get_columns('assignment_submissions')]
    if 'performance_level' in assignment_submissions_cols and 'rubric_feedback' in assignment_submissions_cols:
        print("✓ assignment_submissions has performance_level and rubric_feedback")
    else:
        print(f"✗ assignment_submissions missing columns. Found: {assignment_submissions_cols}")

    print("\n--- VERIFICATION COMPLETE ---")

except Exception as e:
    print(f"--- VERIFICATION ERROR: {str(e)} ---")
    import traceback
    traceback.print_exc()
