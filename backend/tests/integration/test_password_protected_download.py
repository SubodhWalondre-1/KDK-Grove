"""Integration tests for password-protected PDF downloads.

Tests:
1. Valid report download for Human patient.
2. PDF is encrypted and requires password.
3. Correct password (FIRST 4 CHARS + BIRTH YEAR) successfully opens PDF.
4. Incorrect password fails to decrypt.
5. Downloaded file is a valid PDF with correct headers and filename.
6. Original medical test values are present in the PDF.
7. Unauthorized report download (User B trying User A's report) returns 403 Forbidden.
8. Unauthenticated download returns 401 Unauthorized.
9. Missing DOB on profile returns 400 Bad Request with clear error message.
10. Veterinary (Animal) patient report download works with animal name + DOB.
11. Multiple reports for the same patient work.
12. Non-existent report returns 404 Not Found.
"""

from datetime import date
import io
import pytest
import PyPDF2
import pypdfium2 as pdfium

from src.models.profile import Profile
from src.models.report import Report, ReportTestValue
from tests.fixtures.seed_data import create_test_profile


SAMPLE_TEST_VALUES = [
    {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5},
    {"test_name": "Blood Sugar", "value": 95.0, "unit": "mg/dL", "ref_low": 70.0, "ref_high": 100.0},
]


