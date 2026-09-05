"""Seed script for pre-populating ExplanationCache with standard test parameter explanations.

Run standalone via: python -m seed_scripts.seed_explanation_cache
"""

import sys
from pathlib import Path

# Ensure root backend dir is in sys.path
root_dir = Path(__file__).parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from src.database import SessionLocal
from src.features.ai_explanations import service as explanation_service
from src.models.explanation_cache import ExplanationCache

SEED_TEST_NAMES = [
    "Hemoglobin",
    "Blood Sugar",
    "White Blood Cells",
    "Platelets",
    "Creatinine",
    "Urea Nitrogen",
    "ALT",
    "AST",
    "Bilirubin",
    "Albumin",
    "Sodium",
    "Potassium",
]

SEED_SEVERITY_BUCKETS = [
    "high_borderline",
    "high_severe",
    "low_borderline",
    "low_severe",
]

SEED_SPECIES = ["human", "dog", "cat"]

SEED_TARGETS = [
    {
        "canonical_test_name": test_name,
        "severity_bucket": bucket,
        "species_category": species,
    }
    for test_name in SEED_TEST_NAMES
    for bucket in SEED_SEVERITY_BUCKETS
    for species in SEED_SPECIES
]


def seed():
    db = SessionLocal()
    generated = 0
    already_cached = 0
    failed = []

    print(f"Starting explanation cache seeding for {len(SEED_TARGETS)} target combinations...")

    for target in SEED_TARGETS:
        test_name = target["canonical_test_name"]
        bucket = target["severity_bucket"]
        species = target["species_category"]

        existing = (
            db.query(ExplanationCache)
            .filter_by(
                canonical_test_name=test_name,
                severity_bucket=bucket,
                species_category=species,
            )
            .first()
        )

        if existing:
            already_cached += 1
            continue

        direction = bucket.split("_")[0]
        try:
            explanation_service._generate_and_cache_explanation(
                db=db,
                canonical_test_name=test_name,
                severity_bucket=bucket,
                species_category=species,
                direction=direction,
            )
            generated += 1
            print(f"[OK] Generated ({test_name}, {bucket}, {species})")
        except Exception as exc:
            failed.append((test_name, bucket, species, str(exc)))
            print(f"[FAILED] ({test_name}, {bucket}, {species}): {exc}")

    db.close()
    print("\n--- Seeding Summary ---")
    print(f"Total Target Combinations: {len(SEED_TARGETS)}")
    print(f"Newly Generated & Cached:  {generated}")
    print(f"Already Cached (Skipped):  {already_cached}")
    print(f"Failed Generations:        {len(failed)}")

    if failed:
        print("\nFailed Target Triples:")
        for item in failed:
            print(f" - {item[0]} | {item[1]} | {item[2]} -> {item[3]}")


if __name__ == "__main__":
    seed()
