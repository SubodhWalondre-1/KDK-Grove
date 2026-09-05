from datetime import datetime, timedelta
from src.models.share_link import AccessLog, ShareLink
from tests.fixtures.seed_data import (
    create_completed_report,
    create_test_profile,
    create_test_reference_ranges,
)


def setup_users_profile_and_report(db_session, client):
    resp1 = client.post(
        "/api/auth/signup",
        json={"name": "Owner User", "email": "owner@mediora.dev", "password": "password123"},
    )
    user1_id = resp1.json()["user"]["id"]
    token1 = resp1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    resp2 = client.post(
        "/api/auth/signup",
        json={"name": "Other User", "email": "other@mediora.dev", "password": "password123"},
    )
    token2 = resp2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    create_test_reference_ranges(db_session)
    profile = create_test_profile(db_session, user1_id, species="human")
    report = create_completed_report(
        db_session,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}],
    )

    return db_session, user1_id, profile, report, headers1, headers2


def test_revoke_then_access_returns_invalid(client, db_session):
    """§15 test #16: Revoked links return 410 with reason='revoked' on both preview and payload endpoints."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    # 1. Create share link
    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    assert resp_create.status_code == 200
    token = resp_create.json()["token"]
    link_id = resp_create.json()["id"]

    # 2. Revoke it
    resp_revoke = client.post(f"/api/share-links/{link_id}/revoke", headers=headers1)
    assert resp_revoke.status_code == 200
    assert resp_revoke.json()["status"] == "revoked"

    # 3. GET preview returns 410 Gone
    resp_preview = client.get(f"/api/shared/{token}")
    assert resp_preview.status_code == 410
    assert resp_preview.json()["reason"] == "revoked"

    # 4. POST access returns 410 Gone
    resp_access = client.post(f"/api/shared/{token}/access", json={"viewer_name": "Test"})
    assert resp_access.status_code == 410
    assert resp_access.json()["reason"] == "revoked"


def test_revoke_does_not_delete_the_row(client, db_session):
    """Revoking updates status to 'revoked' without deleting the ShareLink or AccessLog rows."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]
    link_id = resp_create.json()["id"]

    # Add access log
    client.post(f"/api/shared/{token}/access", json={"viewer_name": "Dr. Smith"})

    # Revoke link
    client.post(f"/api/share-links/{link_id}/revoke", headers=headers1)

    # Verify DB directly
    link_row = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    assert link_row is not None
    assert link_row.status == "revoked"

    logs = db.query(AccessLog).filter(AccessLog.share_link_id == link_id).all()
    assert len(logs) == 1
    assert logs[0].viewer_name == "Dr. Smith"


def test_expired_link_rejected_without_status_write(client, db_session):
    """Expired link returns 410 reason='expired' while DB status column remains 'active' (computed live)."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]
    link_id = resp_create.json()["id"]

    # Manually expire in DB
    link_row = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    link_row.expires_at = datetime.utcnow() - timedelta(days=1)
    db.commit()

    resp_preview = client.get(f"/api/shared/{token}")
    assert resp_preview.status_code == 410
    assert resp_preview.json()["reason"] == "expired"

    # Verify status column in DB was NOT rewritten to 'expired'
    db.refresh(link_row)
    assert link_row.status == "active"


def test_access_logged_on_named_path(client, db_session):
    """POST /access with viewer_name creates named AccessLog and increments view_count."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]
    link_id = resp_create.json()["id"]

    resp_access = client.post(f"/api/shared/{token}/access", json={"viewer_name": "Priya"})
    assert resp_access.status_code == 200
    assert resp_access.json()["profile_name"] == profile.profile_name

    link_row = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    assert link_row.view_count == 1

    logs = db.query(AccessLog).filter(AccessLog.share_link_id == link_id).all()
    assert len(logs) == 1
    assert logs[0].viewer_name == "Priya"


def test_access_logged_on_skip_path(client, db_session):
    """§15 test #18: POST /access with viewer_name omitted still creates AccessLog row with viewer_name=None."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]
    link_id = resp_create.json()["id"]

    resp_access = client.post(f"/api/shared/{token}/access", json={})
    assert resp_access.status_code == 200

    link_row = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    assert link_row.view_count == 1

    logs = db.query(AccessLog).filter(AccessLog.share_link_id == link_id).all()
    assert len(logs) == 1
    assert logs[0].viewer_name is None


def test_owner_only_sees_own_share_links(client, db_session):
    """User A's share links list never contains User B's links."""
    db, user1_id, profile, report, headers1, headers2 = setup_users_profile_and_report(db_session, client)

    client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)

    # User B querying User A's profile_id gets 403 Forbidden
    resp = client.get(f"/api/profiles/{profile.id}/share-links", headers=headers2)
    assert resp.status_code == 403


def test_wrong_owner_cannot_revoke_or_view_logs(client, db_session):
    """User B cannot revoke or view access logs for User A's share link (403 Forbidden)."""
    db, user1_id, profile, report, headers1, headers2 = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    link_id = resp_create.json()["id"]

    assert client.get(f"/api/share-links/{link_id}/logs", headers=headers2).status_code == 403
    assert client.post(f"/api/share-links/{link_id}/revoke", headers=headers2).status_code == 403


