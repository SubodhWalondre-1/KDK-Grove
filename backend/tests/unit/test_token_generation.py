import re
from src.core.constants import SHARE_LINK_TOKEN_BYTES
from src.features.secure_sharing import service as sharing_service
from tests.fixtures.seed_data import (
    create_completed_report,
    create_test_profile,
    create_test_reference_ranges,
)


def test_token_is_url_safe_and_correct_length():
    token = sharing_service.generate_share_token()
    # URL-safe base64 contains letters, digits, hyphen, underscore
    assert re.match(r"^[A-Za-z0-9_-]+$", token) is not None
    assert len(token) >= SHARE_LINK_TOKEN_BYTES


def test_tokens_are_unique_across_many_calls():
    tokens = {sharing_service.generate_share_token() for _ in range(1000)}
    assert len(tokens) == 1000


def test_shared_payload_scoped_to_single_report(db_session):
    """§15 test #17: A share link only ever returns its own report_id and test values, never other reports on same profile."""
    create_test_reference_ranges(db_session)
    profile = create_test_profile(db_session, user_id=1, species="human")

    # Report A with Hemoglobin
    report_a = create_completed_report(
        db_session,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}],
    )

    # Report B on SAME profile with Blood Sugar
    create_completed_report(
        db_session,
        profile.id,
        [{"test_name": "Blood Sugar", "value": 95.0, "ref_low": 70.0, "ref_high": 100.0}],
    )

    share_link = sharing_service.create_share_link(
        db_session, report_id=report_a.id, user_id=1, expires_in_days=7
    )

    payload = sharing_service.record_access_and_get_payload(
        db=db_session,
        token=share_link.token,
        viewer_name="Dr. Smith",
        ip_address="127.0.0.1",
        user_agent="Mozilla/5.0",
    )

    assert payload.report_id == report_a.id
    assert len(payload.test_values) == 1
    assert payload.test_values[0].test_name == "Hemoglobin"
    assert not any(tv.test_name == "Blood Sugar" for tv in payload.test_values)
