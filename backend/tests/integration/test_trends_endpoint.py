"""Integration tests for Feature 6 Cross-Report Trend Tracking endpoints."""

from src.models.trend_insight import TrendInsight
from tests.fixtures.seed_data import (
    create_completed_report,
    create_test_profile,
    create_test_reference_ranges,
)


def setup_users_and_profiles(db_session, client):
    resp1 = client.post(
        "/api/auth/signup",
        json={"name": "User One", "email": "user1@mediora.dev", "password": "password123"},
    )
    user1_id = resp1.json()["user"]["id"]
    token1 = resp1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    resp2 = client.post(
        "/api/auth/signup",
        json={"name": "User Two", "email": "user2@mediora.dev", "password": "password123"},
    )
    token2 = resp2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    create_test_reference_ranges(db_session)
    profile1 = create_test_profile(db_session, user1_id, species="human")

    return db_session, user1_id, profile1, headers1, headers2


def test_aliased_tests_merge_into_one_trend_line(client, db_session):
    """§15 test #13: Reports sharing canonical test name merge into single trend line without re-splitting."""
    db, user1_id, profile, headers1, _ = setup_users_and_profiles(db_session, client)

    # 2 reports both having canonical test_name "Urea Nitrogen"
    create_completed_report(
        db,
        profile.id,
        [{"test_name": "Urea Nitrogen", "value": 15.0, "ref_low": 10.0, "ref_high": 20.0}],
    )
    create_completed_report(
        db,
        profile.id,
        [{"test_name": "Urea Nitrogen", "value": 18.0, "ref_low": 10.0, "ref_high": 20.0}],
    )

    resp_list = client.get(f"/api/profiles/{profile.id}/trends", headers=headers1)
    assert resp_list.status_code == 200
    data_list = resp_list.json()

    assert len(data_list["tests"]) == 1
    assert data_list["tests"][0]["test_name"] == "Urea Nitrogen"
    assert data_list["tests"][0]["report_count"] == 2

    resp_series = client.get(f"/api/profiles/{profile.id}/trends/Urea Nitrogen", headers=headers1)
    assert resp_series.status_code == 200
    data_series = resp_series.json()
    assert len(data_series["points"]) == 2


def test_single_report_returns_insufficient_data_not_broken_chart(client, db_session):
    """§15 test #14: Profile with exactly 1 completed report returns 200 with insufficient_data direction."""
    db, user1_id, profile, headers1, _ = setup_users_and_profiles(db_session, client)

    create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}],
    )

    resp = client.get(f"/api/profiles/{profile.id}/trends/Hemoglobin", headers=headers1)
    assert resp.status_code == 200
    data = resp.json()

    assert len(data["points"]) == 1
    assert data["direction"] == "insufficient_data"
    assert data["based_on_report_count"] == 1


def test_zero_reports_empty_state(client, db_session):
    """Profile with zero completed reports returns valid 200 empty state."""
    db, user1_id, profile, headers1, _ = setup_users_and_profiles(db_session, client)

    resp_list = client.get(f"/api/profiles/{profile.id}/trends", headers=headers1)
    assert resp_list.status_code == 200
    assert resp_list.json()["tests"] == []

    resp_overview = client.get(f"/api/profiles/{profile.id}/trends/overview", headers=headers1)
    assert resp_overview.status_code == 200
    assert resp_overview.json()["health_score_trend"]["direction"] == "insufficient_data"
    assert resp_overview.json()["tests"] == []


def test_overview_includes_health_score_trend(client, db_session):
    """Overview endpoint includes health score sparkline and trend direction across completed reports."""
    db, user1_id, profile, headers1, _ = setup_users_and_profiles(db_session, client)

    r1 = create_completed_report(db, profile.id, [{"test_name": "Hemoglobin", "value": 14.0, "ref_low": 12.0, "ref_high": 17.5}])
    r2 = create_completed_report(db, profile.id, [{"test_name": "Hemoglobin", "value": 15.0, "ref_low": 12.0, "ref_high": 17.5}])
    r3 = create_completed_report(db, profile.id, [{"test_name": "Hemoglobin", "value": 16.0, "ref_low": 12.0, "ref_high": 17.5}])

    r1.health_score = 70.0
    r2.health_score = 80.0
    r3.health_score = 90.0
    db.commit()

    resp = client.get(f"/api/profiles/{profile.id}/trends/overview", headers=headers1)
    assert resp.status_code == 200
    data = resp.json()["health_score_trend"]

    assert len(data["sparkline"]) == 3
    assert data["sparkline"] == [70.0, 80.0, 90.0]
    assert data["direction"] == "increasing"
    assert data["latest_score"] == 90.0


def test_overview_sparkline_respects_max_points(client, db_session):
    """Overview sparkline array length is capped at TREND_SPARKLINE_MAX_POINTS (6)."""
    db, user1_id, profile, headers1, _ = setup_users_and_profiles(db_session, client)

    for val in range(10, 18):
        create_completed_report(
            db,
            profile.id,
            [{"test_name": "Hemoglobin", "value": float(val), "ref_low": 12.0, "ref_high": 17.5}],
        )

    resp = client.get(f"/api/profiles/{profile.id}/trends/overview", headers=headers1)
    assert resp.status_code == 200
    item = resp.json()["tests"][0]

    assert len(item["sparkline"]) == 6
    assert item["report_count"] == 8


