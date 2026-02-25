import uuid
from sqlalchemy.orm import Session
import os
import sys

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.models import Competency
from app.database import SessionLocal

CBC_CORE_COMPETENCIES = [
    {
        "name": "Communication & Collaboration",
        "description": "Ability to communicate effectively and work collaboratively with others."
    },
    {
        "name": "Critical Thinking & Problem Solving",
        "description": "Ability to analyze situations and develop logical solutions."
    },
    {
        "name": "Creativity & Imagination",
        "description": "Ability to generate innovative ideas and express originality."
    },
    {
        "name": "Citizenship",
        "description": "Understanding civic responsibility and ethical behavior."
    },
    {
        "name": "Digital Literacy",
        "description": "Ability to use digital tools responsibly and effectively."
    },
    {
        "name": "Learning to Learn",
        "description": "Ability to reflect on learning and apply strategies for improvement."
    },
    {
        "name": "Self-Efficacy",
        "description": "Confidence and resilience in handling tasks and challenges."
    },
]


def seed_competencies():
    db: Session = SessionLocal()

    existing = db.query(Competency).count()
    if existing > 0:
        print("Competencies already seeded.")
        db.close()
        return

    for comp in CBC_CORE_COMPETENCIES:
        competency = Competency(
            id=uuid.uuid4(),
            name=comp["name"],
            description=comp["description"]
        )
        db.add(competency)

    db.commit()
    db.close()

    print("CBC Core Competencies seeded successfully.")


if __name__ == "__main__":
    seed_competencies()