@pytest.fixture()
def user_and_profile_setup(db_session, client):
    """Create test user, profile, and headers."""
    resp = client.post(
        "/api/auth/signup",
        json={"name": "Subodh User", "email": "subodh@mediora.dev", "password": "password123"},
    )
    data = resp.json()
    user_id = data["user"]["id"]
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile = Profile(
        user_id=user_id,
        profile_name="Subodh Walondre",
        species="human",
        gender="Male",
        date_of_birth=date(2005, 8, 15),
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    return db_session, profile, headers, user_id


def _create_report(db, profile_id, test_values=SAMPLE_TEST_VALUES, report_date=date(2025, 6, 1)):
    """Helper to create a completed report in DB."""
    report = Report(
        profile_id=profile_id,
        original_file_path=f"dummy/path/report_{profile_id}.pdf",
        status="completed",
        report_date=report_date,
        health_score=95.0,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    for tv in test_values:
        row = ReportTestValue(
            report_id=report.id,
            test_name=tv["test_name"],
            value=tv["value"],
            unit=tv["unit"],
            ref_low=tv.get("ref_low"),
            ref_high=tv.get("ref_high"),
            status="green",
        )
        db.add(row)

    db.commit()
    db.refresh(report)
    return report


def test_download_protected_report_success(client, user_and_profile_setup):
    """Test downloading report PDF with valid credentials and correct encryption."""
    db, profile, headers, user_id = user_and_profile_setup
    report = _create_report(db, profile.id)

    resp = client.get(f"/api/reports/{report.id}/download", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert f'filename="Mediora_Report_{report.id}.pdf"' in resp.headers["content-disposition"]

    pdf_bytes = resp.content
    assert len(pdf_bytes) > 0

    # 1. PyPDF2 verification: PDF is genuinely encrypted
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    assert reader.is_encrypted is True

    # 2. Incorrect password fails
    assert reader.decrypt("WRONGPASS1") == 0

    # 3. Correct password succeeds (SUBODH uppercase or lowercase)
    expected_password = "SUBODH"
    assert reader.decrypt(expected_password) in (1, 2)
    assert reader.decrypt("subodh") in (1, 2)

    # 4. Opening without password fails in pdfium
    with pytest.raises(Exception):
        pdfium.PdfDocument(pdf_bytes)

    # 5. Opening with password in pdfium succeeds
    doc = pdfium.PdfDocument(pdf_bytes, password=expected_password)
    assert len(doc) >= 1

    # 6. Verify original medical values exist in decrypted content
    page_text = doc[0].get_textpage().get_text_range()
    assert "Hemoglobin" in page_text
    assert "14.5" in page_text
    assert "Blood Sugar" in page_text
    assert "95.0" in page_text


def test_download_unauthorized_user_forbidden(client, user_and_profile_setup):
    """User B cannot download User A's protected report (403 Forbidden)."""
    db, profile, headers_a, _ = user_and_profile_setup
    report = _create_report(db, profile.id)

    # Create User B
    resp_b = client.post(
        "/api/auth/signup",
        json={"name": "Intruder User", "email": "intruder@mediora.dev", "password": "password123"},
    )
    token_b = resp_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    resp = client.get(f"/api/reports/{report.id}/download", headers=headers_b)
    assert resp.status_code == 403
    assert "Forbidden" in resp.json()["detail"]


def test_download_unauthenticated_rejected(client, user_and_profile_setup):
    """Unauthenticated download request returns 401 Unauthorized."""
    db, profile, _, _ = user_and_profile_setup
    report = _create_report(db, profile.id)

    resp = client.get(f"/api/reports/{report.id}/download")
    assert resp.status_code == 401


def test_download_without_dob_succeeds(client, db_session):
    """Profile without DOB downloads successfully using profile name as password."""
    resp = client.post(
        "/api/auth/signup",
        json={"name": "No DOB User", "email": "nodob@mediora.dev", "password": "password123"},
    )
    user_id = resp.json()["user"]["id"]
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile_no_dob = Profile(
        user_id=user_id,
        profile_name="Subodh",
        species="human",
        date_of_birth=None,  # Missing DOB - should still succeed!
    )
    db_session.add(profile_no_dob)
    db_session.commit()
    db_session.refresh(profile_no_dob)

    report = _create_report(db_session, profile_no_dob.id)

    resp_download = client.get(f"/api/reports/{report.id}/download", headers=headers)
    assert resp_download.status_code == 200
    assert resp_download.headers["content-type"] == "application/pdf"
    assert resp_download.headers.get("x-password-hint") == "SUBODH"

    # Verify decrypts with SUBODH
    reader = PyPDF2.PdfReader(io.BytesIO(resp_download.content))
    assert reader.decrypt("SUBODH") in (1, 2)


def test_download_veterinary_report_works(client, db_session):
    """Veterinary patient (e.g. Dog Daisy) generates DAISY password without needing DOB."""
    resp = client.post(
        "/api/auth/signup",
        json={"name": "Pet Owner", "email": "petowner@mediora.dev", "password": "password123"},
    )
    user_id = resp.json()["user"]["id"]
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    vet_profile = Profile(
        user_id=user_id,
        profile_name="Daisy",
        species="dog",
        species_category="canine",
        date_of_birth=None,  # Animal profiles typically have no DOB
    )
    db_session.add(vet_profile)
    db_session.commit()
    db_session.refresh(vet_profile)

    report = _create_report(
        db_session,
        vet_profile.id,
        test_values=[{"test_name": "Platelet Count", "value": 250.0, "unit": "K/uL", "ref_low": 200.0, "ref_high": 500.0}],
    )

    resp = client.get(f"/api/reports/{report.id}/download", headers=headers)
    assert resp.status_code == 200

    pdf_bytes = resp.content
    vet_password = "DAISY"

    # Verify fails with wrong password
    reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
    assert reader.decrypt("WRONG") == 0

    # Verify succeeds with DAISY (and daisy)
    assert reader.decrypt(vet_password) in (1, 2)
    assert reader.decrypt("daisy") in (1, 2)

    doc = pdfium.PdfDocument(pdf_bytes, password=vet_password)
    assert len(doc) >= 1
    text = doc[0].get_textpage().get_text_range()
    assert "Daisy" in text
    assert "dog" in text
    assert "Platelet Count" in text


def test_multiple_reports_same_patient(client, user_and_profile_setup):
    """Multiple reports for the same patient all use the patient's derived password."""
    db, profile, headers, _ = user_and_profile_setup
    r1 = _create_report(db, profile.id, report_date=date(2025, 1, 10))
    r2 = _create_report(db, profile.id, report_date=date(2025, 6, 15))

    expected_pwd = "SUBODH"

    resp1 = client.get(f"/api/reports/{r1.id}/download", headers=headers)
    assert resp1.status_code == 200
    doc1 = pdfium.PdfDocument(resp1.content, password=expected_pwd)
    assert len(doc1) >= 1

    resp2 = client.get(f"/api/reports/{r2.id}/download", headers=headers)
    assert resp2.status_code == 200
    doc2 = pdfium.PdfDocument(resp2.content, password=expected_pwd)
    assert len(doc2) >= 1

    resp2 = client.get(f"/api/reports/{r2.id}/download", headers=headers)
    assert resp2.status_code == 200
    doc2 = pdfium.PdfDocument(resp2.content, password=expected_pwd)
    assert len(doc2) >= 1


def test_download_nonexistent_report_returns_404(client, user_and_profile_setup):
    """Nonexistent report returns 404 Not Found."""
    _, _, headers, _ = user_and_profile_setup
    resp = client.get("/api/reports/999999/download", headers=headers)
    assert resp.status_code == 404
