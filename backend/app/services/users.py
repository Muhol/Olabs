from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException

def get_staff(db: Session):
    users = db.query(models.User).all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "clerk_id": u.clerk_id
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
        # allowed_roles.append("SUPER_ADMIN") # Optional: Allow transfer of super admin? Removed based on request "super admin role should not be updated by any one"
    
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
    db.commit()
    db.refresh(target_user)
    
    return {
        "id": str(target_user.id),
        "full_name": target_user.full_name,
        "email": target_user.email,
        "role": target_user.role
    }
