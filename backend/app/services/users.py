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


def appoint_self_as_director(db: Session, current_user: dict):
    # Only a SUPER_ADMIN can appoint themselves
    if current_user["role"] != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only Super Admins can use this feature")
        
    # Check if a director already exists
    director_exists = db.query(models.UserSubrole).filter(models.UserSubrole.subrole_name == "director").first()
    if director_exists:
        raise HTTPException(status_code=400, detail="A Director already exists.")
        
    # Grant current user the director subrole
    user_id = current_user["id"]
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_subrole = models.UserSubrole(user_id=db_user.id, subrole_name="director")
    db.add(db_subrole)
    db.commit()
    
    log_action(
        db, 
        "info",
        "director appointment",
        current_user["email"],
        f"{current_user['full_name']} appointed themselves as Director"
    )
    return {"message": "Successfully appointed as Director"}

def update_user_role(db: Session, user_uuid: str, role_update: schemas.UserRoleUpdate, current_user: dict):
    target_user = db.query(models.User).filter(models.User.id == user_uuid).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_role = role_update.role
    allowed_roles = ["librarian", "teacher", "none"]
    
    # Identify Director status
    is_director = "director" in current_user.get("subroles", [])
    is_admin_all = current_user["role"] == "admin" and "all" in current_user.get("subroles", [])
    
    # Target User Role/Subroles
    target_subroles = [sr.subrole_name for sr in target_user.subroles]
    is_target_director = "director" in target_subroles

    # 1. NO ONE can change the role of the director, not even themselves
    if is_target_director:
        raise HTTPException(
            status_code=403, 
            detail="The Director role is immutable. No modifications are allowed for this user."
        )

    # RBAC Logic
    if current_user["role"] == "SUPER_ADMIN":
        # Check if target user is currently a SUPER_ADMIN
        if target_user.role == "SUPER_ADMIN":
            # Only a Director can modify (or demote) a SUPER_ADMIN
            if not is_director:
                raise HTTPException(status_code=403, detail="Only the Director can modify other Super Admins.")
            
            # Director cannot demote themselves if they are the only Super Admin (optional safety)
            
        allowed_roles.append("admin")
        # Only Director can promote a user to SUPER_ADMIN
        if is_director:
            allowed_roles.append("SUPER_ADMIN")
    
    # Prevent Admins from creating other Admins or Super Admins
    if current_user["role"] == "admin":
        # Admins cannot modify Super Admins
        if target_user.role == "SUPER_ADMIN":
             raise HTTPException(status_code=403, detail="Insufficient permissions to modify a Super Admin.")
             
        # Normal admins cannot modify other Admins
        # Admin 'all' can modify other admins EXCEPT other Admin 'all'
        if target_user.role == "admin":
            if not is_admin_all:
                raise HTTPException(status_code=403, detail="Only Admins with 'all' subrole can manage other staff.")
            
            # Check if target is also an Admin 'all'
            target_subroles = [sr.subrole_name for sr in target_user.subroles]
            if "all" in target_subroles:
                raise HTTPException(status_code=403, detail="You cannot modify another Admin with the 'all' subrole.")

        if new_role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Insufficient permissions to assign the '{new_role}' role.")
    
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
        db.commit()
    elif is_admin_all and new_role == "admin" and role_update.subroles is not None:
        # Admin 'all' can assign subroles EXCEPT 'all'
        if "all" in role_update.subroles:
             raise HTTPException(status_code=403, detail="Admins cannot assign the 'all' subrole to others.")
        
        # Clear existing subroles
        db.query(models.UserSubrole).filter(models.UserSubrole.user_id == target_user.id).delete()
        # Add new subroles
        for sr_name in role_update.subroles:
            db_subrole = models.UserSubrole(user_id=target_user.id, subrole_name=sr_name)
            db.add(db_subrole)
        db.commit()
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

def get_user_details(db: Session, user_uuid: str):
    user = db.query(models.User).filter(models.User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "assigned_class_id": str(user.assigned_class_id) if user.assigned_class_id else None,
        "assigned_class_name": user.assigned_class.name if user.assigned_class else None,
        "assigned_stream_id": str(user.assigned_stream_id) if user.assigned_stream_id else None,
        "assigned_stream_name": user.assigned_stream.name if user.assigned_stream else None,
        "subroles": [sr.subrole_name for sr in user.subroles],
        "subject_assignments": [
            {
                "id": str(sa.id),
                "subject_id": str(sa.subject_id),
                "subject_name": sa.subject.name,
                "class_id": str(sa.class_id),
                "class_name": sa.assigned_class.name if sa.assigned_class else None,
                "stream_id": str(sa.stream_id) if sa.stream_id else None,
                "stream_name": sa.assigned_stream.name if sa.assigned_stream else None
            } for sa in user.subject_assignments
        ]
    }
