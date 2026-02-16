from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from clerk_backend_api import Clerk
from clerk_backend_api.security.verifytoken import verify_token
from clerk_backend_api.security.types import VerifyTokenOptions
from dotenv import load_dotenv
from . import models
from .database import get_db
from sqlalchemy.orm import Session

load_dotenv()

security = HTTPBearer()
# The new SDK uses bearer_auth instead of bearer_token
clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

async def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Verifies the Clerk JWT and returns the user object with its role.
    """
    token = auth.credentials
    print(f"[AUTH] Start get_current_user. Token present: {bool(token)}")
    try:
        # For development without Clerk keys, we can allow a 'mock' token
        # For development without Clerk keys, we can allow a 'mock' token
        if os.getenv("ENV") == "dev" and token == "dev_token_admin":
            print("[AUTH] Mock token detected. Returning dev admin.")
            # Fetch a real admin user to ensure FKs work
            admin = db.query(models.User).filter(models.User.role == "SUPER_ADMIN").first()
            if admin:
                 return {
                     "role": "SUPER_ADMIN", 
                     "id": str(admin.id), 
                     "email": admin.email, 
                     "full_name": admin.full_name,
                     "assigned_class_id": str(admin.assigned_class_id) if admin.assigned_class_id else None,
                     "assigned_stream_id": str(admin.assigned_stream_id) if admin.assigned_stream_id else None,
                     "subroles": [sr.subrole_name for sr in admin.subroles]
                 }
            # Fallback if no admin exists (e.g. fresh db)
            return {"role": "SUPER_ADMIN", "id": "33333333-3333-3333-3333-333333333333", "email": "dev@admin.com", "full_name": "Dev Admin"}
            
        # Verify the token locally (or via JWKS)
        print("[AUTH] Verifying token...")
        options = VerifyTokenOptions(secret_key=os.getenv("CLERK_SECRET_KEY"))
        payload = verify_token(token, options)
        
        user_id = payload.get("sub")
        print(f"[AUTH] Token verified. Subject (user_id): {user_id}")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        
        # Fetch the full user object to get metadata
        print(f"[AUTH] Fetching user {user_id} from Clerk API...")
        try:
            user_res = clerk.users.get(user_id=user_id)
        except Exception as e:
            print(f"[AUTH ERROR] Clerk API fetch failed: {str(e)}")
            raise
        
        # Try to extract the user data
        if hasattr(user_res, 'to_dict'):
            user = user_res.to_dict()
        elif hasattr(user_res, 'dict'):
            user = user_res.dict()
        else:
            # Fallback if it's already a dict or something else
            user = user_res
        
        print(f"[AUTH] User data retrieved. Name: {user.get('first_name')} {user.get('last_name')}")
        
        # We store the role in public_metadata
        role = user.get("public_metadata", {}).get("role", "librarian")
        email_addresses = user.get("email_addresses", [])
        email = email_addresses[0].get("email_address") if email_addresses else None
        full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()

        print(f"[AUTH] Syncing to DB. Email: {email}")

        try:
            # 1. Find user in local database
            # Strategy: Find by clerk_id first, then try email to handle migrations/merges
            db_user = db.query(models.User).filter(models.User.clerk_id == user_id).first()
            
            if not db_user and email:
                print(f"[AUTH] User {user_id} not found by Clerk ID. Searching by email: {email}")
                db_user = db.query(models.User).filter(models.User.email == email).first()
                if db_user:
                    print(f"[AUTH] Found existing user by email. Linking Clerk ID {user_id}")
                    db_user.clerk_id = user_id
                    db.commit()

            # 2. If user doesn't exist, create them and assign role ONCE
            newly_created = False
            if not db_user:
                print(f"[AUTH] No existing record for {email}. Creating new user...")
                
                # Check registration policy before creating new user
                config = db.query(models.GlobalConfig).first()
                if config and not config.allow_public_signup:
                    # If this is the FIRST user ever, we ALWAYS allow it as SUPER_ADMIN
                    user_count = db.query(models.User).count()
                    if user_count > 0:
                        print(f"[AUTH] Access blocked for {email}: Public registration disabled.")
                        raise HTTPException(status_code=403, detail="Registration is currently disabled.")

                user_count = db.query(models.User).count()
                assigned_role = "SUPER_ADMIN" if user_count == 0 else "none"
                print(f"[AUTH] ASSIGNING PERMANENT ROLE: {assigned_role}")

                db_user = models.User(
                    clerk_id=user_id,
                    email=email,
                    full_name=full_name,
                    role=assigned_role
                )
                db.add(db_user)
                try:
                    db.commit()
                    db.refresh(db_user)
                    newly_created = True
                    print(f"[AUTH] New local user created with ID: {db_user.id}, Role: {db_user.role}")
                except Exception as commit_err:
                    print(f"[AUTH ERROR] Failed to commit new user: {str(commit_err)}")
                    db.rollback()
                    db_user = db.query(models.User).filter(models.User.email == email).first()
                    if not db_user:
                        raise HTTPException(status_code=500, detail="User synchronization failed.")
            
            # 3. Source of Truth: Use the role strictly from the Database
            role = db_user.role
            print(f"[AUTH] Database role for {email}: {role}")

            # 4. Sync profile metadata (excluding role) to keep DB fresh
            needs_update = False
            if db_user.full_name != full_name and full_name:
                db_user.full_name = full_name
                needs_update = True
            if db_user.email != email and email:
                db_user.email = email
                needs_update = True
            
            if needs_update:
                db.commit()
                print(f"[AUTH] Profile metadata synced for {email}")

        except HTTPException:
            raise
        except Exception as db_err:
            print(f"[AUTH ERROR] Database operation failed: {str(db_err)}")
            raise

        print(f"[AUTH] get_current_user COMPLETED for {email} ({role})")
        return {
            **user, 
            "role": role, 
            "id": str(db_user.id), 
            "email": email, 
            "full_name": full_name,
            "assigned_class_id": str(db_user.assigned_class_id) if db_user.assigned_class_id else None,
            "assigned_stream_id": str(db_user.assigned_stream_id) if db_user.assigned_stream_id else None,
            "subroles": [sr.subrole_name for sr in db_user.subroles]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH ERROR] UNHANDLED EXCEPTION in get_current_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )

def require_role(allowed_roles: list):
    """
    Dependency to enforce RBAC.
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this operation",
            )
        return current_user
    return role_checker
