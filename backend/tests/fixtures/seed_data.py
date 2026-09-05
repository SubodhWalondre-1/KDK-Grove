from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from src.core.constants import REPORT_STATUS_COMPLETED
from src.core.severity import calculate_health_score
from src.models.profile import Profile
from src.models.reference_range import ReferenceRange
from src.models.report import Report, ReportTestValue


from src.features.species_support.service import normalize_species_to_category


def create_test_profile(db: Session, user_id: int, species: str = "human") -> Profile:
    profile = Profile(
        user_id=user_id,
        profile_name="Test Profile",
        species=species,
        species_category=normalize_species_to_category(species),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def create_test_reference_ranges(db: Session) -> list[ReferenceRange]:
    ranges = [
        ReferenceRange(
            species="human",
            test_name="Hemoglobin",
            gender="any",
            unit="g/dL",
            range_low=12.0,
            range_high=17.5,
        ),
        ReferenceRange(
            species="human",
            test_name="Blood Sugar",
            gender="any",
            unit="mg/dL",
            range_low=70.0,
            range_high=100.0,
        ),
        ReferenceRange(
            species="dog",
            test_name="Hemoglobin",
            gender="any",
            unit="g/dL",
            range_low=12.0,
            range_high=18.0,
        ),
        ReferenceRange(
            species="dog",
            test_name="Blood Sugar",
            gender="any",
            unit="mg/dL",
            range_low=74.0,
            range_high=143.0,
        ),
    ]
    db.add_all(ranges)
    db.commit()
    return ranges


def create_completed_report(
    db: Session,
    profile_id: int,
    test_values_data: list[dict],
    report_date: Optional[date] = None,
) -> Report:
    """Create a completed Report with test values directly, bypassing the OCR/LLM pipeline."""
    report = Report(
        profile_id=profile_id,
        status=REPORT_STATUS_COMPLETED,
        original_file_path="test/original.jpg",
        report_date=report_date,
    )
    db.add(report)
    db.flush()

    rows = []
    for tv in test_values_data:
        rows.append(
            ReportTestValue(
                report_id=report.id,
                test_name=tv["test_name"],
                value=tv.get("value"),
                unit=tv.get("unit"),
                ref_low=tv.get("ref_low"),
                ref_high=tv.get("ref_high"),
            )
        )
    db.add_all(rows)
    db.flush()
    db.refresh(report)

    report.health_score = calculate_health_score(report.test_values)
    db.commit()
    db.refresh(report)
    return report
