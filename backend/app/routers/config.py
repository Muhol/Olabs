from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from typing import List, Optional
from .. import database, schemas, models, auth
from ..services.logs import log_action
from ..database import engine

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
        return {"allowed": True}
    
    if not config.allow_public_signup:
        # Check if user already exists in local DB
        if email:
            existing = db.query(models.User).filter(models.User.email == email).first()
            if existing:
                return {"allowed": True}
        
        return {"allowed": False, "reason": "Registration is currently restricted to invited personnel."}
            
    return {"allowed": True}

@router.get("/db-status")
def get_db_status(current_user: dict = Depends(auth.require_role(["SUPER_ADMIN"]))):
    """Identifies redundant tables in the database compared to models."""
    inspector = inspect(engine)
    db_tables = set(inspector.get_table_names())
    model_tables = set(models.Base.metadata.tables.keys())
    
    redundant = db_tables - model_tables - {'alembic_version'}
    return {
        "db_tables": list(db_tables),
        "model_tables": list(model_tables),
        "redundant_tables": list(redundant),
        "status": "healthy" if not redundant else "action_required"
    }

@router.post("/db-cleanup")
def cleanup_db(
    payload: dict,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["SUPER_ADMIN"]))
):
    """Drops identified redundant tables."""
    tables_to_drop = payload.get("tables", [])
    if not tables_to_drop:
        raise HTTPException(status_code=400, detail="No tables specified for deletion.")

    # Safety check: only allow dropping tables that are actually redundant
    inspector = inspect(engine)
    db_tables = set(inspector.get_table_names())
    model_tables = set(models.Base.metadata.tables.keys())
    redundant = db_tables - model_tables - {'alembic_version'}
    
    unauthorized_drops = [t for t in tables_to_drop if t not in redundant]
    if unauthorized_drops:
        raise HTTPException(status_code=403, detail=f"Cannot drop tables defined in models: {unauthorized_drops}")

    dropped = []
    with engine.begin() as conn:
        for table in tables_to_drop:
            conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
            dropped.append(table)
    
    log_action(db, "critical", "db cleanup", current_user["email"], f"Dropped redundant database tables: {dropped}")
    return {"message": "Cleanup successful", "dropped": dropped}

