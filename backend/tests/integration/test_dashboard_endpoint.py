"""Integration tests for F2 health dashboard endpoints."""

from datetime import date

import pytest

from src.core.constants import STATUS_GREEN, STATUS_RED, STATUS_YELLOW
from tests.fixtures.seed_data import (
    create_completed_report,
    create_test_profile,
    create_test_reference_ranges,
)

# --- Shared test data ---

NORMAL_TEST_VALUES = [
    {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5},
    {"test_name": "Blood Sugar", "value": 85.0, "unit": "mg/dL", "ref_low": 70.0, "ref_high": 100.0},
]

MIXED_TEST_VALUES = [
    {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5},   # green
    {"test_name": "Blood Sugar", "value": 18.0, "unit": "mg/dL", "ref_low": 12.0, "ref_high": 17.5},  # yellow (borderline)
    {"test_name": "Cholesterol", "value": 5.0, "unit": "mg/dL", "ref_low": 12.0, "ref_high": 17.5},   # red (severe)
    {"test_name": "Unknown Test", "value": 42.0, "unit": "U/L", "ref_low": None, "ref_high": None},    # no ref
]


@pytest.fixture()
def dashboard_setup(db_session, client):
    """Create a user, profile, and auth headers for dashboard tests."""
    resp = client.post(
        "/api/auth/signup",
        json={"name": "Dashboard User", "email": "dash@mediora.dev", "password": "pass123"},
    )
    data = resp.json()
    user_id = data["user"]["id"]
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    profile = create_test_profile(db_session, user_id, species="human")
    create_test_reference_ranges(db_session)
    return db_session, profile, headers, user_id


def test_dashboard_returns_persisted_health_score(client, dashboard_setup):
    """§15 test #3: health_score must be identical across calls, not recomputed differently."""
    db, profile, headers, _ = dashboard_setup
    report = create_completed_report(db, profile.id, NORMAL_TEST_VALUES, report_date=date(2025, 6, 1))

    resp1 = client.get(f"/api/reports/{report.id}/dashboard", headers=headers)
    assert resp1.status_code == 200
    score1 = resp1.json()["health_score"]

    resp2 = client.get(f"/api/reports/{report.id}/dashboard", headers=headers)
    score2 = resp2.json()["health_score"]

    assert score1 == score2
    assert score1 == report.health_score


def test_dashboard_handles_missing_reference_gracefully(client, dashboard_setup):
    """§15 test #4: missing ref → status=None, 200 not 500."""
    db, profile, headers, _ = dashboard_setup
    test_values = [
        {"test_name": "Obscure Marker", "value": 42.0, "unit": "U/L", "ref_low": None, "ref_high": None},
    ]
    report = create_completed_report(db, profile.id, test_values, report_date=date(2025, 6, 1))

    resp = client.get(f"/api/reports/{report.id}/dashboard", headers=headers)
    assert resp.status_code == 200

    data = resp.json()
    tv = data["test_values"][0]
    assert tv["status"] is None


def test_dashboard_abnormal_values_excludes_green(client, dashboard_setup):
    db, profile, headers, _ = dashboard_setup
    report = create_completed_report(db, profile.id, MIXED_TEST_VALUES, report_date=date(2025, 6, 1))

    resp = client.get(f"/api/reports/{report.id}/dashboard", headers=headers)
    assert resp.status_code == 200

    data = resp.json()
    abnormal_statuses = [tv["status"] for tv in data["abnormal_values"]]
    assert STATUS_GREEN not in abnormal_statuses
    assert len(abnormal_statuses) > 0
    for s in abnormal_statuses:
        assert s in (STATUS_YELLOW, STATUS_RED)


def test_dashboard_status_ratio_counts_correctly(client, dashboard_setup):
    db, profile, headers, _ = dashboard_setup
    report = create_completed_report(db, profile.id, MIXED_TEST_VALUES, report_date=date(2025, 6, 1))

    resp = client.get(f"/api/reports/{report.id}/dashboard", headers=headers)
    data = resp.json()
    ratio = data["status_ratio"]

    # MIXED_TEST_VALUES: 1 green, 1 yellow, 1 red, 1 no-ref (excluded)
    assert ratio["normal"] == 1
    assert ratio["borderline"] == 1
    assert ratio["abnormal"] == 1
    assert ratio["normal"] + ratio["borderline"] + ratio["abnormal"] == 3  # not 4


def test_dashboard_parameter_trend_multi_report(client, dashboard_setup):
    db, profile, headers, _ = dashboard_setup

    reports_data = [
        (date(2025, 1, 15), [{"test_name": "Hemoglobin", "value": 13.0, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5}]),
        (date(2025, 3, 15), [{"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5}]),
        (date(2025, 6, 15), [{"test_name": "Hemoglobin", "value": 16.0, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5}]),
    ]
    report_ids = []
    for rd, tvs in reports_data:
        r = create_completed_report(db, profile.id, tvs, report_date=rd)
        report_ids.append(r.id)

    resp = client.get(f"/api/reports/{report_ids[-1]}/dashboard", headers=headers)
    assert resp.status_code == 200

    trend = resp.json()["parameter_trend"]
    assert len(trend["labels"]) == 3

    hb_dataset = next((ds for ds in trend["datasets"] if ds["label"] == "Hemoglobin"), None)
    assert hb_dataset is not None
    assert hb_dataset["data"] == [13.0, 14.5, 16.0]


def test_dashboard_wrong_owner_rejected(client, dashboard_setup):
    db, profile, headers, _ = dashboard_setup
    report = create_completed_report(db, profile.id, NORMAL_TEST_VALUES, report_date=date(2025, 6, 1))

    other_resp = client.post(
        "/api/auth/signup",
        json={"name": "Other", "email": "other_dash@mediora.dev", "password": "pass123"},
    )
    other_headers = {"Authorization": f"Bearer {other_resp.json()['access_token']}"}

    resp = client.get(f"/api/reports/{report.id}/dashboard", headers=other_headers)
    assert resp.status_code == 403


def test_profile_health_score_returns_latest(client, dashboard_setup):
    db, profile, headers, _ = dashboard_setup

    create_completed_report(db, profile.id, MIXED_TEST_VALUES, report_date=date(2025, 1, 1))
    latest = create_completed_report(db, profile.id, NORMAL_TEST_VALUES, report_date=date(2025, 6, 1))

    resp = client.get(f"/api/profiles/{profile.id}/health-score", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["latest_report_id"] == latest.id
    assert data["latest_health_score"] == latest.health_score


def test_profile_health_score_empty_state(client, dashboard_setup):
    _, profile, headers, _ = dashboard_setup

    resp = client.get(f"/api/profiles/{profile.id}/health-score", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["latest_report_id"] is None
    assert data["latest_health_score"] is None
    assert data["latest_report_date"] is None
