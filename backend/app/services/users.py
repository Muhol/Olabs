from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException
from ..services.logs import log_action
from typing import Optional

def get_staff(db: Session, search: Optional[str] = None, role_filter: Optional[str] = None):
    query = db.query(models.User)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.User.full_name.ilike(search_filter)) | 
            (models.User.email.ilike(search_filter))
        )
    
    if role_filter:
        if role_filter == "unapproved":
            query = query.filter(models.User.role == "none")
        elif role_filter == "verified":
            # Verified staff must have a role other than 'none' and cannot be NULL
            query = query.filter(
                models.User.role.is_not(None),
                models.User.role != "none"
            )
        else:
            query = query.filter(models.User.role == role_filter)

    users = query.all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "clerk_id": u.clerk_id,
            "assigned_class_id": str(u.assigned_class_id) if u.assigned_class_id else None,
            "assigned_stream_id": str(u.assigned_stream_id) if u.assigned_stream_id else None,
            "subroles": [sr.subrole_name for sr in u.subroles],
            "assigned_subjects": [{"id": str(sb.id), "name": sb.name} for sb in u.assigned_subjects]
        } for u in users
    ]

def update_user_role(db: Session, user_uuid: str, role_update: schemas.UserRoleUpdate, current_user: dict):
    target_user = db.query(models.User).filter(models.User.id == user_uuid).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_role = role_update.role
    allowed_roles = ["librarian", "teacher", "none"]
    
    # RBAC Logic
    if current_user["role"] == "SUPER_ADMIN":
        # Check if target user is currently a SUPER_ADMIN
        if target_user.role == "SUPER_ADMIN":
            raise HTTPException(status_code=403, detail="The SUPER_ADMIN role cannot be modified by anyone.")
            
        allowed_roles.append("admin")
    
    # Prevent Admins from creating other Admins or Super Admins
    if current_user["role"] == "admin":
        # Admins cannot modify other Admins or Super Admins
        if target_user.role in ["admin", "SUPER_ADMIN"]:
             raise HTTPException(status_code=403, detail="Insufficient permissions to modify this user's role.")
             
        if new_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Admins can only assign 'librarian', 'teacher', or 'none' roles.")
    
    if new_role not in ["admin", "librarian", "teacher", "SUPER_ADMIN", "none"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    target_user.role = new_role
    
    # Assign class/stream if it's a teacher or admin
    if new_role in ["teacher", "admin"]:
        # Convert empty strings to None to avoid UUID validation errors
        target_user.assigned_class_id = role_update.class_id if role_update.class_id else None
        target_user.assigned_stream_id = role_update.stream_id if role_update.stream_id else None
    else:
        # Clear assignments if role changes to librarian or none
        target_user.assigned_class_id = None
        target_user.assigned_stream_id = None

    # Handle Subroles (Only Super Admins can assign subroles to Admins)
    if current_user["role"] == "SUPER_ADMIN" and new_role == "admin" and role_update.subroles is not None:
        # Clear existing subroles
        db.query(models.UserSubrole).filter(models.UserSubrole.user_id == target_user.id).delete()
        # Add new subroles
        for sr_name in role_update.subroles:
            db_subrole = models.UserSubrole(user_id=target_user.id, subrole_name=sr_name)
            db.add(db_subrole)
    elif new_role != "admin":
        # Clear subroles if no longer an admin
        db.query(models.UserSubrole).filter(models.UserSubrole.user_id == target_user.id).delete()

    db.commit()
    db.refresh(target_user)
    
    log_action(
        db, 
        "warning" if new_role == "admin" or new_role == "SUPER_ADMIN" else "info",
        "role update",
        current_user["email"],
        f"Changed role of {target_user.full_name} to {new_role}",
        target_user=target_user.email
    )
    
    return {
        "id": str(target_user.id),
        "full_name": target_user.full_name,
        "email": target_user.email,
        "role": target_user.role,
        "assigned_class_id": str(target_user.assigned_class_id) if target_user.assigned_class_id else None,
        "assigned_stream_id": str(target_user.assigned_stream_id) if target_user.assigned_stream_id else None,
        "subroles": [sr.subrole_name for sr in target_user.subroles],
        "assigned_subjects": [{"id": str(sb.id), "name": sb.name} for sb in target_user.assigned_subjects]
    }
