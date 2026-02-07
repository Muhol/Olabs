from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import database, models, auth

router = APIRouter()

@router.get("")
def get_logs(
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(auth.require_role(["SUPER_ADMIN"])),
    limit: int = 100,
    level: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(models.SystemLog)
    
    if level:
        query = query.filter(models.SystemLog.level == level)
    
    if search:
        search_f = f"%{search}%"
        query = query.filter(
            (models.SystemLog.action.ilike(search_f)) |
            (models.SystemLog.user_email.ilike(search_f)) |
            (models.SystemLog.target_user.ilike(search_f)) |
            (models.SystemLog.details.ilike(search_f))
        )
        
    logs = query.order_by(models.SystemLog.timestamp.desc()).limit(limit).all()
    
    # Calculate some stats for the dashboard
    total_events = db.query(models.SystemLog).count()
    security_alerts = db.query(models.SystemLog).filter(models.SystemLog.level == "warning").count()
    critical_failures = db.query(models.SystemLog).filter(models.SystemLog.level == "error").count()
    
    return {
        "items": logs,
        "stats": {
            "total_events": total_events,
            "security_alerts": security_alerts,
            "critical_failures": critical_failures
        }
    }
