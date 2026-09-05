"""Seed reference ranges for Human, Dog, and Cat.

Sources:
- Human: Standard clinical laboratory reference values (Mayo Clinic / MedlinePlus).
- Dog/Cat: Merck Veterinary Manual (merckvetmanual.com) and IDEXX Reference Laboratories.

Re-running this script is safe — existing rows are skipped via check-before-insert.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.database import SessionLocal, Base, engine
from src.models.reference_range import ReferenceRange

# fmt: off
REFERENCE_DATA = [
    # ── Human (standard adult clinical ranges) ──
    ("human", "Hemoglobin",       "any",    "g/dL",    12.0,  17.5),
    ("human", "Blood Sugar",      "any",    "mg/dL",   70.0,  100.0),
    ("human", "Cholesterol",      "any",    "mg/dL",   125.0, 200.0),
    ("human", "Creatinine",       "any",    "mg/dL",   0.6,   1.2),
    ("human", "BUN",              "any",    "mg/dL",   7.0,   20.0),
    ("human", "ALT",              "any",    "U/L",     7.0,   56.0),
    ("human", "AST",              "any",    "U/L",     10.0,  40.0),
    ("human", "Total Protein",    "any",    "g/dL",    6.0,   8.3),
    ("human", "Albumin",          "any",    "g/dL",    3.5,   5.5),
    ("human", "WBC",              "any",    "10^3/uL", 4.5,   11.0),
    ("human", "RBC",              "any",    "10^6/uL", 4.0,   5.9),
    ("human", "Platelets",        "any",    "10^3/uL", 150.0, 400.0),
    ("human", "Calcium",          "any",    "mg/dL",   8.5,   10.5),
    ("human", "Vitamin D",        "any",    "ng/mL",   30.0,  100.0),
    ("human", "TSH",              "any",    "mIU/L",   0.4,   4.0),

    # ── Dog / Canine (Merck Veterinary Manual / IDEXX) ──
    ("dog",   "Hemoglobin",       "any",    "g/dL",    12.0,  18.0),
    ("dog",   "Blood Sugar",      "any",    "mg/dL",   74.0,  143.0),
    ("dog",   "Cholesterol",      "any",    "mg/dL",   135.0, 270.0),
    ("dog",   "Creatinine",       "any",    "mg/dL",   0.5,   1.8),
    ("dog",   "BUN",              "any",    "mg/dL",   7.0,   27.0),
    ("dog",   "ALT",              "any",    "U/L",     10.0,  125.0),
    ("dog",   "AST",              "any",    "U/L",     10.0,  50.0),
    ("dog",   "Total Protein",    "any",    "g/dL",    5.2,   8.2),
    ("dog",   "Albumin",          "any",    "g/dL",    2.3,   4.0),
    ("dog",   "WBC",              "any",    "10^3/uL", 5.5,   16.9),
    ("dog",   "RBC",              "any",    "10^6/uL", 5.5,   8.5),
    ("dog",   "Platelets",        "any",    "10^3/uL", 175.0, 500.0),
    ("dog",   "Calcium",          "any",    "mg/dL",   7.9,   12.0),

    # ── Cat / Feline (Merck Veterinary Manual / IDEXX) ──
    ("cat",   "Hemoglobin",       "any",    "g/dL",    8.0,   15.0),
    ("cat",   "Blood Sugar",      "any",    "mg/dL",   74.0,  159.0),
    ("cat",   "Cholesterol",      "any",    "mg/dL",   95.0,  220.0),
    ("cat",   "Creatinine",       "any",    "mg/dL",   0.8,   2.4),
    ("cat",   "BUN",              "any",    "mg/dL",   16.0,  36.0),
    ("cat",   "ALT",              "any",    "U/L",     12.0,  130.0),
    ("cat",   "AST",              "any",    "U/L",     10.0,  60.0),
    ("cat",   "Total Protein",    "any",    "g/dL",    5.7,   8.9),
    ("cat",   "Albumin",          "any",    "g/dL",    2.1,   3.3),
    ("cat",   "WBC",              "any",    "10^3/uL", 5.5,   19.5),
    ("cat",   "RBC",              "any",    "10^6/uL", 5.0,   10.0),
    ("cat",   "Platelets",        "any",    "10^3/uL", 175.0, 500.0),
    ("cat",   "Calcium",          "any",    "mg/dL",   6.5,   10.7),
]
# fmt: on


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    inserted_count = 0

    try:
        for species, test_name, gender, unit, range_low, range_high in REFERENCE_DATA:
            existing = (
                db.query(ReferenceRange)
                .filter(
                    ReferenceRange.species == species,
                    ReferenceRange.test_name == test_name,
                    ReferenceRange.gender == gender,
                )
                .first()
            )
            if existing:
                continue

            db.add(
                ReferenceRange(
                    species=species,
                    test_name=test_name,
                    gender=gender,
                    unit=unit,
                    range_low=range_low,
                    range_high=range_high,
                )
            )
            inserted_count += 1

        db.commit()
        print(f"Seeded {inserted_count} reference ranges ({len(REFERENCE_DATA)} total, duplicates skipped).")
    finally:
        db.close()


if __name__ == "__main__":
    run()
