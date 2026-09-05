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
    assert resp.status_code == 422