def test_nonexistent_token_returns_404_not_410(client, db_session):
    """GET /api/shared/invalid_token returns 404 Not Found."""
    resp = client.get("/api/shared/nonexistent_garbage_token")
    assert resp.status_code == 404


def test_logs_endpoint_marks_unseen_as_seen(client, db_session):
    """GET /share-links/{id}/logs marks unseen access logs as seen=True as a documented side effect."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]
    link_id = resp_create.json()["id"]

    # Add 3 access logs
    client.post(f"/api/shared/{token}/access", json={"viewer_name": "Viewer 1"})
    client.post(f"/api/shared/{token}/access", json={"viewer_name": "Viewer 2"})
    client.post(f"/api/shared/{token}/access", json={"viewer_name": "Viewer 3"})

    # First fetch returns log entries
    resp_logs1 = client.get(f"/api/share-links/{link_id}/logs", headers=headers1)
    assert resp_logs1.status_code == 200
    assert len(resp_logs1.json()["logs"]) == 3

    # Direct DB check proves seen boolean updated to True
    unseen_in_db = db.query(AccessLog).filter(AccessLog.share_link_id == link_id, AccessLog.seen == False).count()
    assert unseen_in_db == 0


def test_share_links_list_includes_unseen_count_and_latest_access(client, db_session):
    """Share links list response includes accurate unseen_count and latest_access_at timestamp."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]
    link_id = resp_create.json()["id"]

    # 1 access
    client.post(f"/api/shared/{token}/access", json={"viewer_name": "Guest"})

    resp_list = client.get(f"/api/profiles/{profile.id}/share-links", headers=headers1)
    assert resp_list.status_code == 200
    item = resp_list.json()["share_links"][0]

    assert item["unseen_count"] == 1
    assert item["latest_access_at"] is not None


def test_expiry_days_rejects_disallowed_values(client, db_session):
    """POST /reports/{id}/share rejects disallowed expires_in_days values (e.g. 14) with 422 Unprocessable Entity."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 14}, headers=headers1)
    assert resp.status_code in (400, 422)


def test_create_share_link_expiry_variants(client, db_session):
    """Items 1-5: Create share links with 1, 7, 30, and 90 days expiry."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    for days in [1, 7, 30, 90]:
        resp = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": days}, headers=headers1)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "active"
        assert data["report_id"] == report.id
        assert data["share_url"].endswith(f"/shared/{data['token']}")
        assert data["view_count"] == 0
        exp = datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00"))
        # Allow +/- 5 minutes around expected expiry
        delta = exp.replace(tzinfo=None) - datetime.utcnow()
        assert abs(delta.total_seconds() - (days * 86400)) < 300


def test_reject_sharing_nonexistent_and_unowned_report(client, db_session):
    """Items 7 & 8: Reject sharing nonexistent report (404) and another user's report (403)."""
    db, user1_id, profile, report, headers1, headers2 = setup_users_profile_and_report(db_session, client)

    # Nonexistent report
    resp_404 = client.post("/api/reports/999999/share", json={"expires_in_days": 7}, headers=headers1)
    assert resp_404.status_code == 404

    # Another user's report
    resp_403 = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers2)
    assert resp_403.status_code == 403


def test_cannot_share_uncompleted_report(client, db_session):
    """Validation: Report must be completed before sharing (HTTP 400)."""
    from src.models.report import Report
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    report_row = db.query(Report).filter(Report.id == report.id).first()
    report_row.status = "processing"
    db.commit()

    resp = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    assert resp.status_code == 400
    assert "completed" in resp.json()["detail"].lower()


def test_share_url_format_and_no_double_slash(client, db_session, monkeypatch):
    """Item 9: Returned share_url correctly uses configured FRONTEND_BASE_URL without double slashes."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    from src.config import get_settings
    settings = get_settings()
    monkeypatch.setattr(settings, "frontend_base_url", "https://mediora.health/")

    resp = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    assert resp.status_code == 200
    token = resp.json()["token"]
    share_url = resp.json()["share_url"]
    assert share_url == f"https://mediora.health/shared/{token}"
    assert "https://mediora.health//shared" not in share_url


def test_public_preview_returns_sanitized_metadata(client, db_session):
    """Item 11: Public preview returns valid, profile_name, species, report_date, expires_at, status without leaks."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]

    resp_preview = client.get(f"/api/shared/{token}")
    assert resp_preview.status_code == 200
    data = resp_preview.json()
    assert data["valid"] is True
    assert data["profile_name"] == profile.profile_name
    assert data["species"] == profile.species_category
    assert data["status"] == "active"
    assert "expires_at" in data

    # Ensure no leaks
    assert "original_file_path" not in data
    assert "user_id" not in data
    assert "email" not in data
    assert "password" not in data


