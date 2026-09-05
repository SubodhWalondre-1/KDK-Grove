import logging
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.core.constants import (
    SPECIES_CATEGORIES,
    SPECIES_CATEGORY_DISPLAY_NAMES,
    SPECIES_TEXT_TO_CATEGORY_MAP,
    SPECIES_WITH_REFERENCE_DATA,
)
from src.models.missing_reference_log import MissingReferenceLog
from src.models.profile import Profile
from src.models.reference_range import ReferenceRange
from src.models.test_name_alias import TestNameAlias
from src.schemas.species import (
    BulkInsertResponse,
    CoverageGap,
    CoverageSummary,
    ProfileCreate,
    ReferenceRangeBulkItem,
    ReferenceRangeCoverageResponse,
    SpeciesOption,
    TestAliasBulkItem,
)

logger = logging.getLogger(__name__)

# Normalize set of categories with reference data
_REFERENCE_CATEGORIES = {
    SPECIES_TEXT_TO_CATEGORY_MAP.get(s, s) for s in SPECIES_WITH_REFERENCE_DATA
}


def normalize_species_to_category(species_text: str) -> str:
    """Map free-text species input (e.g., 'puppy', 'kitten', 'cow') to a standard species category.

    Falls back to 'other' if no match is found.
    """
    if not species_text:
        return "other"
    cleaned = species_text.strip().lower()
    return SPECIES_TEXT_TO_CATEGORY_MAP.get(cleaned, "other")


def resolve_canonical_test_name(extracted_name: str, species_category: str, db: Session) -> str:
    """Resolve an extracted lab test alias to its canonical test name if registered."""
    alias_row = (
        db.query(TestNameAlias)
        .filter(
            func.lower(TestNameAlias.alias_text) == func.lower(extracted_name.strip()),
            (TestNameAlias.species_category == species_category)
            | (TestNameAlias.species_category.is_(None)),
        )
        .first()
    )

    if alias_row is not None:
        return alias_row.canonical_test_name

    return extracted_name


def build_extraction_prompt(species_category: str) -> str:
    """Build species-specific contextual prompt text for OCR/LLM extraction."""
    context_map = {
        "human": "Context: This is a human medical lab report. Standard reference ranges apply.",
        "canine": "Context: This is a canine (dog) veterinary lab report. Look for species-specific markers like ALKP or ALT.",
        "feline": "Context: This is a feline (cat) veterinary lab report. Look for species-specific markers like SDMA or feline T4.",
        "bovine": "Context: This is a bovine (cattle/cow) veterinary lab report. Look for ruminant metabolic parameters.",
    }
    return context_map.get(species_category, "")


def create_profile(db: Session, user_id: int, profile_data: ProfileCreate) -> Profile:
    """Create a new user profile with server-side species category normalization."""
    species_category = normalize_species_to_category(profile_data.species)

    profile = Profile(
        user_id=user_id,
        profile_name=profile_data.profile_name,
        species=profile_data.species,
        species_category=species_category,
        gender=profile_data.gender,
        date_of_birth=profile_data.date_of_birth,
        breed=profile_data.breed,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_user_profiles(db: Session, user_id: int) -> list[Profile]:
    """Return all profiles belonging to the authenticated user."""
    return db.query(Profile).filter(Profile.user_id == user_id).all()


def get_supported_species(db: Session) -> list[SpeciesOption]:
    """Return all supported species categories and whether reference data is available."""
    options = []
    for cat in SPECIES_CATEGORIES:
        display_name = SPECIES_CATEGORY_DISPLAY_NAMES.get(cat, cat.capitalize())
        ref_available = cat in _REFERENCE_CATEGORIES
        options.append(
            SpeciesOption(
                category=cat,
                display_name=display_name,
                reference_data_available=ref_available,
            )
        )
    return options


def get_reference_coverage(db: Session) -> ReferenceRangeCoverageResponse:
    """Query covered reference range counts and top missing reference range gaps."""
    # Covered summary: group by species in reference_ranges table
    covered_rows = (
        db.query(ReferenceRange.species, func.count(ReferenceRange.id).label("test_count"))
        .group_by(ReferenceRange.species)
        .all()
    )
    covered = [
        CoverageSummary(species=row.species, test_count=row.test_count)
        for row in covered_rows
    ]

    # Gaps: group by species, test_name in missing_reference_log table (limit top 50)
    gap_rows = (
        db.query(
            MissingReferenceLog.species,
            MissingReferenceLog.test_name,
            func.count(MissingReferenceLog.id).label("missing_count"),
        )
        .group_by(MissingReferenceLog.species, MissingReferenceLog.test_name)
        .order_by(func.count(MissingReferenceLog.id).desc())
        .limit(50)
        .all()
    )
    gaps = [
        CoverageGap(
            species=row.species,
            test_name=row.test_name,
            missing_count=row.missing_count,
        )
        for row in gap_rows
    ]

    return ReferenceRangeCoverageResponse(covered=covered, gaps=gaps)


def bulk_add_reference_ranges(db: Session, items: list[ReferenceRangeBulkItem]) -> BulkInsertResponse:
    """Bulk insert reference range records with check-before-insert duplicate skipping."""
    inserted = 0
    skipped = 0

    for item in items:
        existing = (
            db.query(ReferenceRange)
            .filter(
                ReferenceRange.species == item.species,
                ReferenceRange.test_name == item.test_name,
                ReferenceRange.gender == item.gender,
            )
            .first()
        )
        if existing is None:
            db.add(
                ReferenceRange(
                    species=item.species,
                    test_name=item.test_name,
                    gender=item.gender,
                    unit=item.unit,
                    range_low=item.range_low,
                    range_high=item.range_high,
                )
            )
            inserted += 1
        else:
            skipped += 1

    if inserted > 0:
        db.commit()

    return BulkInsertResponse(inserted_count=inserted, skipped_count=skipped)


def bulk_add_test_aliases(db: Session, items: list[TestAliasBulkItem]) -> BulkInsertResponse:
    """Bulk insert test name aliases with check-before-insert duplicate skipping."""
    inserted = 0
    skipped = 0

    for item in items:
        existing = (
            db.query(TestNameAlias)
            .filter(
                TestNameAlias.alias_text == item.alias_text,
                TestNameAlias.species_category == item.species_category,
            )
            .first()
        )
        if existing is None:
            db.add(
                TestNameAlias(
                    alias_text=item.alias_text,
                    canonical_test_name=item.canonical_test_name,
                    species_category=item.species_category,
                )
            )
            inserted += 1
        else:
            skipped += 1

    if inserted > 0:
        db.commit()

    return BulkInsertResponse(inserted_count=inserted, skipped_count=skipped)
