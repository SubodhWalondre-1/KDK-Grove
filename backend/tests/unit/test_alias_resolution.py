"""Unit tests for species support alias resolution and species normalization."""

from src.features.species_support.service import (
    normalize_species_to_category,
    resolve_canonical_test_name,
)
from src.models.test_name_alias import TestNameAlias


def test_alias_resolves_to_canonical(db_session):
    db_session.add(
        TestNameAlias(
            alias_text="BUN",
            canonical_test_name="Blood Urea Nitrogen",
            species_category="canine",
        )
    )
    db_session.commit()

    resolved = resolve_canonical_test_name("BUN", "canine", db_session)
    assert resolved == "Blood Urea Nitrogen"


def test_bun_and_urea_resolve_identically(db_session):
    """§15 test #8: BUN and Urea both resolve to Blood Urea Nitrogen."""
    db_session.add_all([
        TestNameAlias(
            alias_text="BUN",
            canonical_test_name="Blood Urea Nitrogen",
            species_category=None,
        ),
        TestNameAlias(
            alias_text="Urea",
            canonical_test_name="Blood Urea Nitrogen",
            species_category=None,
        ),
    ])
    db_session.commit()

    bun_name = resolve_canonical_test_name("BUN", "canine", db_session)
    urea_name = resolve_canonical_test_name("Urea", "canine", db_session)

    assert bun_name == "Blood Urea Nitrogen"
    assert urea_name == "Blood Urea Nitrogen"
    assert bun_name == urea_name


def test_unresolvable_name_passes_through_unchanged(db_session):
    resolved = resolve_canonical_test_name("Unknown Test Marker", "human", db_session)
    assert resolved == "Unknown Test Marker"


def test_species_null_alias_applies_to_all(db_session):
    db_session.add(
        TestNameAlias(
            alias_text="Hb",
            canonical_test_name="Hemoglobin",
            species_category=None,
        )
    )
    db_session.commit()

    assert resolve_canonical_test_name("Hb", "canine", db_session) == "Hemoglobin"
    assert resolve_canonical_test_name("Hb", "feline", db_session) == "Hemoglobin"
    assert resolve_canonical_test_name("Hb", "bovine", db_session) == "Hemoglobin"


def test_species_specific_alias_does_not_leak(db_session):
    db_session.add(
        TestNameAlias(
            alias_text="Canine Specific Marker",
            canonical_test_name="Canine Marker",
            species_category="canine",
        )
    )
    db_session.commit()

    # Should resolve for canine
    assert resolve_canonical_test_name("Canine Specific Marker", "canine", db_session) == "Canine Marker"

    # Should NOT resolve for feline
    assert resolve_canonical_test_name("Canine Specific Marker", "feline", db_session) == "Canine Specific Marker"


def test_normalize_species_common_cases():
    assert normalize_species_to_category("Dog") == "canine"
    assert normalize_species_to_category("cat") == "feline"
    assert normalize_species_to_category("Golden Retriever") == "other"
    assert normalize_species_to_category("HUMAN") == "human"
    assert normalize_species_to_category("cow") == "bovine"
    assert normalize_species_to_category("") == "other"