def test_public_access_captures_headers_and_device_type(client, db_session):
    """Items 15-19: Access captures IP, User-Agent, detects mobile/tablet/desktop, stores viewer_name."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]
    link_id = resp_create.json()["id"]

    # 1. Mobile access
    mobile_ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
    client.post(
        f"/api/shared/{token}/access",
        json={"viewer_name": "Dr. Mobile"},
        headers={"User-Agent": mobile_ua, "X-Forwarded-For": "203.0.113.195"},
    )

    # 2. Desktop access
    desktop_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    client.post(
        f"/api/shared/{token}/access",
        json={"viewer_name": "Dr. Desktop"},
        headers={"User-Agent": desktop_ua, "X-Forwarded-For": "198.51.100.1"},
    )

    # Check logs via owner endpoint
    resp_logs = client.get(f"/api/share-links/{link_id}/logs", headers=headers1)
    assert resp_logs.status_code == 200
    log_data = resp_logs.json()
    assert log_data["share_link_id"] == link_id
    assert log_data["total_accesses"] == 2
    logs = log_data["logs"]

    # Most recent first
    assert logs[0]["viewer_name"] == "Dr. Desktop"
    assert logs[0]["device_type"] == "desktop"
    assert logs[1]["viewer_name"] == "Dr. Mobile"
    assert logs[1]["device_type"] == "mobile"


def test_multiple_accesses_atomically_increment_view_count(client, db_session):
    """Item 30: Multiple accesses correctly increment view_count."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]
    link_id = resp_create.json()["id"]

    for i in range(5):
        resp = client.post(f"/api/shared/{token}/access", json={"viewer_name": f"Viewer {i}"})
        assert resp.status_code == 200
        assert resp.json()["share"]["view_count"] == i + 1

    link_row = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    assert link_row.view_count == 5


def test_shared_payload_does_not_leak_sensitive_info(client, db_session):
    """Items 28 & 29: Shared payload does not expose internal file paths, credentials, or OCR text."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]

    resp = client.post(f"/api/shared/{token}/access", json={"viewer_name": "Reviewer"})
    assert resp.status_code == 200
    data = resp.json()

    # Verify structured sections
    assert "share" in data
    assert "profile" in data
    assert "report" in data
    assert "test_values" in data
    assert "insights" in data

    # Check for forbidden leaks
    raw_str = str(data).lower()
    assert "original_file_path" not in raw_str
    assert "preprocessed_file_path" not in raw_str
    assert "ocr_raw_text" not in raw_str
    assert "password" not in raw_str
    assert "hashed_password" not in raw_str
    assert "jwt" not in raw_str
    assert "owner@mediora.dev" not in raw_str


def test_list_share_links_sorting_and_expiry_status(client, db_session):
    """Items 20, 21: Owner lists links newest first; shows is_expired=True and status='expired' for past links."""
    db, user1_id, profile, report, headers1, headers2 = setup_users_profile_and_report(db_session, client)

    # Link 1: Created first, then manually expired
    resp1 = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 1}, headers=headers1)
    link1_id = resp1.json()["id"]
    link1_row = db.query(ShareLink).filter(ShareLink.id == link1_id).first()
    link1_row.expires_at = datetime.utcnow() - timedelta(hours=2)
    db.commit()

    # Link 2: Created second (newer)
    resp2 = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    link2_id = resp2.json()["id"]

    # Owner list
    resp_list = client.get(f"/api/profiles/{profile.id}/share-links", headers=headers1)
    assert resp_list.status_code == 200
    items = resp_list.json()["share_links"]
    assert len(items) >= 2

    # Newest created first
    assert items[0]["id"] == link2_id
    assert items[0]["is_expired"] is False
    assert items[0]["status"] == "active"
    assert items[0]["profile_name"] == profile.profile_name
    assert items[0]["share_url"].startswith("http")

    # Older expired link
    assert items[1]["id"] == link1_id
    assert items[1]["is_expired"] is True
    assert items[1]["status"] == "expired"

    # Other user cannot list links (403)
    resp_other = client.get(f"/api/profiles/{profile.id}/share-links", headers=headers2)
    assert resp_other.status_code == 403


def test_public_root_route_support(client, db_session):
    """Verify public endpoints work at root /shared/{token} in addition to /api/shared/{token}."""
    db, user1_id, profile, report, headers1, _ = setup_users_profile_and_report(db_session, client)

    resp_create = client.post(f"/api/reports/{report.id}/share", json={"expires_in_days": 7}, headers=headers1)
    token = resp_create.json()["token"]

    # Root preview
    resp_preview = client.get(f"/shared/{token}")
    assert resp_preview.status_code == 200
    assert resp_preview.json()["valid"] is True

    # Root access
    resp_access = client.post(f"/shared/{token}/access", json={"viewer_name": "Root Guest"})
    assert resp_access.status_code == 200
    assert resp_access.json()["profile_name"] == profile.profile_name

