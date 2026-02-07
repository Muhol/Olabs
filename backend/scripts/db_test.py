import sys
import os
import uuid

# Add the current directory to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from app import models, database
    from app.database import SessionLocal
    
    print("--- Database Sanity Check ---")
    db = SessionLocal()
    try:
        # 1. Check existing users
        user_count = db.query(models.User).count()
        print(f"Current User Count: {user_count}")
        
        # 2. Try creating a dummy user
        test_id = f"test_{uuid.uuid4().hex[:8]}"
        dummy_user = models.User(
            clerk_id=test_id,
            email=f"{test_id}@example.com",
            full_name="Sanity Check User",
            role="SUPER_ADMIN"
        )
        db.add(dummy_user)
        db.commit()
        print(f"Successfully created dummy user: {test_id}")
        
        # 3. Clean up
        db.delete(dummy_user)
        db.commit()
        print("Successfully deleted dummy user.")
        
        print("--- DATABASE OK ---")
    except Exception as e:
        print(f"--- DATABASE ERROR: {str(e)} ---")
    finally:
        db.close()
except Exception as e:
    print(f"--- CRITICAL ERROR: {str(e)} ---")