def test_insight_caches_and_invalidates_on_new_report(client, db_session):
    """Insight endpoint returns cached row when count matches, and upserts in place when new report added."""
    db, user1_id, profile, headers1, _ = setup_users_and_profiles(db_session, client)

    create_completed_report(db, profile.id, [{"test_name": "Hemoglobin", "value": 14.0, "ref_low": 12.0, "ref_high": 17.5}])
    create_completed_report(db, profile.id, [{"test_name": "Hemoglobin", "value": 14.2, "ref_low": 12.0, "ref_high": 17.5}])

    resp1 = client.get(f"/api/profiles/{profile.id}/trends/Hemoglobin/insight", headers=headers1)
    assert resp1.status_code == 200
    assert resp1.json()["based_on_report_count"] == 2

    # Verify DB row count is exactly 1
    insight_rows = db.query(TrendInsight).filter(TrendInsight.profile_id == profile.id).all()
    assert len(insight_rows) == 1

    # Add 3rd report
    create_completed_report(db, profile.id, [{"test_name": "Hemoglobin", "value": 14.4, "ref_low": 12.0, "ref_high": 17.5}])

    resp2 = client.get(f"/api/profiles/{profile.id}/trends/Hemoglobin/insight", headers=headers1)
    assert resp2.status_code == 200
    assert resp2.json()["based_on_report_count"] == 3

    # Confirm row was UPDATED, not duplicated
    insight_rows_after = db.query(TrendInsight).filter(TrendInsight.profile_id == profile.id).all()
    assert len(insight_rows_after) == 1


def test_insight_text_includes_caution_for_red_status(client, db_session):
    """Insight text includes caution clause when the latest parameter value has red status."""
    db, user1_id, profile, headers1, _ = setup_users_and_profiles(db_session, client)

    # Hemoglobin normal 12-17.5. Latest value 25.0 -> red status
    create_completed_report(db, profile.id, [{"test_name": "Hemoglobin", "value": 14.0, "ref_low": 12.0, "ref_high": 17.5}])
    create_completed_report(db, profile.id, [{"test_name": "Hemoglobin", "value": 25.0, "ref_low": 12.0, "ref_high": 17.5}])

    resp = client.get(f"/api/profiles/{profile.id}/trends/Hemoglobin/insight", headers=headers1)
    assert resp.status_code == 200
    text = resp.json()["insight_text"]

    assert "outside the normal range — consider discussing it with a doctor" in text


def test_missing_test_value_gaps_are_skipped_not_nulled(client, db_session):
    """Reports missing a specific test parameter are skipped from the series rather than yielding null points."""
    db, user1_id, profile, headers1, _ = setup_users_and_profiles(db_session, client)

    # Report 1: Hemoglobin + Blood Sugar
    create_completed_report(
        db,
        profile.id,
        [
            {"test_name": "Hemoglobin", "value": 14.0, "ref_low": 12.0, "ref_high": 17.5},
            {"test_name": "Blood Sugar", "value": 90.0, "ref_low": 70.0, "ref_high": 100.0},
        ],
    )

    # Report 2: Hemoglobin ONLY (Blood Sugar missing)
    create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}],
    )

    # Report 3: Hemoglobin + Blood Sugar
    create_completed_report(
        db,
        profile.id,
        [
            {"test_name": "Hemoglobin", "value": 15.0, "ref_low": 12.0, "ref_high": 17.5},
            {"test_name": "Blood Sugar", "value": 95.0, "ref_low": 70.0, "ref_high": 100.0},
        ],
    )

    resp = client.get(f"/api/profiles/{profile.id}/trends/Blood Sugar", headers=headers1)
    assert resp.status_code == 200
    data = resp.json()

    assert len(data["points"]) == 2
    assert data["based_on_report_count"] == 2


def test_trends_wrong_owner_rejected(client, db_session):
    """All 4 trend endpoints return 403 Forbidden when accessed by a non-owner user."""
    db, user1_id, profile, _, headers2 = setup_users_and_profiles(db_session, client)

    assert client.get(f"/api/profiles/{profile.id}/trends", headers=headers2).status_code == 403
    assert client.get(f"/api/profiles/{profile.id}/trends/overview", headers=headers2).status_code == 403
    assert client.get(f"/api/profiles/{profile.id}/trends/Hemoglobin", headers=headers2).status_code == 403
    assert client.get(f"/api/profiles/{profile.id}/trends/Hemoglobin/insight", headers=headers2).status_code == 403


def test_trends_nonexistent_profile_404(client, db_session):
    """All 4 trend endpoints return 404 Not Found for non-existent profile IDs."""
    db, user1_id, profile, headers1, _ = setup_users_and_profiles(db_session, client)

    fake_id = 99999
    assert client.get(f"/api/profiles/{fake_id}/trends", headers=headers1).status_code == 404
    assert client.get(f"/api/profiles/{fake_id}/trends/overview", headers=headers1).status_code == 404
    assert client.get(f"/api/profiles/{fake_id}/trends/Hemoglobin", headers=headers1).status_code == 404
    assert client.get(f"/api/profiles/{fake_id}/trends/Hemoglobin/insight", headers=headers1).status_code == 404
