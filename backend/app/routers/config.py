from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import database, schemas, models, auth
from ..services.logs import log_action

router = APIRouter()

@router.get("")
def get_config(db: Session = Depends(database.get_db)):
    config = db.query(models.GlobalConfig).first()
    if not config:
        # Create default config if not exists
        config = models.GlobalConfig(
            allow_public_signup=True
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.patch("")
def update_config(
    updates: schemas.ConfigUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["SUPER_ADMIN"]))
):
    config = db.query(models.GlobalConfig).first()
    if not config:
        config = models.GlobalConfig()
        db.add(config)
    
    if updates.allow_public_signup is not None:
        config.allow_public_signup = updates.allow_public_signup
    
    db.commit()
    db.refresh(config)
    log_action(db, "warning", "config update", current_user["email"], f"Updated global configuration: public_signup={config.allow_public_signup}")
    return config

@router.get("/check-policy")
def check_policy(email: Optional[str] = None, db: Session = Depends(database.get_db)):
    config = db.query(models.GlobalConfig).first()
    if not config:
        return {"allow_signup": True}
    
    if not config.allow_public_signup:
        return {"allow_signup": False, "reason": "Public signup is disabled"}
            
    return {"allow_signup": True}
