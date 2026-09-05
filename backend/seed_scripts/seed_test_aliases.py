"""Seed script for lab test name aliases.

Idempotent: check-before-insert prevents duplicate rows.
"""

import sys
from pathlib import Path

# Add backend directory to python path for direct execution
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.database import SessionLocal, Base, engine
import src.models.test_name_alias  # noqa: F401
from src.models.test_name_alias import TestNameAlias

TEST_ALIASES = [
    ("BUN", "Blood Urea Nitrogen", None),
    ("Urea", "Blood Urea Nitrogen", None),
    ("ALT", "ALT", None),
    ("SGPT", "ALT", None),
    ("AST", "AST", None),
    ("SGOT", "AST", None),
    ("Creat", "Creatinine", None),
    ("Ca", "Calcium", None),
    ("TP", "Total Protein", None),
    ("Alb", "Albumin", None),
    ("Hb", "Hemoglobin", None),
    ("WBC", "White Blood Cell Count", None),
    ("RBC", "Red Blood Cell Count", None),
    ("Na", "Sodium", None),
    ("K", "Potassium", None),
    ("Mg", "Magnesium", None),
    ("Glucose", "Blood Sugar", None),
    ("Chol", "Cholesterol", None),
    ("TSH", "Thyroid Stimulating Hormone", None),
]


def seed_test_aliases():
    """Seed test name aliases idempotently."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        added = 0
        for alias_text, canonical_name, species_cat in TEST_ALIASES:
            existing = (
                db.query(TestNameAlias)
                .filter(
                    TestNameAlias.alias_text == alias_text,
                    TestNameAlias.species_category == species_cat,
                )
                .first()
            )
            if not existing:
                db.add(
                    TestNameAlias(
                        alias_text=alias_text,
                        canonical_test_name=canonical_name,
                        species_category=species_cat,
                    )
                )
                added += 1
            else:
                existing.canonical_test_name = canonical_name

        db.commit()
        print(f"Test alias seeding complete: {added} aliases added/updated.")

    except Exception as exc:
        db.rollback()
        print(f"Error seeding test aliases: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_test_aliases()
