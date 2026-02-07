from sqlalchemy.orm import Session
from .. import models
import datetime
from typing import Optional

def log_action(db: Session, level: str, action: str, user_email: str, details: str, target_user: Optional[str] = None):
    """
    Centralized logging for system actions.
    levels: info | warning | error | critical
    """
    db_log = models.SystemLog(
        level=level.lower(),
        action=action,
        user_email=user_email,
        target_user=target_user,
        details=details,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
